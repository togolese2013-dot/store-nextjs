const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmée",  cls: "bg-blue-100 text-blue-700" },
  shipped:   { label: "Expédiée",   cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "Livrée",     cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée",    cls: "bg-red-100 text-red-700" },
};

export default function OrderStatusBadge({
  orderId: _orderId,
  status,
}: {
  orderId: number;
  status:  string;
}) {
  const info = STATUS_MAP[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${info.cls}`}>
      {info.label}
    </span>
  );
}
