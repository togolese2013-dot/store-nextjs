// Types for BoutiqueSettings

export interface HoraireJour {
  open: boolean;
  debut: string;
  fin: string;
}

export type DayKey = 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam' | 'dim';

export interface StoreState {
  // Identité
  nom: string;
  desc: string;
  adresse: string;
  tel: string;
  email: string;
  // Devise
  devise: string;
  symbole: string;
  symPos: string;
  sep1k: string;
  sepDec: string;
  decimales: string;
  langue: string;
  fuseau: string;
  // Paiements
  pay_especes: boolean;
  pay_wave: boolean;
  wave_num: string;
  pay_orange: boolean;
  orange_num: string;
  pay_moov: boolean;
  moov_num: string;
  pay_mixx: boolean;
  mixx_num: string;
  pay_carte: boolean;
  pay_virement: boolean;
  virement_rib: string;
  // Reçus
  recu_format: string;
  recu_logo: boolean;
  recu_header: string;
  recu_footer: string;
  recu_auto: boolean;
  recu_canal: string;
  // Stock
  seuil_global: string;
  bloquer_vente: boolean;
  notif_stock: boolean;
  notif_stock_canaux: string[];
  // Fidélité
  fidelite_active: boolean;
  fidelite_critere: string;
  seuil_regulier: string;
  seuil_fidele: string;
  seuil_vip: string;
  // Équipe
  pin_caisse: string;
  pin_visible: boolean;
  // Fiscal
  regime: string;
  rccm: string;
  nif: string;
  tva_active: boolean;
  tva_taux: string;
  prix_mode: string;
  // Horaires
  lun: HoraireJour;
  mar: HoraireJour;
  mer: HoraireJour;
  jeu: HoraireJour;
  ven: HoraireJour;
  sam: HoraireJour;
  dim: HoraireJour;
  // Notifications
  notif_journalier: boolean;
  notif_journalier_heure: string;
  notif_hebdo: boolean;
  notif_hebdo_jour: string;
  notif_critiques: boolean;
  notif_canal: string;
}

export interface ConfirmOptions {
  title: string;
  sub: string;
  confirmLabel: string;
  tone?: 'danger';
  onConfirm: () => void;
}

export interface SectionProps {
  s: StoreState;
  u: <K extends keyof StoreState>(k: K, v: StoreState[K]) => void;
  toast: (msg: string) => void;
  save?: (section: string) => void;
}

export interface BoutiqueSettingsProps {
  onBack?: () => void;
  onNavigate?: (href: string) => void;
  initialState?: Partial<StoreState>;
  onSave?: (section: string, state: StoreState) => void;
  shopName?: string;
  userName?: string;
  userRole?: string;
}
