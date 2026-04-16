"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import type { Client } from "@/lib/admin-db";

export default function ClientEditForm({ client }: { client: Client }) {
  const router = useRouter();
  const [nom,     setNom]     = useState(client.nom);
  const [email,   setEmail]   = useState(client.email);
  const [adresse, setAdresse] = useState(client.adresse);
  const [ville,   setVille]   = useState(client.ville);
  const [statut,  setStatut]  = useState<Client["statut"]>(client.statut);
  const [notes,   setNotes]   = useState(client.notes);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ nom, email, adresse, ville, statut, notes }),
    });
    setLoading(false);
    setMsg(res.ok ? "Client mis à jour ✓" : "Erreur");
    if (res.ok) router.refresh();
  }

  async function deleteClient() {
    if (!confirm("Supprimer définitivement ce client ? Son historique de commandes sera conservé.")) return;
    const res = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/crm");
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Informations client</h2>

      {msg && (
        <div className={`px-3 py-2 rounded-xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}
        </div>
      )}

      <div>
        <label className={labelCls}>Téléphone</label>
        <p className="text-sm font-mono text-slate-700 bg-slate-50 px-3 py-2.5 rounded-xl">{client.telephone}</p>
      </div>
      <div>
        <label className={labelCls}>Nom</label>
        <input className={inputCls} value={nom} onChange={e => setNom(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Ville</label>
        <input className={inputCls} value={ville} onChange={e => setVille(e.target.value)} placeholder="ex: Lomé" />
      </div>
      <div>
        <label className={labelCls}>Adresse</label>
        <input className={inputCls} value={adresse} onChange={e => setAdresse(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Statut</label>
        <select className={inputCls} value={statut} onChange={e => setStatut(e.target.value as Client["statut"])}>
          <option value="normal">Normal</option>
          <option value="vip">VIP</option>
          <option value="blacklist">Blacklist</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Notes internes</label>
        <textarea className={`${inputCls} resize-none`} rows={3} value={notes}
          onChange={e => setNotes(e.target.value)} placeholder="Notes visibles uniquement par l'admin…" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-700 text-white text-sm font-bold hover:bg-indigo-800 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder
        </button>
        <button onClick={deleteClient}
          className="p-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          title="Supprimer le client"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
