"use client";

import { useState } from "react";
import { Send, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-sans";

export default function BroadcastClient() {
  const [numbers, setNumbers] = useState<string[]>([""]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState<{ succeeded: number; failed: number; total: number } | null>(null);
  const [error,   setError]   = useState("");

  const validNumbers = numbers.filter(n => n.trim().length >= 8);

  function addNumber() { setNumbers(n => [...n, ""]); }
  function removeNumber(i: number) { setNumbers(n => n.filter((_, j) => j !== i)); }
  function updateNumber(i: number, v: string) { setNumbers(n => n.map((x, j) => j === i ? v : x)); }

  function pasteNumbers(text: string) {
    const nums = text.split(/[\n,;]+/).map(n => n.trim()).filter(Boolean);
    setNumbers([...numbers.filter(n => n.trim()), ...nums]);
  }

  async function send() {
    if (!message.trim() || validNumbers.length === 0) return;
    setError(""); setResult(null); setSending(true);
    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ numbers: validNumbers, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setResult(data);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {result && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          Diffusion terminée : <strong>{result.succeeded}</strong> envoyé{result.succeeded > 1 ? "s" : ""}{result.failed > 0 ? `, ${result.failed} échec${result.failed > 1 ? "s" : ""}` : ""}
        </div>
      )}

      {/* Message */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Message</h2>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            Texte du message *
          </label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Bonjour ! Découvrez nos nouvelles offres exclusives 🎉&#10;Visitez notre boutique : store.togolese.net"
            rows={5}
            className={`${inputCls} resize-none`}
          />
          <p className="text-xs text-slate-400 mt-1">{message.length} caractère{message.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Numbers */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-display font-700 text-slate-900">Destinataires</h2>
          <span className="text-xs text-slate-400">{validNumbers.length} numéro{validNumbers.length > 1 ? "s" : ""} valide{validNumbers.length > 1 ? "s" : ""}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            Coller plusieurs numéros d'un coup (séparés par retour à la ligne ou virgule)
          </label>
          <textarea
            rows={2}
            placeholder="22890000001, 22890000002&#10;22890000003"
            onPaste={e => { e.preventDefault(); pasteNumbers(e.clipboardData.getData("text")); }}
            className={`${inputCls} resize-none text-slate-400`}
            readOnly
          />
          <p className="text-xs text-slate-400 mt-1">Collez du texte dans ce champ pour ajouter plusieurs numéros</p>
        </div>

        <div className="space-y-2">
          {numbers.map((num, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="tel" value={num} onChange={e => updateNumber(i, e.target.value)}
                placeholder="22890000000" className={`${inputCls} flex-1`}
              />
              {numbers.length > 1 && (
                <button onClick={() => removeNumber(i)}
                  className="p-2.5 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addNumber}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter un numéro
        </button>
      </div>

      <button
        onClick={send}
        disabled={sending || !message.trim() || validNumbers.length === 0}
        className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1da851] transition-colors disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending
          ? `Envoi en cours… (${validNumbers.length} destinataires)`
          : `Envoyer à ${validNumbers.length} numéro${validNumbers.length > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
