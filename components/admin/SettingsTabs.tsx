"use client";

import { useState } from "react";
import { Settings, Store } from "lucide-react";
import AdminZonePage from "./AdminZonePage";
import GeneralSettingsForm from "./GeneralSettingsForm";
import BoutiqueSettingsPage from "@/components/boutique/SettingsPage";

type Tab = "site" | "boutique";

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: "site",     label: "Général du site", icon: Settings },
  { id: "boutique", label: "Réglages boutique", icon: Store },
];

function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-2 mb-8">
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === t.id
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <t.icon className="w-4 h-4" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsTabs({ settings }: { settings: Record<string, string> }) {
  const [tab, setTab] = useState<Tab>("site");

  if (tab === "boutique") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>
        <BoutiqueSettingsPage />
      </div>
    );
  }

  return (
    <AdminZonePage
      title="Réglages généraux"
      description="Nom du site, barre d'annonce et contacts WhatsApp flottants."
      icon={Settings}
      iconClass="bg-slate-100 text-slate-700"
      maxWidth="3xl"
    >
      <TabSwitcher tab={tab} onChange={setTab} />
      <GeneralSettingsForm settings={settings} />
    </AdminZonePage>
  );
}
