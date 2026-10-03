// ============================================================================
// src/pages/Gallery.tsx
//
// Photo gallery. Displays a responsive grid of images from /public/gallery/
// with a full-screen lightbox viewer (keyboard nav, click-outside to close).
//
// To add more images, extend the `photos` array below. To replace existing
// images, keep the same filenames and just overwrite them in
// public/gallery/.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// PHOTO DATA
// ---------------------------------------------------------------------------
// Images live in /public/gallery/. In the browser they're served from
// /gallery/<filename>.
//
// To add a caption, add a `caption` field to the object. To add more
// photos, append new objects.
// ---------------------------------------------------------------------------

interface GalleryPhoto {
  /** Path relative to the public folder, e.g. "/gallery/Photo1.jpg" */
  src: string;
  /** Alt text (accessibility). Keep it descriptive. */
  alt: string;
  /** Optional caption shown under the image in the lightbox. */
  caption?: string;
}

const photos: GalleryPhoto[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  return {
    src: `images/gallery/Photo${n}.jpg`,
    alt: `Flitedux training photo ${n}`,
    // caption: '', // ← uncomment and fill in when you have captions
  };
});

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const pageCss = `
.fx-gallery-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 20px 80px;
  font-family: sans-serif;
  box-sizing: border-box;
}
.fx-gallery-inner {
  max-width: 1280px;
  margin: 0 auto;
}

/* Header */
.fx-gallery-header {
  text-align: center;
  margin-bottom: 40px;
}
.fx-gallery-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #d95300;
  margin-bottom: 8px;
}
.fx-gallery-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
  line-height: 1.15;
}
@media (max-width: 640px) {
  .fx-gallery-title { font-size: 1.9rem; }
}
.fx-gallery-sub {
  font-size: 1.05rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 auto;
  max-width: 640px;
}

/* Grid */
.fx-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* Tile */
.fx-gallery-tile {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
}
.fx-gallery-tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(217, 83, 0, 0.15);
  border-color: #fed7aa;
}
.fx-gallery-tile:focus-visible {
  outline: 3px solid #d95300;
  outline-offset: 2px;
}

.fx-gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fx-gallery-img.loaded {
  opacity: 1;
}
.fx-gallery-tile:hover .fx-gallery-img.loaded {
  transform: scale(1.05);
}

/* Shimmer while loading */
.fx-gallery-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    #f1f5f9 0%,
    #e2e8f0 40%,
    #f1f5f9 80%
  );
  background-size: 200% 100%;
  animation: fxGalleryShimmer 1.4s linear infinite;
}
@keyframes fxGalleryShimmer {
  to { background-position: -200% 0; }
}

/* Hover overlay with zoom icon */
.fx-gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.fx-gallery-tile:hover .fx-gallery-overlay,
.fx-gallery-tile:focus-visible .fx-gallery-overlay {
  opacity: 1;
}
.fx-gallery-overlay-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transform: scale(0.9);
  transition: transform 0.2s ease;
}
.fx-gallery-tile:hover .fx-gallery-overlay-icon {
  transform: scale(1);
}

/* ---------- Lightbox ---------- */
.fx-lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 28, 0.92);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  animation: fxLightboxFade 0.2s ease-out both;
}
@keyframes fxLightboxFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fx-lightbox-content {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.fx-lightbox-img-wrap {
  position: relative;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fx-lightbox-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  display: block;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: fxLightboxZoom 0.25s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
@keyframes fxLightboxZoom {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

.fx-lightbox-caption {
  color: #e2e8f0;
  font-size: 0.9rem;
  text-align: center;
  max-width: 720px;
  line-height: 1.5;
  margin: 0;
}

.fx-lightbox-counter {
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

/* Close button */
.fx-lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.fx-lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

/* Arrow buttons */
.fx-lightbox-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
  z-index: 2;
}
.fx-lightbox-arrow:hover {
  background: #d95300;
  border-color: #d95300;
  transform: translateY(-50%) scale(1.05);
}
.fx-lightbox-arrow.prev { left: 20px; }
.fx-lightbox-arrow.next { right: 20px; }

@media (max-width: 640px) {
  .fx-lightbox-arrow {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
  .fx-lightbox-arrow.prev { left: 10px; }
  .fx-lightbox-arrow.next { right: 10px; }
  .fx-lightbox-close {
    top: 12px;
    right: 12px;
    width: 38px;
    height: 38px;
  }
  .fx-lightbox-img {
    max-width: 94vw;
    max-height: 70vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fx-gallery-img,
  .fx-gallery-tile,
  .fx-gallery-overlay,
  .fx-gallery-overlay-icon,
  .fx-lightbox-img {
    transition: none;
    animation: none;
  }
  .fx-gallery-shimmer { animation: none; }
}
`;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const Gallery: React.FC = () => {
  // Set of image indexes whose <img> has finished loading
  const [loaded, setLoaded] = useState<Set<number>>(new Set());

  // Which photo is open in the lightbox, or null
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const markLoaded = (i: number) => {
    setLoaded((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  const openLightbox = (i: number) => setOpenIndex(i);
  const closeLightbox = () => setOpenIndex(null);

  const showPrev = useCallback(() => {
    setOpenIndex((current) => {
      if (current === null) return null;
      return current === 0 ? photos.length - 1 : current - 1;
    });
  }, []);

  const showNext = useCallback(() => {
    setOpenIndex((current) => {
      if (current === null) return null;
      return current === photos.length - 1 ? 0 : current + 1;
    });
  }, []);

  // Keyboard nav: Esc closes, arrows navigate
  useEffect(() => {
    if (openIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openIndex, showPrev, showNext]);

  // Lock body scroll while the lightbox is open
  useEffect(() => {
    if (openIndex === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [openIndex]);

  const currentPhoto =
    openIndex !== null ? photos[openIndex] : null;

  return (
    <div className="fx-gallery-page">
      <style>{pageCss}</style>

      <div className="fx-gallery-inner">
        {/* Header */}
        <div className="fx-gallery-header">
          <div className="fx-gallery-eyebrow">Gallery</div>
          <h1 className="fx-gallery-title">
            Life at Flitedux
          </h1>
          <p className="fx-gallery-sub">
            Behind the scenes of our training programmes — instructors,
            candidates, and the aircraft they work on.
          </p>
        </div>

        {/* Grid */}
        <div className="fx-gallery-grid">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              className="fx-gallery-tile"
              onClick={() => openLightbox(i)}
              aria-label={`Open ${photo.alt} in fullscreen`}
            >
              {!loaded.has(i) && (
                <div className="fx-gallery-shimmer" aria-hidden="true" />
              )}
              <img
                src={photo.src}
                alt={photo.alt}
                className={`fx-gallery-img${loaded.has(i) ? ' loaded' : ''}`}
                loading="lazy"
                decoding="async"
                onLoad={() => markLoaded(i)}
                onError={() => markLoaded(i)}
              />
              <div className="fx-gallery-overlay" aria-hidden="true">
                <div className="fx-gallery-overlay-icon">⤢</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ---------- LIGHTBOX ---------- */}
      {openIndex !== null && currentPhoto && (
        <div
          className="fx-lightbox-backdrop"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          {/* Close button */}
          <button
            type="button"
            className="fx-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close photo viewer"
          >
            ✕
          </button>

          {/* Prev */}
          <button
            type="button"
            className="fx-lightbox-arrow prev"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            aria-label="Previous photo"
          >
            ‹
          </button>

          {/* Content */}
          <div
            className="fx-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fx-lightbox-img-wrap">
              <img
                src={currentPhoto.src}
                alt={currentPhoto.alt}
                className="fx-lightbox-img"
              />
            </div>

            {currentPhoto.caption && (
              <p className="fx-lightbox-caption">
                {currentPhoto.caption}
              </p>
            )}

            <div className="fx-lightbox-counter">
              {openIndex + 1} / {photos.length}
            </div>
          </div>

          {/* Next */}
          <button
            type="button"
            className="fx-lightbox-arrow next"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};