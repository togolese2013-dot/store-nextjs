import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";

interface Props {
  title:       string;
  description: string;
  icon:        LucideIcon;
  iconClass?:  string;
  maxWidth?:   "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  children:    React.ReactNode;
}

const MAX_W: Record<NonNullable<Props["maxWidth"]>, string> = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export default function AdminZonePage({
  title,
  description,
  icon: Icon,
  iconClass = "bg-slate-100 text-slate-600",
  maxWidth  = "5xl",
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`${MAX_W[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>

        {/* Back */}
        <Link
          href="/admin/config"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Administration
        </Link>

        {/* Page header */}
        <div className="flex items-start gap-4 mb-8 pb-8 border-b border-slate-200">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-800 text-2xl text-slate-900 leading-tight">{title}</h1>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Content */}
        {children}

      </div>
    </div>
  );
}
