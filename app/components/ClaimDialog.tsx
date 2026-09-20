"use client";

import { useEffect } from "react";
import SubmitClaim from "./SubmitClaim";

export default function ClaimDialog({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
      aria-hidden={false}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Submit a claim"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 style={{ margin: 0 }}>Submit a claim</h2>
            <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
              Log a green action — it gets checked against satellite + weather data before credits are issued.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close submit dialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <SubmitClaim
            onSubmitted={() => {
              onSubmitted?.();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("carbontrace:claims-updated"));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
