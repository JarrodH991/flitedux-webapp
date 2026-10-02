// ============================================================================
// src/components/exam/WebcamPreview.tsx
//
// Small webcam preview for the exam room. Requests camera access, streams
// to a <video> element, and reports status to the parent.
//
// Includes a Retry button when the camera fails, and better diagnostics
// in the console so you can see exactly what went wrong.
//
// 🔌 AWS: To make proctoring real, use a third-party service (ProctorU,
//         Proctorio, Examity). Do NOT build AI proctoring yourself.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';

const camCss = `
.fx-cam {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #0f172a;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #1e293b;
}

.fx-cam-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scaleX(-1);
}

.fx-cam-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: #f8fafc;
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0));
  pointer-events: none;
}

.fx-cam-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #94a3b8;
  position: relative;
}
.fx-cam-dot.live    { background: #22c55e; }
.fx-cam-dot.request { background: #eab308; }
.fx-cam-dot.error   { background: #ef4444; }

.fx-cam-dot.live::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #22c55e;
  animation: fxCamPulse 1.6s ease-in-out infinite;
}
@keyframes fxCamPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50%      { transform: scale(2.2); opacity: 0; }
}

.fx-cam-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  color: #cbd5e1;
  font-family: sans-serif;
  font-size: 0.78rem;
  line-height: 1.4;
}

.fx-cam-fallback-icon {
  font-size: 1.6rem;
  opacity: 0.6;
}

.fx-cam-retry {
  margin-top: 6px;
  padding: 6px 14px;
  background: #d95300;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
.fx-cam-retry:hover { background: #b54400; }

.fx-cam-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #94a3b8;
  position: absolute;
  top: 8px;
  left: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .fx-cam-dot.live::after { animation: none; }
}
`;

export type WebcamStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'error';

interface WebcamPreviewProps {
  onStatusChange?: (status: WebcamStatus) => void;
  onStreamLost?: () => void;
  label?: string;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  onStatusChange,
  onStreamLost,
  label = 'Camera',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Report status to parent
  useEffect(() => {
    onStatusChange?.(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Stop the current stream (if any)
  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  // Start the camera
  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus('requesting');
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage('Camera API is not supported in this browser.');
        return;
      }

      let stream: MediaStream;
      try {
        // Simple constraints work best across browsers.
        // Over-constraining (facingMode, ideal width/height) causes failures
        // on some webcams.
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : '';
        const msg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.error('[WebcamPreview] getUserMedia failed:', name, msg);

        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setStatus('denied');
          setErrorMessage(
            'Camera access was denied. Click the camera icon in your browser address bar and allow access, then retry.',
          );
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setStatus('error');
          setErrorMessage('No camera found on this device.');
        } else if (name === 'NotReadableError') {
          setStatus('error');
          setErrorMessage(
            'Camera is in use by another application. Close other apps using the camera and retry.',
          );
        } else if (name === 'AbortError') {
          setStatus('error');
          setErrorMessage('Camera access was aborted. Please retry.');
        } else {
          setStatus('error');
          setErrorMessage(msg || 'Could not access the camera.');
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      // Wait for the video element to be in the DOM. In some cases the ref
      // is null on the very first tick after mounting.
      let attempts = 0;
      while (!videoRef.current && attempts < 20) {
        await new Promise((r) => setTimeout(r, 50));
        attempts += 1;
      }

      const video = videoRef.current;
      if (!video) {
        // eslint-disable-next-line no-console
        console.error('[WebcamPreview] video element never mounted');
        setStatus('error');
        setErrorMessage('Internal error: video element unavailable.');
        return;
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      // Try to play. On some browsers this needs a user gesture, so we
      // swallow the error and let the retry button handle it.
      try {
        await video.play();
      } catch (playErr) {
        // eslint-disable-next-line no-console
        console.warn('[WebcamPreview] play() failed:', playErr);
        // Don't treat this as fatal — the video may still work when the
        // user interacts with the page.
      }

      // Listen for the stream ending (device unplugged, permission revoked)
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (cancelled) return;
          // eslint-disable-next-line no-console
          console.warn('[WebcamPreview] track ended unexpectedly');
          setStatus('error');
          setErrorMessage('Camera stream ended unexpectedly.');
          onStreamLost?.();
        });
      });

      setStatus('live');
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [onStreamLost, stopStream, retryKey]);

  // Retry handler
  const handleRetry = () => {
    stopStream();
    setRetryKey((k) => k + 1);
  };

  const dotClass =
    status === 'live' ? 'live'
    : status === 'requesting' ? 'request'
    : status === 'denied' || status === 'error' ? 'error'
    : '';

  const statusText =
    status === 'live' ? 'Recording'
    : status === 'requesting' ? 'Starting camera…'
    : status === 'denied' ? 'Access denied'
    : status === 'error' ? 'Unavailable'
    : 'Idle';

  return (
    <>
      <style>{camCss}</style>

      <div className="fx-cam" role="region" aria-label="Webcam preview">
        <video
          ref={videoRef}
          className="fx-cam-video"
          playsInline
          muted
          autoPlay
          aria-hidden="true"
        />

        {status !== 'live' && (
          <div className="fx-cam-fallback">
            <div className="fx-cam-fallback-icon" aria-hidden="true">
              {status === 'requesting' ? '⏳' : '📷'}
            </div>
            <div>
              {status === 'idle' && 'Waiting to start…'}
              {status === 'requesting' && 'Requesting camera access…'}
              {status === 'denied' && 'Camera access denied'}
              {status === 'error' && 'Camera unavailable'}
            </div>
            {errorMessage && (
              <div style={{ fontSize: '0.7rem', opacity: 0.7, maxWidth: 240 }}>
                {errorMessage}
              </div>
            )}
            {(status === 'error' || status === 'denied') && (
              <button
                type="button"
                className="fx-cam-retry"
                onClick={handleRetry}
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="fx-cam-label">{label}</div>
        <div className="fx-cam-overlay">
          <span className={`fx-cam-dot ${dotClass}`} aria-hidden="true" />
          <span>{statusText}</span>
        </div>
      </div>
    </>
  );
};