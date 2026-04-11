import { CheckCircle2, Clock, Package, Truck, XCircle, Circle } from "lucide-react";

export interface OrderEvent {
  id: number;
  order_id: number;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string | Date;
}

interface Props {
  events: OrderEvent[];
  currentStatus: string;
}

const STEPS = [
  { key: "pending",   label: "En attente",  Icon: Clock },
  { key: "confirmed", label: "Confirmée",   Icon: CheckCircle2 },
  { key: "shipped",   label: "Expédiée",    Icon: Package },
  { key: "delivered", label: "Livrée",      Icon: Truck },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  pending:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-300",  icon: "text-amber-500" },
  confirmed: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-300",   icon: "text-blue-500" },
  shipped:   { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300", icon: "text-purple-500" },
  delivered: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-300",  icon: "text-green-500" },
  cancelled: { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-300",    icon: "text-red-500" },
};

function fmtDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function OrderTimeline({ events, currentStatus }: Props) {
  const isCancelled = currentStatus === "cancelled";

  // Map event statuses to a set for quick lookup
  const doneStatuses = new Set(events.map(e => e.status));

  return (
    <div className="space-y-6">
      {/* Step indicators (horizontal progress) — skip if cancelled */}
      {!isCancelled && (
        <div className="flex items-center gap-0">
          {STEPS.map((step, idx) => {
            const done    = doneStatuses.has(step.key);
            const current = step.key === currentStatus;
            const colors  = STATUS_COLORS[step.key];
            const { Icon } = step;

            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center gap-1 ${idx === 0 ? "" : ""}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                    ${done || current
                      ? `${colors.bg} ${colors.border} ${colors.icon}`
                      : "bg-slate-100 border-slate-200 text-slate-300"
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block
                    ${done || current ? colors.text : "text-slate-300"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded ${done ? "bg-brand-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancelled badge */}
      {isCancelled && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="font-semibold text-red-700 text-sm">Commande annulée</span>
        </div>
      )}

      {/* Event log */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Historique
        </h3>
        {events.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Aucun évènement enregistré.</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100" />
            <div className="space-y-4">
              {[...events].reverse().map((ev, idx) => {
                const colors = STATUS_COLORS[ev.status] ?? STATUS_COLORS.pending;
                return (
                  <div key={ev.id} className="relative flex gap-4 pl-10">
                    {/* Dot */}
                    <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 bg-white
                      ${idx === 0 ? colors.border : "border-slate-200"}`} />
                    <div className={`flex-1 rounded-2xl border px-4 py-3 ${idx === 0 ? `${colors.bg} ${colors.border}` : "bg-slate-50 border-slate-100"}`}>
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className={`text-sm font-bold ${idx === 0 ? colors.text : "text-slate-600"}`}>
                          {STEPS.find(s => s.key === ev.status)?.label ?? ev.status}
                        </span>
                        <span className="text-xs text-slate-400">{fmtDate(ev.created_at)}</span>
                      </div>
                      {ev.note && (
                        <p className="text-xs text-slate-500 mt-1">{ev.note}</p>
                      )}
                      {ev.created_by && (
                        <p className="text-xs text-slate-400 mt-1">par {ev.created_by}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
