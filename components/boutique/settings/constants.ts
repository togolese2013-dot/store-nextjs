// Static data and initial state for BoutiqueSettings

import type { StoreState, DayKey } from './types';

export const DEVISES = [
  { code: 'XOF', sym: 'FCFA', nom: "Franc CFA UEMOA (Sénégal, Togo, Côte d'Ivoire…)" },
  { code: 'XAF', sym: 'FCFA', nom: 'Franc CFA CEMAC (Cameroun, Gabon, Congo…)' },
  { code: 'GHS', sym: 'GH₵',  nom: 'Cedi ghanéen' },
  { code: 'NGN', sym: '₦',    nom: 'Naira nigérian' },
  { code: 'EUR', sym: '€',    nom: 'Euro' },
  { code: 'USD', sym: '$',    nom: 'Dollar américain' },
  { code: 'GBP', sym: '£',    nom: 'Livre sterling' },
  { code: 'MAD', sym: 'DH',   nom: 'Dirham marocain' },
  { code: 'TND', sym: 'DT',   nom: 'Dinar tunisien' },
  { code: 'DZD', sym: 'DA',   nom: 'Dinar algérien' },
  { code: 'KES', sym: 'KSh',  nom: 'Shilling kényan' },
  { code: 'ZAR', sym: 'R',    nom: 'Rand sud-africain' },
] as const;

export interface PayMode {
  key: string;
  label: string;
  noNum?: boolean;
  numKey?: string;
  ph?: string;
  dot: string;
}

export const PAYS_LIST: PayMode[] = [
  { key: 'especes',  label: 'Espèces',          noNum: true,                dot: '#2D6A4F' },
  { key: 'wave',     label: 'Wave',              numKey: 'wave_num',     ph: '+228 90 …', dot: '#1A73E8' },
  { key: 'orange',   label: 'Orange Money',      numKey: 'orange_num',   ph: '+228 93 …', dot: '#E07A2C' },
  { key: 'moov',     label: 'Moov Money',        numKey: 'moov_num',     ph: '+228 96 …', dot: '#3B6A8F' },
  { key: 'mixx',     label: 'Mixx by Yas',       numKey: 'mixx_num',     ph: 'Numéro de compte', dot: '#C9601E' },
  { key: 'carte',    label: 'Carte bancaire',    noNum: true,                dot: '#5C4A88' },
  { key: 'virement', label: 'Virement bancaire', numKey: 'virement_rib', ph: 'IBAN · BIC', dot: '#3A2F25' },
];

export const JOURS: { key: DayKey; label: string }[] = [
  { key: 'lun', label: 'Lundi'    },
  { key: 'mar', label: 'Mardi'    },
  { key: 'mer', label: 'Mercredi' },
  { key: 'jeu', label: 'Jeudi'    },
  { key: 'ven', label: 'Vendredi' },
  { key: 'sam', label: 'Samedi'   },
  { key: 'dim', label: 'Dimanche' },
];

export const TEAM = [
  { name: 'Kent Diallo', init: 'KD', color: '#1F3D6E', role: 'Propriétaire' },
  { name: 'Ama Koffi',   init: 'AK', color: '#5C4A88', role: 'Gérante'      },
  { name: 'Yaw Mensah',  init: 'YM', color: '#2D6A4F', role: 'Vendeur'       },
];

export const NAV_SECTIONS = [
  { id: 'identite',  label: 'Identité'             },
  { id: 'devise',    label: 'Devise & Localisation' },
  { id: 'paiements', label: 'Modes de paiement'    },
  { id: 'recus',     label: 'Reçus & impression'   },
  { id: 'stock',     label: 'Stock & alertes'      },
  { id: 'fidelite',  label: 'Fidélité clients'     },
  { id: 'equipe',    label: 'Équipe & accès'        },
  { id: 'fiscal',    label: 'Fiscal & TVA'         },
  { id: 'horaires',  label: "Heures d'ouverture"   },
  { id: 'notifs',    label: 'Notifications'        },
  { id: 'danger',    label: 'Zone danger', danger: true },
];

export const INIT: StoreState = {
  nom: 'Ma boutique',
  desc: 'Boutique de mode et artisanat africain',
  adresse: 'Lomé, Togo',
  tel: '+228 90 12 34 56',
  email: 'contact@boutique.com',
  devise: 'XOF', symbole: 'FCFA', symPos: 'Après',
  sep1k: 'Espace', sepDec: 'Virgule', decimales: '0',
  langue: 'Français', fuseau: 'Africa/Abidjan',
  pay_especes: true,
  pay_wave: true,    wave_num: '',
  pay_orange: true,  orange_num: '',
  pay_moov: false,   moov_num: '',
  pay_mixx: true,    mixx_num: '',
  pay_carte: false,
  pay_virement: false, virement_rib: '',
  recu_format: 'Ticket thermique', recu_logo: true,
  recu_header: '',
  recu_footer: 'Merci de votre visite !',
  recu_auto: false, recu_canal: 'WhatsApp',
  seuil_global: '10', bloquer_vente: false,
  notif_stock: false, notif_stock_canaux: [],
  fidelite_active: false, fidelite_critere: 'Visites',
  seuil_regulier: '3', seuil_fidele: '8', seuil_vip: '20',
  pin_caisse: '', pin_visible: false,
  regime: 'Réel simplifié', rccm: '', nif: '',
  tva_active: false, tva_taux: '18', prix_mode: 'TTC',
  lun: { open: true,  debut: '08:00', fin: '19:00' },
  mar: { open: true,  debut: '08:00', fin: '19:00' },
  mer: { open: true,  debut: '08:00', fin: '19:00' },
  jeu: { open: true,  debut: '08:00', fin: '19:00' },
  ven: { open: true,  debut: '08:00', fin: '19:00' },
  sam: { open: true,  debut: '09:00', fin: '17:00' },
  dim: { open: false, debut: '10:00', fin: '14:00' },
  notif_journalier: false, notif_journalier_heure: '20:00',
  notif_hebdo: false, notif_hebdo_jour: 'Lundi',
  notif_critiques: false, notif_canal: 'WhatsApp',
};

export function fmtPreview(
  n: number,
  s1k: string, sdec: string,
  decCount: string, sym: string, symPos: string,
): string {
  const sep = s1k === 'Espace' ? ' ' : s1k === 'Point' ? '.' : ',';
  const sd  = sdec === 'Virgule' ? ',' : '.';
  const str = String(n);
  let res = '';
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 === 0) res += sep;
    res += str[i];
  }
  if (parseInt(decCount) > 0) res += sd + '00';
  return symPos === 'Avant' ? `${sym} ${res}` : `${res} ${sym}`;
}
