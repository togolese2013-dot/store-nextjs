import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const BRAND = "#2563eb";
const LIGHT  = "#eff6ff";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    padding: 36,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
  },
  shopName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  shopMeta: { fontSize: 8, color: "#64748b", marginTop: 3 },
  invoiceTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: BRAND, textAlign: "right" },
  invoiceSub: { fontSize: 8, color: "#64748b", textAlign: "right", marginTop: 3 },

  // Client section
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  clientBox: {
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
  },
  clientName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  clientMeta: { fontSize: 9, color: "#475569", marginTop: 2 },

  // Items table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 9, color: "#334155" },
  tableCellBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e293b" },

  colRef:   { width: "18%" },
  colName:  { width: "40%" },
  colQty:   { width: "10%", textAlign: "center" },
  colPU:    { width: "16%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right" },

  // Totals
  totalsBox: {
    alignSelf: "flex-end",
    width: 220,
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 9, color: "#64748b" },
  totalValue: { fontSize: 9, color: "#334155" },
  totalFinalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: BRAND },
  totalFinalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: BRAND },
  divider: { borderTopWidth: 1, borderTopColor: "#e2e8f0", marginVertical: 4 },

  // Status badge
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 16,
  },
  statusText: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  note: {
    backgroundColor: "#fef9c3",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  noteText: { fontSize: 9, color: "#713f12" },
});

const STATUS_LABELS: Record<string, string> = {
  pending:   "En attente",
  confirmed: "Confirmée",
  shipped:   "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};
const STATUS_COLORS: Record<string, [string, string]> = {
  pending:   ["#fef3c7", "#92400e"],
  confirmed: ["#dbeafe", "#1e40af"],
  shipped:   ["#ede9fe", "#5b21b6"],
  delivered: ["#dcfce7", "#166534"],
  cancelled: ["#fee2e2", "#991b1b"],
};

function fmtPrice(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export interface InvoiceOrder {
  id: number;
  reference: string;
  nom: string | null;
  telephone: string;
  adresse: string | null;
  zone_livraison: string;
  delivery_fee: number;
  note: string | null;
  subtotal: number;
  total: number;
  status: string;
  created_at: string | Date;
  items: Array<{
    product_id?: number;
    nom: string;
    reference?: string;
    qty: number;
    prix_unitaire: number;
    total: number;
  }>;
}

export function InvoiceDocument({ order }: { order: InvoiceOrder }) {
  const [bgColor, textColor] = STATUS_COLORS[order.status] ?? ["#f1f5f9", "#334155"];
  const items = Array.isArray(order.items)
    ? order.items
    : JSON.parse(typeof order.items === "string" ? order.items : "[]");

  return (
    <Document title={`Facture ${order.reference}`} author="Togolese Shop">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>Togolese Shop</Text>
            <Text style={styles.shopMeta}>Lomé, Togo · togolese.shop</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceSub}>{order.reference}</Text>
            <Text style={styles.invoiceSub}>{fmtDate(order.created_at)}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
          <Text style={[styles.statusText, { color: textColor }]}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Text>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <View style={styles.clientBox}>
            <Text style={styles.clientName}>{order.nom || "Client"}</Text>
            <Text style={styles.clientMeta}>{order.telephone}</Text>
            {order.adresse ? <Text style={styles.clientMeta}>{order.adresse}</Text> : null}
            <Text style={styles.clientMeta}>Zone : {order.zone_livraison}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Articles commandés</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colRef]}>Réf.</Text>
            <Text style={[styles.tableHeaderCell, styles.colName]}>Désignation</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colPU]}>P.U.</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {items.map((item: InvoiceOrder["items"][number], i: number) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colRef]}>{item.reference ?? "—"}</Text>
              <Text style={[styles.tableCellBold, styles.colName]}>{item.nom}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tableCell, styles.colPU]}>{fmtPrice(item.prix_unitaire)}</Text>
              <Text style={[styles.tableCellBold, styles.colTotal]}>{fmtPrice(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{fmtPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Livraison ({order.zone_livraison})</Text>
            <Text style={styles.totalValue}>{fmtPrice(order.delivery_fee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>{fmtPrice(order.total)}</Text>
          </View>
        </View>

        {/* Note */}
        {order.note ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>Note : {order.note}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <Text style={styles.footer}>
          Merci pour votre achat · Togolese Shop · Lomé, Togo · togolese.shop
        </Text>
      </Page>
    </Document>
  );
}
