"use client";

import { useRef } from "react";

export default function CertificateActions({
  fingerprint,
  txHash,
  dataHash,
}: {
  fingerprint: string;
  txHash: string;
  dataHash: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function print() {
    // Scope printing to the certificate panel so "Save as PDF" exports a clean page.
    const body = document.body;
    const scope = ref.current;
    if (!scope) {
      window.print();
      return;
    }
    body.classList.add("print-scope");
    scope.id = "print-target";
    window.print();
    body.classList.remove("print-scope");
    scope.removeAttribute("id");
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  return (
    <div ref={ref} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
      <button className="btn" onClick={print}>
        Print / Save as PDF
      </button>
      <button className="btn btn-ghost" onClick={() => void copy(dataHash)}>
        Copy verification hash
      </button>
      {(txHash.startsWith("0x") || txHash.length > 32) && (
        <button className="btn btn-ghost" onClick={() => void copy(txHash)}>
          Copy tx hash
        </button>
      )}
      <span className="chip" title={fingerprint}>
        fingerprint {fingerprint}
      </span>
    </div>
  );
}