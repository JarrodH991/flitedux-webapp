// ============================================================================
// src/hooks/useProctoring.ts
//
// Browser-side proctoring for exam sessions.
//
// This hook attaches global listeners that:
//   1. Block copy, cut, paste, and right-click during the exam.
//   2. Capture WHAT was selected (if anything) when the attempt happened.
//   3. Debounce rapid repeated attempts so logs don't get flooded.
//   4. Expose the latest event to the caller for UI feedback (toast, etc.).
//
// ⚠️ IMPORTANT LIMITATIONS (be honest with yourself about these):
//   - This CANNOT detect Edge Copilot or any browser AI sidebar.
//     Highlighting text triggers no event that a page can observe.
//   - This CANNOT enumerate installed extensions. No web API exists.
//   - This CANNOT detect a second device, hidden overlay apps, or OS-level
//     screen readers that read text without triggering DOM events.
//
// What it CAN do: block the obvious clipboard paths and leave a detailed
// audit trail showing exactly what the candidate tried to take.
//
// 🔌 AWS: No backend interaction here. The caller passes `logEvent`, which
//         should be the ExamContext's logProctorEvent (which posts to your API).
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

/**
 * Event names this hook can produce. These should match the union type
 * accepted by `logProctorEvent` in your ExamContext. If your context uses
 * a different set of names, update this union to match.
 */
export type ProctorEventType =
  | 'copy-attempt'
  | 'cut-attempt'
  | 'paste-attempt'
  | 'right-click'
  | 'selection';

/**
 * Detail captured alongside the event, so the audit log is useful.
 * Everything here is best-effort — many fields will be null if the
 * browser doesn't allow access (e.g. clipboard read in a paste).
 */
export interface ProctorEventDetail {
  /** The text the candidate had selected when they triggered the event. */
  selectedText: string | null;
  /** How long the selection was, in characters. Useful for spotting big grabs. */
  selectionLength: number;
  /** The tag name of the element under the cursor or containing the selection. */
  targetTag: string | null;
  /** Optional class name of the target element (helps identify question cards). */
  targetClass: string | null;
  /** Which UI view the user was in when this fired ("question" / "review"). */
  view: string;
  /** Epoch ms — the caller can also timestamp, but this is the true source. */
  timestamp: number;
}

/**
 * Signature of the callback the hook calls on each event.
 * Should be your ExamContext's `logProctorEvent`.
 */
export type LogProctorEventFn = (
  type: ProctorEventType,
  detail?: Record<string, unknown>,
) => void | Promise<void>;

interface UseProctoringOptions {
  /** The current view. Blocking only happens when this is 'question' or 'review'. */
  view: string;
  /** The ExamContext logger. Called with every captured event. */
  logEvent: LogProctorEventFn;
  /**
   * How long to suppress duplicate events of the same type, in ms.
   * Defaults to 800ms — enough to swallow an angry double-click but short
   * enough that a determined multi-attempt is still logged.
   */
  debounceMs?: number;
  /** Whether to also block text selection entirely. Off by default. */
  blockSelection?: boolean;
}

interface UseProctoringResult {
  /** The most recent event, for showing a toast / warning in the UI. */
  lastEvent: { type: ProctorEventType; detail: ProctorEventDetail } | null;
  /** Call this to clear lastEvent after showing a toast. */
  clearLastEvent: () => void;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useProctoring({
  view,
  logEvent,
  debounceMs = 800,
  blockSelection = false,
}: UseProctoringOptions): UseProctoringResult {
  const [lastEvent, setLastEvent] = useState<{
    type: ProctorEventType;
    detail: ProctorEventDetail;
  } | null>(null);

  // Per-type debounce timestamps so copy and paste don't suppress each other.
  const lastFiredRef = useRef<Record<string, number>>({});

  // Keep the latest view in a ref so the event listeners (which are set up
  // once per effect run) always see the current value without re-binding.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const clearLastEvent = useCallback(() => setLastEvent(null), []);

  useEffect(() => {
    // Only install listeners when we're actually in the exam.
    // The effect re-runs whenever `view` changes, which is what we want.
    const isExamActive = view === 'question' || view === 'review';
    if (!isExamActive) return;

    // -------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------

    /**
     * Read the current selection as plain text, safely.
     * Returns null if nothing is selected.
     */
    const readSelection = (): {
      text: string | null;
      length: number;
    } => {
      try {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return { text: null, length: 0 };
        const text = sel.toString();
        return { text: text || null, length: text.length };
      } catch {
        return { text: null, length: 0 };
      }
    };

    /**
     * Best-effort description of the element the user was interacting with.
     * We prefer the selection's anchor node's parent, then fall back to
     * whatever element the event target was.
     */
    const describeTarget = (
      eventTarget: EventTarget | null,
      selectionNode: Node | null,
    ): { tag: string | null; className: string | null } => {
      const el = (() => {
        if (selectionNode) {
          const node =
            selectionNode.nodeType === Node.ELEMENT_NODE
              ? (selectionNode as Element)
              : selectionNode.parentElement;
          if (node) return node;
        }
        if (eventTarget instanceof Element) return eventTarget;
        if (eventTarget instanceof Node) return eventTarget.parentElement;
        return null;
      })();

      if (!el) return { tag: null, className: null };
      return {
        tag: el.tagName ? el.tagName.toLowerCase() : null,
        className: (el as Element).className
          ? String((el as Element).className).slice(0, 120)
          : null,
      };
    };

    /**
     * Fire the log event, subject to per-type debouncing.
     */
    const fire = (
      type: ProctorEventType,
      detail: Omit<ProctorEventDetail, 'timestamp' | 'view'>,
    ) => {
      const now = Date.now();
      const last = lastFiredRef.current[type] ?? 0;
      if (now - last < debounceMs) return; // suppressed
      lastFiredRef.current[type] = now;

      const fullDetail: ProctorEventDetail = {
        ...detail,
        view: viewRef.current,
        timestamp: now,
      };

      setLastEvent({ type, detail: fullDetail });
      // Fire-and-forget. If logging fails we don't want to break the exam.
      void logEvent(type, fullDetail as unknown as Record<string, unknown>);
    };

    // -------------------------------------------------------------------
    // Event handlers
    // -------------------------------------------------------------------

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const sel = readSelection();
      const anchor =
        window.getSelection()?.anchorNode ?? null;
      const target = describeTarget(e.target, anchor);
      fire('copy-attempt', {
        selectedText: sel.text,
        selectionLength: sel.length,
        targetTag: target.tag,
        targetClass: target.className,
      });
    };

    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      const sel = readSelection();
      const anchor = window.getSelection()?.anchorNode ?? null;
      const target = describeTarget(e.target, anchor);
      fire('cut-attempt', {
        selectedText: sel.text,
        selectionLength: sel.length,
        targetTag: target.tag,
        targetClass: target.className,
      });
    };

    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      // We can't read clipboard contents for privacy reasons without
      // permission, but we can log that the attempt happened and where.
      const target = describeTarget(e.target, null);
      fire('paste-attempt', {
        selectedText: null,
        selectionLength: 0,
        targetTag: target.tag,
        targetClass: target.className,
      });
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const sel = readSelection();
      const target = describeTarget(e.target, null);
      fire('right-click', {
        selectedText: sel.text,
        selectionLength: sel.length,
        targetTag: target.tag,
        targetClass: target.className,
      });
    };

    // Optional: also track selections so you know what they highlighted,
    // even if they didn't copy. Off by default to avoid noise.
    let selectionTimer: ReturnType<typeof setTimeout> | null = null;
    const onSelectionChange = () => {
      if (!blockSelection) return;
      if (selectionTimer) clearTimeout(selectionTimer);
      selectionTimer = setTimeout(() => {
        const sel = readSelection();
        if (!sel.text || sel.length < 3) return;
        const anchor = window.getSelection()?.anchorNode ?? null;
        const target = describeTarget(null, anchor);
        fire('selection', {
          selectedText: sel.text,
          selectionLength: sel.length,
          targetTag: target.tag,
          targetClass: target.className,
        });
      }, 400); // wait for selection to settle
    };

    // -------------------------------------------------------------------
    // Attach / detach
    // -------------------------------------------------------------------
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    if (blockSelection) {
      document.addEventListener('selectionchange', onSelectionChange);
    }

    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('selectionchange', onSelectionChange);
      if (selectionTimer) clearTimeout(selectionTimer);
    };
  }, [view, logEvent, debounceMs, blockSelection]);

  return { lastEvent, clearLastEvent };
}