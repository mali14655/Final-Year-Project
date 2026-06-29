import React, { useCallback, useEffect, useRef, useState } from "react";
import { cropImageToSquareBlob, loadImageFromFile } from "../../utils/avatarCrop";

const PREVIEW_SIZE = 280;
const OUTPUT_SIZE = 400;

function AvatarCropModal({ open, file, onClose, onConfirm }) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (!open || !file) {
      setImage(null);
      setImageUrl(null);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      return undefined;
    }

    let active = true;
    let objectUrl = null;

    loadImageFromFile(file)
      .then(({ img, url }) => {
        if (active) {
          objectUrl = url;
          setImageUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          setImage(img);
          setScale(1);
          setOffset({ x: 0, y: 0 });
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (active) onClose?.();
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, file, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const getDrawMetrics = useCallback(() => {
    if (!image) return null;

    const baseScale = Math.max(PREVIEW_SIZE / image.width, PREVIEW_SIZE / image.height);
    const drawScale = baseScale * scale;
    const drawWidth = image.width * drawScale;
    const drawHeight = image.height * drawScale;
    const x = (PREVIEW_SIZE - drawWidth) / 2 + offset.x;
    const y = (PREVIEW_SIZE - drawHeight) / 2 + offset.y;

    return { drawWidth, drawHeight, x, y };
  }, [image, scale, offset]);

  const handlePointerDown = (event) => {
    event.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  useEffect(() => {
    if (!dragging) return undefined;

    const handlePointerMove = (event) => {
      setOffset({
        x: dragStart.current.offsetX + (event.clientX - dragStart.current.x),
        y: dragStart.current.offsetY + (event.clientY - dragStart.current.y),
      });
    };

    const handlePointerUp = () => setDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging]);

  const handleConfirm = async () => {
    if (!image) return;

    setSaving(true);
    try {
      const previewScale = PREVIEW_SIZE / OUTPUT_SIZE;
      const blob = await cropImageToSquareBlob(image, {
        scale,
        offsetX: offset.x / previewScale,
        offsetY: offset.y / previewScale,
        outputSize: OUTPUT_SIZE,
      });
      const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      await onConfirm?.(croppedFile);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  if (!open || !file) {
    return null;
  }

  const metrics = getDrawMetrics();

  return (
    <div className="modal-overlay avatar-crop-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-content avatar-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Adjust profile photo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="avatar-crop-header">
          <div>
            <p className="eyebrow">Profile photo</p>
            <h2 className="heading-md" style={{ margin: 0 }}>
              Position your photo
            </h2>
          </div>
          <button type="button" className="settings-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="settings-hint avatar-crop-hint">
          Drag to reposition. Use the slider to zoom. Your photo will be saved as a centered circle.
        </p>

        <div className="avatar-crop-stage">
          <div
            className="avatar-crop-preview"
            onPointerDown={handlePointerDown}
            style={{ cursor: dragging ? "grabbing" : "grab" }}
          >
            {imageUrl && metrics && (
              <img
                src={imageUrl}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: "absolute",
                  width: metrics.drawWidth,
                  height: metrics.drawHeight,
                  left: metrics.x,
                  top: metrics.y,
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
            <div className="avatar-crop-ring" aria-hidden="true" />
          </div>
        </div>

        <label className="label" htmlFor="avatar-crop-zoom">
          Zoom
        </label>
        <input
          id="avatar-crop-zoom"
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="avatar-crop-slider"
        />

        <div className="avatar-crop-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={saving || !image}>
            {saving ? "Saving..." : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropModal;
