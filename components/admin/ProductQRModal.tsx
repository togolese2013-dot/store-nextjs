"use client";

import { useRef } from "react";
import { X, Download, Printer } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://togolese.tg";

interface Props {
  product: {
    nom: string;
    reference: string;
    slug?: string | null;
    prix_unitaire: number;
    image_url?: string | null;
  };
  onClose: () => void;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " F";
}

export default function ProductQRModal({ product, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const slug    = product.slug ?? product.reference;
  const pageUrl = `${SITE_URL}/products/${slug}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pageUrl)}&format=png&margin=10`;

  async function handleDownload() {
    const res  = await fetch(qrUrl);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `qr-${slug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const content = printRef.current?.innerHTML ?? "";
    const win     = window.open("", "_blank", "width=600,height=800");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>QR — ${product.nom}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
          .label { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 24px; border: 2px solid #e2e8f0; border-radius: 16px; width: 260px; }
          .label img { width: 180px; height: 180px; }
          .label .nom { font-size: 14px; font-weight: 700; color: #1e293b; text-align: center; }
          .label .ref { font-size: 10px; color: #94a3b8; font-family: monospace; }
          .label .prix { font-size: 18px; font-weight: 800; color: #4f46e5; }
          .label .site { font-size: 9px; color: #94a3b8; }
          @media print { @page { margin: 0; size: 9cm 12cm; } body { min-height: unset; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800">Code QR produit</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
            <X size={16} />
          </button>
        </div>

        {/* Label preview */}
        <div ref={printRef} className="label flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-2xl mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR ${product.nom}`}
            width={180}
            height={180}
            className="rounded-lg"
          />
          <p className="nom font-bold text-slate-800 text-sm text-center leading-tight">{product.nom}</p>
          <p className="ref text-[10px] text-slate-400 font-mono">{product.reference}</p>
          <p className="prix text-xl font-extrabold text-indigo-600">{formatPrice(product.prix_unitaire)}</p>
          <p className="site text-[9px] text-slate-400">{SITE_URL}</p>
        </div>

        {/* URL preview */}
        <p className="text-[10px] text-slate-400 text-center break-all mb-4">{pageUrl}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          >
            <Download size={14} /> Télécharger
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
          >
            <Printer size={14} /> Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
