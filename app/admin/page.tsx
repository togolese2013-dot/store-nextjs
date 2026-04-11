import Link from "next/link";
import {
  Users, MessageCircle, Send, Star,
  ShoppingCart, Package, FolderOpen, Tag,
  PlusCircle, Receipt, Boxes as BoxesIcon, FileText, FilePlus,
  Warehouse, Upload,
  Settings, Image, MapPin, Palette, Globe, CreditCard, Link2,
  ArrowRight, Zap,
} from "lucide-react";

const GROUPS = [
  {
    label: "CRM",
    href: "/admin/crm",
    description: "Clients, messages et avis",
    accent: "#7C3AED",
    bg: "from-violet-600 to-violet-800",
    items: [
      { icon: Users,         desc: "Clients & statut VIP" },
      { icon: MessageCircle, desc: "Messages WhatsApp" },
      { icon: Send,          desc: "Diffusion & broadcast" },
      { icon: Star,          desc: "Avis clients" },
    ],
  },
  {
    label: "BOUTIQUE",
    href: "/admin/orders",
    description: "Ventes, commandes, stock & facturation",
    accent: "#1E3A8A",
    bg: "from-blue-700 to-blue-900",
    items: [
      { icon: ShoppingCart, desc: "Commandes" },
      { icon: Package,      desc: "Produits & variantes" },
      { icon: PlusCircle,   desc: "Nouvelle vente" },
      { icon: Receipt,      desc: "Ventes" },
      { icon: BoxesIcon,    desc: "Stock boutique" },
      { icon: FileText,     desc: "Factures" },
      { icon: FilePlus,     desc: "Proformat" },
    ],
  },
  {
    label: "MAGASIN",
    href: "/admin/entrepots",
    description: "Stocks et entrepôts",
    accent: "#D97706",
    bg: "from-amber-500 to-amber-700",
    items: [
      { icon: Warehouse, desc: "Entrepôts & stocks" },
      { icon: Upload,    desc: "Import / Export CSV" },
    ],
  },
  {
    label: "STORE",
    href: "/admin/settings",
    description: "Configuration et paramètres",
    accent: "#0F766E",
    bg: "from-teal-600 to-teal-800",
    items: [
      { icon: Settings,   desc: "Réglages généraux" },
      { icon: MapPin,     desc: "Zones de livraison" },
      { icon: Palette,    desc: "Apparence" },
      { icon: CreditCard, desc: "Paiements" },
      { icon: Globe,      desc: "WhatsApp API" },
      { icon: Link2,      desc: "Domaine & URL" },
      { icon: Image,      desc: "Hero & Bannières" },
      { icon: Users,      desc: "Utilisateurs" },
    ],
  },
];

export default function AdminHubPage() {
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-auto">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center">
          <Zap className="w-5 h-5 text-accent-400" fill="currentColor" />
        </div>
        <div>
          <p className="font-display font-800 text-sm text-slate-900 leading-none">Togolese Shop</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Administration</p>
        </div>
        <Link href="/" target="_blank"
          className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors"
        >
          Voir le site →
        </Link>
      </header>

      {/* Hub */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-4">
          <div className="text-center mb-10">
            <h1 className="font-display font-800 text-3xl text-slate-900">Espace Admin</h1>
            <p className="text-slate-500 mt-2">Choisissez une section pour commencer</p>
          </div>

          {GROUPS.map(group => (
            <Link key={group.label} href={group.href}
              className="group flex items-center gap-5 p-6 bg-white rounded-3xl border-2 border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${group.bg} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}>
                <span className="text-white font-black text-2xl tracking-tight">{group.label[0]}</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-xl tracking-widest text-slate-800 group-hover:text-slate-900">
                  {group.label}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{group.description}</p>
                {/* Mini icons row */}
                <div className="flex gap-2 mt-3">
                  {group.items.map((item, i) => (
                    <div key={i}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${group.accent}18`, color: group.accent }}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
