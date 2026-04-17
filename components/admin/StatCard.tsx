interface StatCardProps {
  title:      string;
  value:      string | number;
  icon:       React.ElementType;
  iconColor?: string;
  badge?:     React.ReactNode;
}

export default function StatCard({ title, value, icon: Icon, iconColor = "text-slate-400", badge }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight">{title}</p>
        <Icon className={`w-8 h-8 ${iconColor} opacity-20`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      {badge && <div className="mt-3">{badge}</div>}
    </div>
  );
}
