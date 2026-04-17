"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { clsx } from "clsx";
import PageHeader from "@/components/admin/PageHeader";

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    total:   number;
    created: number;
    updated: number;
    skipped: number;
    errors:  Array<{ row: number; reference: string; error: string }>;
  };
}

export default function ImportExportManager() {
  const [importing,    setImporting]    = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Export CSV ───────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/products/export");
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'export");
        return;
      }
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = `produits-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur réseau lors de l'export");
    } finally {
      setExporting(false);
    }
  }

  // ─── Import CSV ───────────────────────────────────────────
  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportResult({ success: false, message: "Le fichier doit être au format CSV (.csv)" });
      return;
    }

    setImporting(true);
    setImportResult(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res  = await fetch("/api/admin/products/import", { method: "POST", body: fd });
      const data = await res.json();
      setImportResult(data);
    } catch {
      setImportResult({ success: false, message: "Erreur réseau lors de l'import" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-8">

      <PageHeader
        title="Import / Export"
        subtitle="Importez ou exportez votre catalogue produits au format CSV"
        accent="brand"
      />

      {/* ── Export ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-display font-700 text-slate-900 text-base">Exporter les produits</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Télécharge tous les produits actifs au format CSV — prêt à réimporter.
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {exporting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Export en cours…</>
            : <><Download className="w-4 h-4" /> Télécharger le CSV</>
          }
        </button>
      </div>

      {/* ── Import ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <h2 className="font-display font-700 text-slate-900 text-base">Importer des produits</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Importe ou met à jour des produits en masse via un fichier CSV.
              Les produits existants (même référence) seront mis à jour.
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
            dragOver
              ? "border-brand-500 bg-brand-50"
              : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileChange}
            className="sr-only"
          />
          {importing ? (
            <div className="flex flex-col items-center gap-2 text-brand-700">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm font-semibold">Import en cours…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <FileText className="w-10 h-10" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-slate-600">
                Glisse un fichier CSV ici ou <span className="text-brand-700 underline">parcourir</span>
              </p>
              <p className="text-xs text-slate-400">CSV uniquement — colonnes : reference, nom, prix_unitaire…</p>
            </div>
          )}
        </div>

        {/* Format reference */}
        <details className="mt-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-800">
            Format CSV attendu
          </summary>
          <div className="mt-2 bg-slate-50 rounded-xl p-3 font-mono overflow-x-auto whitespace-nowrap">
            reference,nom,description,categorie_id,prix_unitaire,stock_boutique,remise,neuf,image_url,actif<br/>
            casque-pro,Casque Pro,Description…,1,25000,10,0,1,,1
          </div>
        </details>
      </div>

      {/* ── Résultat import ── */}
      {importResult && (
        <div className={clsx(
          "rounded-2xl border p-5",
          importResult.success
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {importResult.success
                ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                : <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              }
              <p className={clsx(
                "text-sm font-bold",
                importResult.success ? "text-green-800" : "text-red-700"
              )}>
                {importResult.message}
              </p>
            </div>
            <button onClick={() => setImportResult(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {importResult.details && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Créés",      value: importResult.details.created, color: "text-green-700" },
                { label: "Mis à jour", value: importResult.details.updated, color: "text-blue-700" },
                { label: "Ignorés",    value: importResult.details.skipped, color: "text-amber-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl px-4 py-3 text-center border border-slate-100">
                  <p className={clsx("text-2xl font-bold", color)}>{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          )}

          {(importResult.details?.errors?.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-red-700 mb-2">Erreurs ({importResult.details?.errors?.length ?? 0})</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {(importResult.details?.errors ?? []).map((err, i) => (
                  <div key={i} className="text-xs bg-white rounded-xl px-3 py-2 border border-red-100">
                    <span className="font-semibold text-slate-700">Ligne {err.row}</span>
                    {err.reference && <span className="text-slate-500"> · {err.reference}</span>}
                    <span className="text-red-600"> — {err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
