# HANDOFF — Togolese Shop Admin
> Dernière mise à jour : 2026-04-17 (session 4)
> Commit actuel : voir `git log --oneline -1`

---

## 🗂️ Architecture du projet

```
/Volumes/LOCAL/CLAUDE CODE/store-nextjs/
├── app/
│   ├── admin/
│   │   ├── page.tsx                  ← Dashboard admin (4 cartes modules)
│   │   ├── products/page.tsx         ← Catalogue + stock magasin + mouvements (2 tabs)
│   │   ├── stock/
│   │   │   ├── entree/page.tsx       ← Formulaire nouvelle entrée stock (legacy)
│   │   │   ├── sortie/page.tsx       ← Formulaire nouvelle sortie stock (legacy)
│   │   │   └── ajustement/page.tsx   ← Formulaire ajustement stock (legacy)
│   │   ├── categories/               ← CRUD catégories (grille cartes + KPIs)
│   │   ├── fournisseurs/             ← CRUD fournisseurs (grille cartes + KPIs)
│   │   ├── achats/                   ← Achats fournisseurs (KPIs + tableau + création)
│   │   ├── orders/                   ← Commandes
│   │   ├── ventes/                   ← Gestion des ventes (tab: VENTES + actions)
│   │   ├── stock-boutique/           ← Stock boutique (module BOUTIQUE)
│   │   ├── finance/                  ← Finance (KPIs, tabs Dépenses/Recettes)
│   │   ├── proforma/                 ← Proformat
│   │   ├── coupons/                  ← Coupons
│   │   ├── reviews/                  ← Avis clients (module CRM)
│   │   ├── import-export/            ← Import/Export CSV
│   │   ├── users/                    ← Utilisateurs
│   │   ├── crm/                      ← Clients CRM
│   │   ├── messages/                 ← Messages reçus
│   │   ├── whatsapp/                 ← Diffusion WhatsApp
│   │   └── settings/                 ← Réglages (général, hero, livraison, thème, etc.)
│   └── api/admin/
│       ├── auth/                     ← login/logout (JWT cookie)
│       ├── products/                 ← CRUD produits
│       ├── stock/
│       │   ├── entree/route.ts       ← POST entrée stock magasin (sans entrepot_id)
│       │   ├── sortie/route.ts       ← POST sortie stock magasin → boutique (sans entrepot_id)
│       │   ├── ajustement/route.ts   ← POST ajustement stock magasin (sans entrepot_id)
│       │   └── produits/route.ts     ← GET produits avec stock magasin (SUM produit_stocks)
│       ├── stock-boutique/           ← Mouvements stock boutique
│       ├── finance/                  ← CRUD entrées finance
│       ├── categories/               ← CRUD catégories
│       ├── fournisseurs/             ← CRUD fournisseurs
│       ├── achats/                   ← Achats fournisseurs
│       ├── orders/                   ← Commandes
│       └── ventes/factures/          ← Ventes (POST = createVenteWithStock)
├── components/admin/
│   ├── AdminTopBar.tsx               ← Barre haut fixe (logo, date, mode jour/nuit, SuperAdmin)
│   ├── AdminShell.tsx                ← Wrapper client (gère mobileOpen, rend TopBar + Sidebar)
│   ├── AdminSidebar.tsx              ← Sidebar modulaire (MAGASIN/BOUTIQUE/STORE/CRM)
│   ├── PageHeader.tsx                ← Header réutilisable (titre, sous-titre, search, CTA, refresh)
│   ├── TabBar.tsx                    ← Barre d'onglets réutilisable
│   ├── StatCard.tsx                  ← Carte KPI réutilisable (style Finance — shadow-sm, icône opacity-20)
│   ├── AdminProductActions.tsx       ← Icônes inline Eye/Pencil/Trash par ligne produit
│   ├── MouvementModal.tsx            ← Modal unifié Entrée/Sortie/Ajustement (MAGASIN)
│   ├── VentesManager.tsx             ← Gestion ventes (onglet VENTES, modal nouvelle vente)
│   ├── ProductQuickViewModal.tsx     ← Modal aperçu rapide produit
│   ├── ProductForm.tsx               ← Formulaire création/édition produit
│   ├── CategoriesManager.tsx         ← Grille cartes catégories + KPIs + modal CRUD
│   ├── FournisseursManager.tsx       ← Grille cartes fournisseurs + KPIs + modal CRUD
│   ├── AchatsManager.tsx             ← Tableau achats + KPIs + modal création
│   ├── FinanceManager.tsx            ← Client component Finance (CRUD)
│   ├── StockBoutiqueManager.tsx      ← Gestion stock boutique (from_magasin=1)
│   ├── StockParEntrepot.tsx          ← Stock par entrepôt
│   ├── VariantsManager.tsx           ← Gestion variantes produit
│   ├── ImportExportManager.tsx       ← Import/Export CSV
│   └── CreateOrderForm.tsx           ← Formulaire création commande
├── components/
│   ├── ThemeProvider.tsx             ← next-themes wrapper (attribute="class", defaultTheme="light")
│   └── ThemeVars.tsx                 ← Variables CSS du thème
├── lib/
│   ├── db.ts                         ← MySQL pool, requêtes produits (inclut stock_magasin)
│   ├── admin-db.ts                   ← Toutes les fonctions DB admin
│   ├── auth.ts                       ← getAdminSession() via cookie JWT
│   └── utils.ts                      ← finalPrice(), formatPrice(), type Product
├── scripts/
│   └── ventes-v2-migration.sql       ← Migration factures (avec_livraison, mode_paiement, statut_paiement)
├── package.json                      ← "dev": "next dev --turbopack --port 3003"
└── .env.local                        ← Variables d'environnement (DB + secrets)
```

---

## 🔧 Stack technique

| Technologie | Usage |
|---|---|
| Next.js 14 App Router | Framework principal |
| TypeScript strict | Typage |
| Tailwind CSS v4 | Styles — config via `@theme` dans `globals.css`, pas de fichier `tailwind.config` |
| MySQL (mysql2/promise) | Base de données — **pas Prisma** |
| JWT (jose) | Auth admin via cookie httpOnly |
| next-themes | Mode jour/nuit (`attribute="class"`, `suppressHydrationWarning` sur `<html>`) |
| Lucide React | Icônes |
| Turbopack | HMR rapide (`--turbopack`) |

---

## 🚀 Lancer le projet

```bash
# L'utilisateur lance lui-même depuis le répertoire main :
cd "/Volumes/LOCAL/CLAUDE CODE/store-nextjs"
npx next dev --turbopack --port 3003

# Accès local :       http://localhost:3003/admin
# Accès réseau :      http://192.168.0.140:3003/admin
```

> ⚠️ **Règle absolue** : toujours éditer dans `/Volumes/LOCAL/CLAUDE CODE/store-nextjs` (main). Jamais dans un worktree.

---

## 🗄️ Base de données (MySQL direct)

### Connexion
```ts
// lib/db.ts — pool partagé
import mysql from "mysql2/promise";
const pool = mysql.createPool({ host, user, password, database, ... });
```

### Tables principales
| Table | Description |
|---|---|
| `produits` | Catalogue produits (nom, reference, prix, stock_boutique, remise…) |
| `categories` | Catégories produits |
| `produit_stocks` | Stock MAGASIN par entrepôt (`produit_id`, `entrepot_id`, `stock`) |
| `stock_mouvements` | Journal de tous les mouvements de stock magasin |
| `entrepots` | Entrepôts (entrepot_id=1 utilisé par défaut) |
| `boutique_stock` | Stock boutique (`produit_id`, `quantite`, `from_magasin` flag) |
| `boutique_mouvements` | Journal mouvements boutique |
| `fournisseurs` | Fournisseurs (nom, contact, telephone, email, adresse, note) |
| `achats` | Commandes fournisseurs |
| `achat_items` | Lignes d'un achat |
| `factures` | Ventes (avec_livraison, mode_paiement, statut_paiement, montant_acompte) |
| `facture_items` | Lignes de vente (produit_id, designation, quantite, prix_unitaire) |
| `finance_entries` | Entrées finance (type: depense/recette, montant, date…) |
| `commandes` | Commandes clients |

### Distinction MAGASIN vs BOUTIQUE
| | Source | Utilisé pour |
|---|---|---|
| **Stock magasin** | `produit_stocks.stock` (SUM par produit_id) | Mouvements magasin (entree/sortie/ajustement) |
| **Stock boutique** | `produits.stock_boutique` + `boutique_stock.quantite` | Ventes boutique |

- La page **Produits MAGASIN** affiche `stock_magasin` (depuis `produit_stocks`)
- La page **Stock Boutique** affiche `boutique_stock` filtré par `from_magasin = 1`
- Une **sortie magasin** décrémente `produit_stocks` ET incrémente `boutique_stock` + `produits.stock_boutique`
- Une **vente** décrémente `boutique_stock` + `produits.stock_boutique`

### Schéma `achats`
```sql
id, fournisseur_id (FK), reference, date_achat,
nom_fournisseur (legacy), montant_total,
utilisateur_id, notes (TEXT — pas "note"), mode_transport,
statut ENUM('en_attente','recu','valide')  -- pas 'annule'
-- Pas de colonne created_at
```

### Migration requise (si nouvelle DB)
```bash
mysql -u USER -p DATABASE < scripts/ventes-v2-migration.sql
# Ajoute: factures.avec_livraison, mode_paiement, statut_paiement
```

---

## 🔐 Authentification

- Cookie httpOnly `admin_token` (JWT signé avec `ADMIN_JWT_SECRET`)
- `getAdminSession()` dans `lib/auth.ts` — utilisé dans toutes les API routes
- Middleware : `middleware.ts` protège `/admin/*` (redirige vers `/admin/login` si non connecté)

---

## 🖥️ Layout admin

### Structure générale
```
AdminTopBar (h-14, fixed, z-50)
  ├── Gauche : Zap logo + "Togolese Shop"
  ├── Centre : — (vide)
  └── Droite : date live (60s), toggle jour/nuit, "Voir le site →", dropdown SuperAdmin

AdminShell (client component)
  ├── Gère mobileOpen state
  ├── Rend AdminTopBar + AdminSidebar + children + OrderNotifier
  └── Landing /admin : TopBar sans sidebar
```

### Mode jour/nuit
- `next-themes` avec `attribute="class"` et `defaultTheme="light"`
- `suppressHydrationWarning` obligatoire sur `<html lang="fr">` dans `app/layout.tsx`
- `@variant dark (&:where(.dark, .dark *))` dans `globals.css` (Tailwind v4)
- Toggle dans AdminTopBar avec `mounted` state pour éviter le flash hydration

### Tailwind v4 + Turbopack — piège connu
Les classes dans les ternaires ne sont pas toujours détectées. Préférer les classes en dehors du ternaire ou utiliser `!important` modifier (`!text-white`).

---

## 🧭 Sidebar (AdminSidebar.tsx)

La sidebar est **modulaire** : elle affiche uniquement les items du module actif selon l'URL.

### Modules
| Clé | Label | Couleur badge | Items |
|---|---|---|---|
| `magasin` | MAGASIN | brand-900 (noir) | Tous les produits, Catégories, Fournisseurs, Achats, Import/Export |
| `boutique` | BOUTIQUE | amber-500 | Ventes, Livraisons, Stock boutique, Proformat, Finance, Clients, Segmentation |
| `store` | STORE | emerald-700 | Commandes, Coupons, Réglages, Hero, Livraison, Apparence, WhatsApp, Paiements, Domaine, Utilisateurs |
| `crm` | CRM | indigo-700 | Clients, Avis clients, Messages, Diffusion |

### Style navigation sidebar
- Item actif : `bg-emerald-800 text-white shadow-sm`
- Item inactif : `text-slate-700 hover:bg-slate-100 hover:text-slate-900`
- Background sidebar : `bg-white border-r border-slate-100`

### Règle critique du routing sidebar
`ROUTE_TO_MODULE` utilise `startsWith()` → **les routes plus spécifiques doivent être placées AVANT les routes générales**.
`/admin/stock-boutique` précède `/admin/stock` dans le tableau.

---

## 🎨 Design System

### Couleur CTA universelle
**Tous les boutons primaires** (CTA, save, submit) : `bg-emerald-800 hover:bg-emerald-700 text-white`

### PageHeader (`components/admin/PageHeader.tsx`)
Composant réutilisable pour tous les en-têtes de pages admin.
```tsx
<PageHeader
  title="Titre page"
  subtitle="Sous-titre"
  accent="brand" | "amber" | "emerald" | "indigo"
  ctaLabel="Ajouter"
  ctaIcon={Plus}
  onCtaClick={...}
  onRefresh={...}
  searchValue={...}
  onSearchChange={...}
  onSearch={...}
  extra={<ReactNode />}  // boutons secondaires
/>
```

### TabBar (`components/admin/TabBar.tsx`)
Barre d'onglets réutilisable.

### StatCard (`components/admin/StatCard.tsx`)
Carte KPI réutilisable — **template Finance**, à utiliser sur toutes les pages de dashboard.
```tsx
<StatCard
  title="Total"
  value={42}
  icon={Package}
  iconColor="text-slate-400"  // opacity-20 appliqué automatiquement
  badge={<span className="...">label</span>}
/>
```
Style : `bg-white rounded-2xl border border-slate-100 p-5 shadow-sm`, icône `w-8 h-8 opacity-20` en haut à droite, titre `text-xs font-bold uppercase tracking-wide text-slate-400`, valeur `text-2xl font-bold text-slate-900 tabular-nums`.

### Inputs / focus
Toutes les pages : `focus:border-emerald-500` (plus de `focus:border-brand-500`)

### Thème / Polices (`ThemeSettingsForm.tsx` + `lib/theme-utils.ts`)
- Polices disponibles : `"Système"` (spécial) + 8 polices Google Fonts (`Montserrat`, `Inter`, `Poppins`, `Raleway`, `Nunito`, `Plus Jakarta Sans`, `Outfit`, `DM Sans`)
- `"Système"` = stack `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — aucun chargement Google Fonts
- `"Montserrat"` = valeur par défaut — aucun chargement Google Fonts (déjà dans `globals.css`)
- Toutes les autres polices → chargement dynamique Google Fonts via `<link id="ts-gfont" />`
- `ThemeVars.tsx` (Server Component) injecte un `<style id="ts-theme">` avec `--font-display` et `--font-sans` en `!important` — obligatoire pour survivre à l'injection HMR Tailwind post-hydratation

---

## 📦 Page Produits MAGASIN (`/admin/products`)

### Fonctionnement (Server Component)
- Paramètres URL : `view`, `statut`, `q`, `category`, `page`
- `view` : `stock` | `mouvements` (seulement ces 2 — Entrées/Sorties/Ajustements supprimés)
- `statut` : `all` | `disponible` | `faible` | `epuise` (basé sur **stock magasin**)

### Boutons header (conditionnels par tab)
| Tab actif | Bouton affiché |
|---|---|
| `stock` | "Ajouter un produit" → `/admin/products/new` |
| `mouvements` | `<MouvementModal />` — modal unifié Entrée/Sortie/Ajustement |

### Colonne Stock
Affiche `produits.stock_magasin` = `SUM(produit_stocks.stock)` par produit.

---

## 🔄 MouvementModal (`components/admin/MouvementModal.tsx`)

Modal client unifié pour les 3 types de mouvements de stock magasin. **Supporte plusieurs produits en une seule soumission.**

### Fonctionnement
- Bouton trigger : `bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-700`
- Fetch produits depuis `/api/admin/stock/produits` (stock magasin réel)
- `entrepot_id` supprimé de toute la chaîne — hardcodé à `1` dans `admin-db.ts`
- State : liste `items: MouvItem[]` (chaque item = produit + qty + champ recherche indépendant)
- Submit : boucle de `fetch` séquentiels pour chaque item, affiche le compte "N mouvements enregistrés"
- `router.refresh()` après succès pour recharger la page server component
- Bouton "+ Ajouter un produit" pour ajouter une ligne supplémentaire

### Types disponibles
| Type | API | Effet |
|---|---|---|
| Entrée | `/api/admin/stock/entree` | Incrémente `produit_stocks.stock` |
| Sortie (→ boutique) | `/api/admin/stock/sortie` | Décrémente `produit_stocks`, incrémente `boutique_stock` + `stock_boutique` |
| Ajustement | `/api/admin/stock/ajustement` | Corrige `produit_stocks.stock` (± selon signe quantite) |

### Bug fix important
`getProduitsWithStock()` utilise `GROUP BY p.id + SUM(ps.stock)` pour éviter les doublons de lignes quand un produit a plusieurs entrepôts.

---

## 🛍️ Page Ventes (`/admin/ventes`)

### Architecture
- `VentesManager.tsx` : client component, 2 tabs : **VENTES** + **LIVRAISONS**
- Tab Devis supprimé — `listDevis` / `getVentesStats.devis` supprimés de `admin-db.ts`
- Bouton "Nouvelle vente" visible uniquement sur le tab VENTES

### Modal Nouvelle Vente (2 colonnes, max-w-5xl)
**Colonne gauche — Articles**
- Recherche produit depuis stock boutique (`boutique_stock` avec `from_magasin=1`)
- Tableau colonnes fixes : `minmax(0,1fr)` / `108px` / `96px` / `112px` (évite chevauchement P.U./Total)
- Récap : sous-total → champ remise globale (FCFA) → économie si remise > 0 → total net
- Champ acompte + reste à payer si statut = "acompte"

**Colonne droite — Client / Livraison / Paiement**
- Client : Nom (requis) + Téléphone
- **Livraison** : case à cocher "Livraison à domicile". Si cochée → 3 champs : adresse, contact, lien de localisation
- **Mode de paiement** : `<select>` (Espèces / Mix by Yas / Moov Money / Virement bancaire)
- **Statut du paiement** : `<select>` (Payé en totalité / Acompte / Non payé)
- Note (optionnel)

### Payload API vente
```ts
{ client_nom, client_tel, avec_livraison, adresse_livraison?, contact_livraison?,
  lien_localisation?, mode_paiement, statut_paiement, montant_acompte?,
  sous_total, remise?, total, note?, items[] }
```

### Création d'une vente (`createVenteWithStock`)
Transaction atomique :
1. Vérifie stock boutique disponible par item
2. Insère dans `factures` (avec tous les nouveaux champs)
3. Insère les lignes dans `facture_items`
4. Décrémente `boutique_stock` par item
5. Log `boutique_mouvements` par item
6. Sync `produits.stock_boutique` depuis `boutique_stock`

### Actions par ligne vente
Eye (voir) / Pencil (modifier) / Printer (imprimer, masqué si livraison) / Trash (supprimer)

---

## 🏪 Stock Boutique (`/admin/stock-boutique`)

- Affiche uniquement les produits avec `boutique_stock.from_magasin = 1`
- Ces produits arrivent via une **Sortie magasin** uniquement
- KPIs, liste, mouvements boutique

---

## 💰 Page Finance (`/admin/finance`) — Template de référence

- KPIs : Solde caisse, Total dépenses, Total rentrées
- Tabs : **Dépenses** / **Rentrées** (anciennement "Recettes")
- Header : un seul bouton **"Nouvelle entrée"** (supprimé : CAISSE, DÉPENSES, RENTRÉES séparés)
  - Le type de modal ouvert dépend du tab actif : tab "depense" → modal dépense, sinon → modal rentrée
- CRUD complet via `FinanceManager.tsx`
- API : `GET/POST /api/admin/finance`, `PUT/DELETE /api/admin/finance/[id]`

> ⭐ **Finance est le template visuel de référence pour tous les dashboards.** Son `StatCard` inline a été extrait dans `components/admin/StatCard.tsx` pour être réutilisé partout.

---

## ⚙️ Variables d'environnement (`.env.local`)

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
ADMIN_JWT_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3003
```

---

## 🚫 Règles importantes

1. **Jamais de worktree** — éditer uniquement dans `/Volumes/LOCAL/CLAUDE CODE/store-nextjs`
2. **Pas de Prisma** — MySQL direct via `mysql2/promise`
3. **Pas de preview Claude** — l'utilisateur lance `npx next dev` lui-même et valide dans son navigateur
4. **Toujours expliquer avant d'appliquer** — attendre la validation explicite
5. **Transactions MySQL** pour toutes les opérations de stock (atomicité)
6. **`entrepot_id`** supprimé des APIs et de l'UI — hardcodé à `1` dans `admin-db.ts`
7. **Stock magasin** = `SUM(produit_stocks.stock) GROUP BY produit_id` — jamais `produits.stock_boutique` pour le magasin
8. **Table `achats`** : pas de colonne `created_at`, colonne `notes` (pas `note`), statut sans `annule`
9. **`produit_id`** dans `getProduitsWithStock()` — le SELECT retourne `p.id AS produit_id`, utiliser `selected.produit_id` (pas `.id`)
10. **Boutons CTA** : toujours `bg-emerald-800 hover:bg-emerald-700` — plus de `bg-brand-*` dans les composants admin
11. **Inputs** : toujours `focus:border-emerald-500` — plus de `focus:border-brand-500`

---

## 📝 Historique des sessions

### Session 4 (2026-04-17)
- **VentesManager — style tableau** : refonte visuelle du tableau Ventes calquée sur le tableau Commandes de `gestion-commandes` — `bg-white rounded-2xl shadow-sm border border-slate-200`, `thead bg-slate-50`, `tbody divide-y divide-slate-50`, `hover:bg-slate-50 group`, badge référence `font-mono bg-indigo-50 text-indigo-700`, actions `opacity-60 group-hover:opacity-100`
- **Système de thème — police "Système"** : ajout d'une option spéciale dans la page Apparence (`/admin/settings/theme`)
  - `lib/theme-utils.ts` : 3 nouveaux exports — `SYSTEM_FONT_STACK` (stack complète), `isSystemFont(font)`, `fontFamilyValue(font)` (retourne la stack système si `"Système"`, sinon `"NomPolice", ui-sans-serif, ...`)
  - `components/ThemeVars.tsx` : utilise `fontFamilyValue()` pour injecter la variable CSS ; ne charge pas Google Fonts si `isSystemFont(font)`
  - `components/admin/ThemeSettingsForm.tsx` : `"Système"` ajouté en tête de `FONTS[]`, bouton affiché en "Système (défaut)" avec `fontFamily: SYSTEM_FONT_STACK` (pas de Google Font fictive), imports `isSystemFont` + `SYSTEM_FONT_STACK`
- **ThemeVars — fix régression font** : ajout `!important` sur `--font-display` et `--font-sans` pour empêcher l'injection CSS de Next.js HMR d'écraser la police thème après hydratation

### Session 3 (2026-04-17)
- **AdminTopBar** : barre fixe `h-14` — logo Zap + "Togolese Shop", date live (60s), toggle jour/nuit (next-themes), "Voir le site →", dropdown SuperAdmin (profil, paramètres, déconnexion)
- **AdminShell** : client component wrapper gérant `mobileOpen` partagé entre TopBar et Sidebar
- **Mode jour/nuit** : `ThemeProvider` (next-themes), `@variant dark` dans `globals.css`, `suppressHydrationWarning` sur `<html>`
- **Sidebar** : suppression logo/utilisateur — items seuls ; item actif `bg-emerald-800 text-white` ; background `bg-white`
- **Design system unifié** : tous les boutons CTA → `bg-emerald-800` ; tous les inputs → `focus:border-emerald-500`
- **PageHeader** + **TabBar** : composants partagés créés et déployés sur toutes les pages MAGASIN + BOUTIQUE
- **StatCard** : composant KPI partagé extrait de Finance, style Finance standardisé sur toutes les pages
- **CategoriesManager** : KPI cards style Finance + brand→emerald
- **FournisseursManager** : ajout 2 KPI cards (Fournisseurs + Avec contact) + brand→emerald
- **AchatsManager** : KPI cards style Finance + brand→emerald sur tous les éléments
- **CRM page** : header custom → `<PageHeader>` + KPI cards horizontaux → style Finance vertical

### Session 2 (2026-04-15)
- **MAGASIN** : Suppression "Stock par entrepôt" de la fiche produit ; `stock_magasin` écrit dans `produit_stocks` (plus `stock_boutique`) ; `stock_mouvements` sans `entrepot_id`
- **MouvementModal** : multi-produits (liste `items[]`, recherche indépendante par ligne, submit en boucle)
- **Stock boutique** : filtré `from_magasin = 1` dans `getStockBoutiqueStats` et `getStockBoutiqueList`
- **Sidebar** : "Commandes" déplacé BOUTIQUE → STORE
- **Finance** : 3 boutons header → 1 "Nouvelle entrée" ; tab "Recettes" → "Rentrées"
- **Ventes** : tab Devis supprimé ; modal redesign 2 colonnes : livraison checkbox+champs, selects mode/statut paiement, remise globale sur total, colonnes articles avec largeurs fixes
