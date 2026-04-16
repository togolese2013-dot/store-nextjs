// Pure presentational component — no "use client" needed (no hooks)

const ACCENT_MAP = {
  amber: {
    active:     "border-amber-500 text-amber-600",
    activeBadge:"bg-amber-100 text-amber-700",
  },
  brand: {
    active:     "border-brand-900 text-brand-900",
    activeBadge:"bg-brand-100 text-brand-800",
  },
  emerald: {
    active:     "border-emerald-600 text-emerald-700",
    activeBadge:"bg-emerald-100 text-emerald-700",
  },
  indigo: {
    active:     "border-indigo-600 text-indigo-700",
    activeBadge:"bg-indigo-100 text-indigo-700",
  },
} as const;

export type TabAccent = keyof typeof ACCENT_MAP;

export interface TabItem {
  key:   string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface TabBarProps {
  tabs:     TabItem[];
  active:   string;
  onChange: (key: string) => void;
  accent?:  TabAccent;
}

export default function TabBar({ tabs, active, onChange, accent = "brand" }: TabBarProps) {
  const a = ACCENT_MAP[accent];

  return (
    <div className="flex gap-0 border-b border-slate-100">
      {tabs.map(tab => {
        const Icon     = tab.icon;
        const isActive = active === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              isActive
                ? a.active
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive ? a.activeBadge : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
