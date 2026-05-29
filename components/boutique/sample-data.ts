import type { Sale, BoutiqueStock, CashMovement, BoutiqueClient, KpiItem } from './types';

/* ─── Sales ─────────────────────────────────────── */
export const SAMPLE_SALES: Sale[] = [
  { id: 'V-0891', client: 'Adjoa Mensah', init: 'AM', color: '#1F3D6E', time: '14h32', products: 2, amount: 22500, payment: 'Wave',      items: 'Pagne wax · Karité' },
  { id: 'V-0890', client: '—',            init: '',   color: '#8A8278', time: '13h55', products: 1, amount:  4500, payment: 'Espèces',   items: 'Karité brut' },
  { id: 'V-0889', client: 'Kofi Asante',  init: 'KA', color: '#2D6A4F', time: '12h20', products: 3, amount: 35000, payment: 'Orange M.', items: 'Bogolan · Bijou · Café' },
  { id: 'V-0888', client: '—',            init: '',   color: '#8A8278', time: '11h45', products: 1, amount:  2500, payment: 'Espèces',   items: 'Savon noir' },
  { id: 'V-0887', client: 'Fatou Diallo', init: 'FD', color: '#B8501A', time: '10h30', products: 2, amount: 26500, payment: 'Wave',      items: 'Kente · Collier' },
  { id: 'V-0886', client: 'Ama Koffi',    init: 'AK', color: '#5C4A88', time: '09h15', products: 1, amount:  8500, payment: 'Carte',     items: 'Collier perles wax' },
  { id: 'V-0885', client: '—',            init: '',   color: '#8A8278', time: '08h50', products: 4, amount: 12000, payment: 'Espèces',   items: 'Café · Karité · Bissap · Savon' },
];

export const PAYMENT_STYLE: Record<string, React.CSSProperties> = {
  'Espèces':    { background: 'var(--bg-2)',     color: 'var(--ink)' },
  Wave:         { background: '#E8F0F7',         color: '#1A73E8' },
  'Orange M.':  { background: 'var(--warn-bg)',  color: 'var(--warn)' },
  Carte:        { background: 'var(--accent-bg)',color: 'var(--accent)' },
};

/* ─── Boutique stock ────────────────────────────── */
export const SAMPLE_STOCK: BoutiqueStock[] = [
  { sku: 'PWX-001', name: 'Pagne wax — Indigo Royal',    cat: 'Textile',      boutique:  8, seuil:  5, swatch: '#1F3D6E', init: 'P' },
  { sku: 'KAR-220', name: 'Beurre de karité brut · 250g', cat: 'Cosmétique',   boutique: 24, seuil: 10, swatch: '#C8962A', init: 'K' },
  { sku: 'SAV-118', name: 'Savon noir africain · 200g',   cat: 'Cosmétique',   boutique:  2, seuil: 15, swatch: '#1F1612', init: 'S' },
  { sku: 'BSP-500', name: 'Bissap séché premium · 500g',  cat: 'Alimentation', boutique:  6, seuil: 10, swatch: '#7A2C3A', init: 'B' },
  { sku: 'BJL-307', name: 'Collier perles wax · doré',    cat: 'Accessoire',   boutique: 12, seuil:  8, swatch: '#B8501A', init: 'C' },
  { sku: 'CFE-450', name: 'Café Robusta torréfié · 450g', cat: 'Alimentation', boutique: 18, seuil: 10, swatch: '#5A3520', init: 'C' },
  { sku: 'KTE-009', name: 'Kente royal — 6 yards',        cat: 'Textile',      boutique:  3, seuil:  5, swatch: '#D4A437', init: 'K' },
  { sku: 'BGL-014', name: 'Bogolan brodé — Édition Mopti',cat: 'Textile',      boutique:  4, seuil:  5, swatch: '#3A2F25', init: 'B' },
];

/* ─── Cash movements (Finance) ──────────────────── */
export const SAMPLE_CASH: CashMovement[] = [
  { date: '28 mai, 14h32', type: 'Vente',     label: 'V-0891 · Adjoa Mensah',     montant: +22500, solde: 148200 },
  { date: '28 mai, 13h55', type: 'Vente',     label: 'V-0890 · Client anonyme',    montant:  +4500, solde: 125700 },
  { date: '28 mai, 13h00', type: 'Sortie',    label: 'Réapprovisionnement savon',   montant:  -8000, solde: 121200 },
  { date: '28 mai, 12h20', type: 'Vente',     label: 'V-0889 · Kofi Asante',       montant: +35000, solde: 129200 },
  { date: '28 mai, 11h45', type: 'Vente',     label: 'V-0888 · Client anonyme',     montant:  +2500, solde:  94200 },
  { date: '28 mai, 10h30', type: 'Vente',     label: 'V-0887 · Fatou Diallo',       montant: +26500, solde:  91700 },
  { date: '28 mai, 09h00', type: 'Ouverture', label: 'Fonds de caisse initial',     montant: +30000, solde:  65200 },
];

export const CASH_CURRENT_BALANCE = 148200;

export const WEEK_REVENUE = [
  { day: 'Lun', ca:  42000 },
  { day: 'Mar', ca:  68000 },
  { day: 'Mer', ca:  55000 },
  { day: 'Jeu', ca:  89000 },
  { day: 'Ven', ca: 112000, today: true },
  { day: 'Sam', ca:      0 },
  { day: 'Dim', ca:      0 },
];

/* ─── Clients ───────────────────────────────────── */
export const SAMPLE_CLIENTS: BoutiqueClient[] = [
  { name: 'Akua Boateng',  init: 'AB', color: '#3B6A8F', visits: 20, last: '28 mai 2026', total: 485000, status: 'VIP' },
  { name: 'Adjoa Mensah',  init: 'AM', color: '#1F3D6E', visits: 12, last: '28 mai 2026', total: 245000, status: 'Fidèle' },
  { name: 'Ama Koffi',     init: 'AK', color: '#5C4A88', visits: 15, last: '26 mai 2026', total: 312000, status: 'VIP' },
  { name: 'Kofi Asante',   init: 'KA', color: '#2D6A4F', visits:  8, last: '28 mai 2026', total: 168000, status: 'Régulier' },
  { name: 'Abena Owusu',   init: 'AO', color: '#7A2C3A', visits:  7, last: '20 mai 2026', total: 134500, status: 'Régulier' },
  { name: 'Fatou Diallo',  init: 'FD', color: '#B8501A', visits:  5, last: '27 mai 2026', total:  89500, status: 'Régulier' },
  { name: 'Kwame Boateng', init: 'KB', color: '#C8962A', visits:  3, last: '24 mai 2026', total:  42000, status: 'Nouveau' },
  { name: 'Yaw Darko',     init: 'YD', color: '#3A2F25', visits:  2, last: '15 mai 2026', total:  27000, status: 'Nouveau' },
];

export const CLIENT_STATUS_CLASS: Record<string, string> = {
  VIP: 'cliVip', 'Fidèle': 'cliFidele', 'Régulier': 'cliReg', Nouveau: 'cliNew',
};

/* ─── Top products sold today (overview) ────────── */
export const TOP_PRODUCTS_TODAY = [
  { name: 'Beurre de karité brut · 250g', swatch: '#C8962A', init: 'K', qty: 5, ca: 22500 },
  { name: 'Café Robusta torréfié · 450g', swatch: '#5A3520', init: 'C', qty: 4, ca: 27200 },
  { name: 'Savon noir africain · 200g',   swatch: '#1F1612', init: 'S', qty: 3, ca:  7500 },
  { name: 'Collier perles wax · doré',    swatch: '#B8501A', init: 'C', qty: 2, ca: 17000 },
  { name: 'Pagne wax — Indigo Royal',     swatch: '#1F3D6E', init: 'P', qty: 1, ca: 18000 },
];

/* ─── Payment breakdown (overview) ──────────────── */
export const PAY_BREAKDOWN = [
  { name: 'Espèces', color: 'var(--ink)',    pct: 45, amount: 50400 },
  { name: 'Wave',    color: '#1A73E8',       pct: 30, amount: 33600 },
  { name: 'Orng M.', color: '#E07A2C',       pct: 18, amount: 20160 },
  { name: 'Carte',   color: 'var(--accent)', pct:  7, amount:  7840 },
];

/* ─── KPI sets ──────────────────────────────────── */
export const OVERVIEW_KPIS: KpiItem[] = [
  { label: 'CA du jour',     value: '112 000', unit: 'F', delta: '+15%', deltaColor: '#2D6A4F', sub: 'vs hier même heure', spark: [65,72,80,88,94,98,102,106,108,110,112], sparkColor: '#C9601E' },
  { label: 'Ventes du jour', value: '7',                  delta: '+2',   deltaColor: '#2D6A4F', sub: 'vs 5 hier',           spark: [4,5,5,6,5,6,6,7,7,7,7], sparkColor: '#3B6A8F' },
  { label: 'Clients servis', value: '5',                  delta: '+1',   deltaColor: '#2D6A4F', sub: 'dont 3 identifiés',   spark: [3,3,4,4,4,5,5,5,5,5,5], sparkColor: '#5C4A88' },
  { label: 'Panier moyen',   value: '16 000', unit: 'F', delta: '+8%',  deltaColor: '#2D6A4F', sub: 'vs 14 800 F hier',    spark: [12000,13000,13500,14000,14500,15000,15500,16000,16000,16000,16000], sparkColor: '#2D6A4F' },
];

export const VENTES_KPIS: KpiItem[] = [
  { label: 'CA du jour',   value: '112 000', unit: 'F', delta: '+15%', deltaColor: '#2D6A4F', sub: 'vs hier',      spark: [65,72,80,88,94,98,102,106,108,110,112], sparkColor: '#C9601E' },
  { label: 'Ventes',       value: '7',                  delta: '+2',   deltaColor: '#2D6A4F', sub: "aujourd'hui", spark: [4,5,5,6,5,6,6,7,7,7,7], sparkColor: '#3B6A8F' },
  { label: 'Panier moyen', value: '16 000', unit: 'F', delta: '+8%',  deltaColor: '#2D6A4F', sub: "aujourd'hui", spark: [12000,13000,13500,14000,14500,15000,15500,16000,16000,16000,16000], sparkColor: '#5C4A88' },
];

export const STOCK_KPIS: KpiItem[] = [
  { label: 'Références en boutique', value: '8',                                          sub: '8 sur 248 du catalogue',           spark: [6,6,7,7,7,8,8,8,8,8,8], sparkColor: '#3B6A8F' },
  { label: 'Alertes stock',          value: '3', delta: 'urgent', deltaColor: '#9C3A14',  sub: '< seuil de réapprovisionnement',   spark: [0,0,1,1,1,2,2,2,2,2,3], sparkColor: '#C9601E' },
  { label: 'Transferts en cours',    value: '2',                                          sub: 'depuis entrepôt Lomé Central' },
];

export const FINANCE_KPIS: KpiItem[] = [
  { label: 'Entrées du jour', value: '111 500', unit: 'F', delta: '+15%',     deltaColor: '#2D6A4F', sub: 'ventes encaissées',     spark: [65,72,80,88,94,98,102,106,108,110,111], sparkColor: '#2D6A4F' },
  { label: 'Sorties du jour', value: '8 000',   unit: 'F', delta: 'dépenses', deltaColor: '#C9601E', sub: 'réapprovisionnement',    spark: [0,0,0,3,5,5,8,8,8,8,8], sparkColor: '#C9601E' },
  { label: 'Bénéfice net',    value: '103 500', unit: 'F', delta: '+18%',     deltaColor: '#2D6A4F', sub: 'vs hier',                spark: [55,60,68,75,80,85,90,95,98,100,103], sparkColor: '#5C4A88' },
];

export const CLIENTS_KPIS: KpiItem[] = [
  { label: 'Clients enregistrés',   value: '8',             delta: '+2', deltaColor: '#2D6A4F', sub: 'ce mois',                       spark: [4,5,5,6,6,6,7,7,7,8,8], sparkColor: '#3B6A8F' },
  { label: 'Client du mois',        value: 'Akua Boateng',  serif: true,                        sub: '20 visites · 485 000 F de CA' },
  { label: 'Panier moyen clients',  value: '56 800', unit: 'F', delta: '+12%', deltaColor: '#2D6A4F', sub: 'clients identifiés',   spark: [40000,44000,48000,50000,52000,54000,55000,56000,56500,56800,56800], sparkColor: '#5C4A88' },
];
