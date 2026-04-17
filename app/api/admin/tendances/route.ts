import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const MOIS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const annee = Number(searchParams.get("annee") ?? new Date().getFullYear());

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT f.id, f.total, f.montant_acompte, f.statut_paiement, f.statut,
            f.mode_paiement, f.items,
            MONTH(f.created_at) AS mois
     FROM factures f
     WHERE YEAR(f.created_at) = ? AND f.statut != 'annule'
     ORDER BY f.created_at`,
    [annee]
  );

  const factures = rows as mysql.RowDataPacket[];

  // Global stats
  const nb_ventes    = factures.length;
  const ca           = factures.reduce((s, r) => s + Number(r.total), 0);
  const panier_moyen = nb_ventes > 0 ? Math.round(ca / nb_ventes) : 0;

  // Monthly aggregation
  const monthly: Record<number, { nb: number; ca: number; paye: number }> = {};
  for (let m = 1; m <= 12; m++) monthly[m] = { nb: 0, ca: 0, paye: 0 };

  for (const r of factures) {
    const m = Number(r.mois);
    monthly[m].nb += 1;
    monthly[m].ca += Number(r.total);
    if (r.statut_paiement === "paye" || r.statut === "paye") {
      monthly[m].paye += Number(r.total);
    } else if (r.statut_paiement === "acompte") {
      monthly[m].paye += Number(r.montant_acompte ?? 0);
    }
  }

  const evolution = Object.entries(monthly).map(([mois, d]) => ({
    label:        MOIS_FR[Number(mois) - 1],
    mois:         Number(mois),
    nb_ventes:    d.nb,
    ca:           d.ca,
    panier_moyen: d.nb > 0 ? Math.round(d.ca / d.nb) : 0,
    montant_paye: d.paye,
  }));

  const details = evolution
    .filter(e => e.nb_ventes > 0)
    .map(e => ({
      periode:      `${e.label} ${annee}`,
      nb_ventes:    e.nb_ventes,
      ca:           e.ca,
      panier_moyen: e.panier_moyen,
      montant_paye: e.montant_paye,
    }));

  // Top 5 products from JSON items
  const prodMap: Record<string, { nom: string; qty: number; ca: number }> = {};
  for (const r of factures) {
    try {
      const items = JSON.parse(r.items || "[]") as Array<Record<string, unknown>>;
      for (const item of items) {
        const nom = String(item.nom ?? item.designation ?? "Inconnu");
        const qty = Number(item.qty ?? item.quantite ?? 0);
        const pu  = Number(item.prix_unitaire ?? item.prix ?? 0);
        if (!prodMap[nom]) prodMap[nom] = { nom, qty: 0, ca: 0 };
        prodMap[nom].qty += qty;
        prodMap[nom].ca  += pu * qty;
      }
    } catch { /* ignore malformed JSON */ }
  }
  const totalCA = Object.values(prodMap).reduce((s, p) => s + p.ca, 0);
  const top_produits = Object.values(prodMap)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 5)
    .map(p => ({
      nom:         p.nom,
      quantite:    p.qty,
      ca:          p.ca,
      pourcentage: totalCA > 0 ? Math.round((p.ca / totalCA) * 1000) / 10 : 0,
    }));

  // Payment methods breakdown
  const paiMap: Record<string, number> = {};
  for (const r of factures) {
    const m = String(r.mode_paiement ?? "Non précisé");
    paiMap[m] = (paiMap[m] ?? 0) + Number(r.total);
  }
  const totalPai = Object.values(paiMap).reduce((s, v) => s + v, 0);
  const methodes_paiement = Object.entries(paiMap)
    .sort((a, b) => b[1] - a[1])
    .map(([methode, montant]) => ({
      methode,
      montant,
      pourcentage: totalPai > 0 ? Math.round((montant / totalPai) * 1000) / 10 : 0,
    }));

  return NextResponse.json({
    stats: { nb_ventes, ca: Math.round(ca), panier_moyen, annee },
    evolution,
    details,
    top_produits,
    methodes_paiement,
  });
}
