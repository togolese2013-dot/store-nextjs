"use client";

import { useState, useEffect, useCallback } from "react";
import { DatabaseBackup, Download, RefreshCw, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface BackupFile {
  filename: string;
  size: number;         // bytes
  createdAt: string;    // ISO string
}

interface BackupStatus {
  backups: BackupFile[];
  nextScheduled: string;
  lastNightly: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export default function BackupManager() {
  const [status, setStatus]       = useState<BackupStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [running, setRunning]     = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backups");
      if (res.ok) setStatus(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleManualBackup() {
    setRunning(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }

      // Trigger browser download from the streamed response
      const blob        = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match       = disposition.match(/filename="([^"]+)"/);
      const filename    = match?.[1] || `backup_${Date.now()}.sql.gz`;

      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setSuccess(`Sauvegarde téléchargée : ${filename}`);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la sauvegarde.");
    } finally {
      setRunning(false);
    }
  }

  async function handleDownload(filename: string) {
    setDownloading(filename);
    try {
      const res = await fetch(`/api/admin/backups/${filename}`);
      if (!res.ok) throw new Error("Fichier introuvable.");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du téléchargement.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <DatabaseBackup className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Sauvegarde de la base de données</h2>
            <p className="text-sm text-slate-500">
              Backup automatique chaque nuit à 02h00 UTC · 7 fichiers conservés
            </p>
          </div>
        </div>

        <button
          onClick={handleManualBackup}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {running ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {running ? "En cours…" : "Sauvegarder maintenant"}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Last nightly info */}
      {status && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
          <Clock className="w-4 h-4 shrink-0 text-slate-400" />
          {status.lastNightly ? (
            <>Dernier backup automatique : <span className="font-medium text-slate-800 ml-1">{formatDate(status.lastNightly)}</span></>
          ) : (
            <>Aucun backup automatique depuis le démarrage du serveur · prochain à <span className="font-medium ml-1">02:00 UTC</span></>
          )}
        </div>
      )}

      {/* Backup list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700">Sauvegardes disponibles</h3>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-6 text-center">Chargement…</div>
        ) : !status || status.backups.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-lg">
            Aucune sauvegarde disponible sur le serveur.
            <br />
            <span className="text-xs">Les fichiers sont temporaires — utilisez le bouton ci-dessus pour télécharger.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {status.backups.map((b) => (
              <div
                key={b.filename}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-mono text-slate-700">{b.filename}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(b.createdAt)} · {formatSize(b.size)}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(b.filename)}
                  disabled={downloading === b.filename}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-60"
                >
                  {downloading === b.filename ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        ⚠️ Les fichiers sur le serveur sont temporaires (réinitialisés au redéploiement).
        Les backups GitHub Actions offrent une conservation de 90 jours.
      </p>
    </div>
  );
}
