# HANDOFF — Togolese Shop Admin
> Dernière mise à jour : 2026-05-30 (session 8)
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
│   │   ├── categories/               ← CRUD catégories + marques (tabs)
│   │   ├── fournisseurs/             ← CRUD fournisseurs (grille cartes + KPIs)
│   │   ├── achats/                   ← Achats fournisseurs (KPIs + tableau + création)
│   │   ├── orders/                   ← Commandes
│   │   ├── ventes/                   ← Gestion des ventes (KPIs + tabs VENTES/LIVRAISONS)
│   │   ├── livraisons/               ← Livraisons admin (KPIs + tableau + modal manuel)
│   │   ├── stock-boutique/           ← Stock boutique (module BOUTIQUE)
│   │   ├── finance/                  ← Finance (KPIs, tabs Dépenses/Rentrées)
│   │   ├── boutique-clients/         ← Clients boutique physique
│   │   ├── boutique-segmentation/    ← Segmentation clients boutique
│   │   ├── proforma/                 ← Proformat
│   │   ├── coupons/                  ← Coupons
│   │   ├── reviews/                  ← Avis clients (module CRM)
│   │   ├── crm/                      ← Clients CRM (vitrine uniquement)
│   │   ├── messages/                 ← Messages reçus
│   │   ├── whatsapp/                 ← Diffusion WhatsApp
│   │   └── settings/                 ← Réglages (général, hero, livraison, thème, etc.)
│   └── api/admin/
│       ├── auth/                     ← login/logout (JWT cookie)
│       ├── products/                 ← CRUD produits
│       ├── stock/
│       │   ├── entree/route.ts       ← POST entrée stock magasin
│       │   ├── sortie/route.ts       ← POST sortie stock magasin → boutique
│       │   ├── ajustement/route.ts   ← POST ajustement stock magasin
│       │   └── produits/route.ts     ← GET produits avec stock magasin (SUM produit_stocks)
│       ├── stock-boutique/           ← Mouvements stock boutique
│       ├── finance/                  ← CRUD entrées finance
│       ├── categories/               ← CRUD catégories
│       ├── fournisseurs/             ← CRUD fournisseurs
│       ├── achats/                   ← Achats fournisseurs
│       ├── orders/                   ← Commandes
│       ├── livraisons/route.ts       ← GET liste + POST livraison manuelle
│       ├── livraisons/[id]/route.ts  ← PATCH statut/livreur + DELETE
│       ├── boutique-clients/         ← CRUD clients boutique
│       └── ventes/factures/          ← Ventes (POST = createVenteWithStock)
├── components/admin/
│   ├── AdminShell.tsx                ← Wrapper client (SSE EventSource, refresh auto)
│   ├── AdminSidebar.tsx              ← Sidebar modulaire (MAGASIN/BOUTIQUE/STORE/CRM)
│   ├── PageHeader.tsx                ← Header réutilisable (titre, sous-titre, search, CTA, extra)
│   ├── TabBar.tsx                    ← Barre d'onglets réutilisable
│   ├── StatCard.tsx                  ← Carte KPI réutilisable
│   ├── VentesManager.tsx             ← Ventes + autocomplétion client + aperçu carte
│   ├── LivraisonsManager.tsx         ← Livraisons + KPIs + modal livraison manuelle
│   ├── FinanceManager.tsx            ← Finance (Dépenses/Rentrées, boutons dans PageHeader)
│   ├── StockBoutiqueManager.tsx      ← Stock boutique (tous les produits boutique_stock)
│   ├── BoutiqueClientsManager.tsx    ← Clients boutique (autocomplete, tabs)
│   ├── CategoriesManager.tsx         ← Catégories + Marques (2 tabs)
│   ├── MouvementModal.tsx            ← Modal unifié Entrée/Sortie/Ajustement (MAGASIN)
│   ├── ProductForm.tsx               ← Formulaire création/édition produit
│   └── ...
├── lib/
│   ├── db.ts                         ← MySQL pool, requêtes produits
│   ├── admin-db.ts                   ← Toutes les fonctions DB admin
│   ├── admin-events.ts               ← SSE EventEmitter singleton (globalThis.__adminEmitter)
│   ├── auth.ts                       ← getAdminSession() via cookie JWT
│   └── utils.ts                      ← finalPrice(), formatPrice(), type Product
├── app/api/admin/events/route.ts     ← SSE endpoint (text/event-stream, heartbeat 25s)
├── scripts/
│   ├── ventes-v2-migration.sql
│   ├── stock-boutique-migration.sql
│   ├── boutique-clients-migration.sql
│   └── ...
└── .env.local
```

---

## 🔧 Stack technique

| Technologie | Usage |
|---|---|
| Next.js 15 App Router | Framework principal |
| TypeScript strict | Typage |
| Tailwind CSS v4 | Styles — config via `@theme` dans `globals.css` |
| MySQL (mysql2/promise) | Base de données — **pas Prisma** |
| JWT (jose) | Auth admin via cookie httpOnly |
| Server-Sent Events | Temps réel — remplace le polling 30s |
| Lucide React | Icônes |
| Turbopack | HMR rapide (`--turbopack`) |

---

## 🌐 Déploiement — Deux branches, deux serveurs

| Branche | Serveur | Domaine | Déclenchement |
|---|---|---|---|
| `main` | Vercel | togolese.tg | Push `main` → Vercel auto |
| `saas` | Hetzner (Ubuntu, `/opt/afrisika`) | afrisika.com | `npm run deploy` (script SSH) |

### Déployer sur Hetzner
```bash
npm run deploy          # git push + SSH + docker compose rebuild
# ou manuellement :
./deploy-hetzner.sh
```
Script : `deploy-hetzner.sh` — push origin saas → SSH `root@178.105.157.67` → `cd /opt/afrisika` → `git pull origin saas` → `docker compose -f docker-compose.prod.yml down && up --build`

### Vercel — ignore branche saas
Configuré via API Vercel (`commandForIgnoringBuildStep`) : exit 0 si branche = `saas`, exit 1 sinon. Vercel ne déploie que `main`.

---

## 🚀 Lancer le projet

```bash
cd "/Volumes/LOCAL/CLAUDE CODE/store-nextjs"
npx next dev --turbopack --port 3003
# http://localhost:3003/admin
```

> ⚠️ **Règle absolue** : toujours éditer dans `/Volumes/LOCAL/CLAUDE CODE/store-nextjs` (branche `saas`). Jamais dans un worktree.

---

## 🗄️ Base de données (MySQL direct)

### Tables principales
| Table | Description |
|---|---|
| `produits` | Catalogue produits (nom, reference, prix, stock_boutique, remise…) |
| `categories` | Catégories produits |
| `marques` | Marques produits (créée via `ensureMarquesTable()`) |
| `produit_stocks` | Stock MAGASIN par entrepôt (`produit_id`, `entrepot_id`, `stock`) |
| `stock_mouvements` | Journal mouvements stock magasin |
| `boutique_stock` | Stock boutique (`produit_id`, `quantite`, `seuil_alerte`) |
| `boutique_mouvements` | Journal mouvements boutique |
| `boutique_clients` | Clients boutique physique (auto-peuplé depuis `clients` si vide) |
| `clients` | Clients vitrine en ligne (CRM uniquement) |
| `factures` | Ventes boutique physique |
| `livraisons_ventes` | Livraisons (liées à une vente ou manuelles — `facture_id` nullable) |
| `livreurs` | Livreurs avec `code_acces` unique |
| `fournisseurs` | Fournisseurs |
| `achats` | Commandes fournisseurs |
| `achat_items` | Lignes d'un achat |
| `finance_entries` | Entrées finance (type: depense/rentree, montant, date…) |
| `commandes` | Commandes clients vitrine |

### Distinction MAGASIN vs BOUTIQUE
| | Source | Utilisé pour |
|---|---|---|
| **Stock magasin** | `SUM(produit_stocks.stock)` par produit_id | Mouvements magasin |
| **Stock boutique** | `boutique_stock.quantite` | Ventes boutique, affichage Stock Boutique |

### Distinction clients BOUTIQUE vs CRM
| | Table | Alimentation |
|---|---|---|
| **Boutique > Clients** | `boutique_clients` | Import initial depuis `clients` + auto-sync à chaque vente |
| **CRM > Clients** | `clients` | Clients de la vitrine en ligne uniquement |

### Auto-initialisation (pas de migration manuelle nécessaire)
- **`boutique_stock`** : `ensureBoutiqueStockPopulated()` crée la table et insère tous les produits depuis `produits.stock_boutique` si vide
- **`boutique_clients`** : `ensureBoutiqueClientsTable()` crée la table et importe depuis `clients` si vide
- **`marques`** : `ensureMarquesTable()` crée la table + colonne `marque_id` sur `produits`

### Schéma `achats`
```sql
id, fournisseur_id (FK), reference, date_achat,
nom_fournisseur (legacy), montant_total,
utilisateur_id, notes (TEXT — pas "note"), mode_transport,
statut ENUM('en_attente','recu','valide')  -- pas 'annule', pas de created_at
```

---

## ⚡ Temps réel — SSE (Server-Sent Events)

**Plus de polling 30s ni de boutons rafraîchir visibles.**

### Architecture
- `lib/admin-events.ts` — EventEmitter singleton via `globalThis.__adminEmitter` (partagé entre tous les modules API)
- `app/api/admin/events/route.ts` — endpoint SSE `text/event-stream`, heartbeat toutes les 25s (Railway ferme à 30s)
- `AdminShell.tsx` — `EventSource("/api/admin/events")` avec reconnexion auto (retry 5s)

### Déclencher un événement (dans les API routes de mutation)
```ts
import { emitAdminEvent } from "@/lib/admin-events";
emitAdminEvent("stock" | "achat" | "vente" | "commande" | "produit" | "finance" | "livraison");
```
Dès qu'un événement est émis, tous les clients admin reçoivent un push → `router.refresh()` côté client.

### Routes qui émettent des événements
- `POST /api/admin/stock/entree|sortie|ajustement` → `"stock"`
- `POST /api/admin/achats` → `"achat"`
- `POST /api/admin/products` → `"produit"`
- `POST /api/admin/orders` → `"commande"`
- `POST /api/admin/livraisons` → `"livraison"`

---

## 🖥️ Layout admin

### Sidebar modulaire
| Clé | Label | Items |
|---|---|---|
| `magasin` | MAGASIN | Produits, Catégories, Fournisseurs, Achats |
| `boutique` | BOUTIQUE | Ventes, Livraisons, Stock boutique, Finance, Clients, Segmentation |
| `store` | STORE | Commandes, Coupons, Réglages… |
| `crm` | CRM | Clients (vitrine), Avis, Messages, WhatsApp |

### Règle critique routing sidebar
`ROUTE_TO_MODULE` utilise `startsWith()` → routes spécifiques AVANT générales.
`/admin/stock-boutique` précède `/admin/stock`.

---

## 🎨 Design System

### Boutons CTA
Tous les boutons primaires : `bg-emerald-800 hover:bg-emerald-700 text-white`

### PageHeader
```tsx
<PageHeader
  title="..." subtitle="..." accent="brand|amber|emerald|indigo"
  ctaLabel="..." ctaIcon={Plus} onCtaClick={...}
  onRefresh={...} searchValue={...} onSearchChange={...} onSearch={...}
  extra={<ReactNode />}  // boutons secondaires entre refresh et CTA
/>
```

### KPI Cards (inline — pas StatCard)
Pattern utilisé dans Ventes, Livraisons, Finance :
```tsx
<div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
  <div className="flex items-start justify-between mb-3">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Titre</p>
    <Icon className="w-8 h-8 text-xxx-500 opacity-20" />
  </div>
  <p className="text-2xl font-bold text-slate-900 tabular-nums">{valeur}</p>
  <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-xxx-50 text-xxx-700 border border-xxx-100">badge</span>
</div>
```
Grille : `grid grid-cols-2 lg:grid-cols-4 gap-4`

---

## 🛍️ Page Ventes (`/admin/ventes`)

### Dashboard KPIs
4 cards : CA Total · Nb Ventes · Payées · Livraisons

### Modal Nouvelle Vente
**Colonne gauche** — Articles depuis `boutique_stock`
**Colonne droite** — Client + Livraison + Paiement

#### Autocomplétion client
- Frappe 2+ caractères → recherche dans `boutique_clients` → dropdown suggestions
- Sélection client existant → nom + tél auto-remplis, champ tél masqué, badge "Client enregistré"
- Nouveau client → champ tél affiché (bordure amber) → auto-enregistré dans `boutique_clients` via `createVenteWithStock`

#### Aperçu carte (livraison à domicile)
- URL Google Maps contenant `@lat,lng` → iframe OpenStreetMap intégré (sans API key)
- URL courte (`maps.app.goo.gl`) → bouton "Voir la localisation sur la carte"

### Création d'une vente (`createVenteWithStock`)
Transaction atomique :
1. Vérifie stock boutique par item
2. Insère dans `factures`
3. Décrémente `boutique_stock` + log `boutique_mouvements`
4. Sync `produits.stock_boutique`
5. Si livraison → insère dans `livraisons_ventes`
6. **Après commit** : sync client vers `boutique_clients` (INSERT...SELECT WHERE NOT EXISTS)

---

## 🚚 Page Livraisons (`/admin/livraisons`)

### Dashboard KPIs
4 cards : Total · En attente · En cours · Livrées

### Boutons PageHeader
- **"Ajouter"** → modal livraison manuelle (sans vente liée, `facture_id = NULL`)
- **"Livreur"** → modal création livreur (dans slot `extra`)

### Livraison manuelle
Champs : client_nom*, client_tel, adresse, contact_livraison, lien_localisation, note
API : `POST /api/admin/livraisons` → `createManualLivraison()` → référence `LV-XXXXX` auto-générée

### Livraisons liées à une vente
Créées automatiquement dans `createVenteWithStock` quand `avec_livraison = true`

---

## 🏪 Stock Boutique (`/admin/stock-boutique`)

- Affiche **tous** les produits de `boutique_stock` (plus de filtre `from_magasin`)
- `ensureBoutiqueStockPopulated()` appelé à chaque chargement : crée la table si absente, insère tous les produits depuis `produits.stock_boutique` si vide, puis `INSERT IGNORE` les nouveaux produits
- KPIs : total produits, valeur boutique, stock faible, épuisés

---

## 💰 Page Finance (`/admin/finance`)

- KPIs : Solde caisse, Espèces, Moov Money, TMoney, Virement bancaire
- Tabs : **Dépenses** / **Rentrées** (onglet Catégories supprimé)
- Boutons **"Nouvelle dépense"** et **"Nouvelle rentrée"** dans le slot `extra` du PageHeader (toujours visibles)
- CRUD complet via `FinanceManager.tsx`

---

## 👥 Clients Boutique (`/admin/boutique-clients`)

- Table `boutique_clients` : clients de la boutique physique
- Auto-peuplée depuis `clients` (vitrine) au premier chargement si vide
- Alimentée automatiquement à chaque vente (`createVenteWithStock`) et chaque facture (`createFacture`) si nom + tél fournis
- Tabs : Tous / Débiteurs / Dettes
- CRUD complet via `BoutiqueClientsManager.tsx`

---

## 📂 CRM (`/admin/crm`)

- Affiche **uniquement** les clients de la vitrine en ligne (table `clients`)
- KPIs : Nouveaux (30j) + Top client
- Top 10 clients par CA total
- Pas de liste complète (supprimée — voir Boutique > Clients pour les clients physiques)

---

## ⚙️ Variables d'environnement

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

## 🏗️ Architecture SaaS — Workspaces CSS Modules

5 workspaces fullscreen, chacun = Shell + Sidebar + Pages + CSS Module. Montés via `app/admin/(fullscreen)/`.

| Workspace | Dossier | Route | Accent |
|---|---|---|---|
| Magasin | `components/magasin/` | `/admin/magasin` | `#3B6A8F` bleu |
| Boutique | `components/boutique/` | `/admin/boutique-ws` | `#C9601E` orange |
| Store | `components/store/` | `/admin/store` | `#2D6A4F` vert |
| CRM | `components/crm/` | `/admin/crm-ws` | `#5C4A88` violet |
| Admin WS | `components/admin-ws/` | `/admin/admin-ws` | `#2A2522` graphite |

Entrée : `WorkspaceSelector` (`/admin`) → cartes → `AdminWorkspaceClient.tsx` → route correspondante.

### Règles CSS Modules workspaces (CRITIQUE)
- **`color-mix()` INTERDIT** — Turbopack crash MIME type. Utiliser `rgba(0,0,0,0.08)` à la place.
- **Classes dans Sidebar** : toujours `styles.l1`, `styles.l2`, `styles.n`, `styles.r` — jamais `"l1"` raw string.
- **Classes top-level** : définir `.l1`, `.l2`, `.n`, `.r` au top du CSS Module (pas seulement en nested `.workspaceMeta .l1`).
- **Composant de shell Admin WS** : nommé `AdminWsShell` (pas `AdminShell`) pour éviter conflit avec `components/admin/AdminShell.tsx`.

### Store — Page Réglages boutique
- Fichier : `components/store/ReglagesPage.tsx`
- Sections : URL & Domaine, Apparence (logo + couleur), Infos boutique, Paiements, Notifications, Zone danger
- Persistance : `localStorage` clé `"store_reglages"` — load sur mount, save au clic "Enregistrer"
- Zone danger (désactiver boutique) → sauvegarde immédiate sans bouton
- Slug : lecture seule (`slug.afrisika.com`) — domaine perso éditable

---

## 🚫 Règles importantes

1. **Jamais de worktree** — éditer uniquement dans `/Volumes/LOCAL/CLAUDE CODE/store-nextjs`
2. **Pas de Prisma** — MySQL direct via `mysql2/promise`
3. **Pas de preview Claude** — l'utilisateur valide dans son propre navigateur
4. **Toujours expliquer avant d'appliquer** — attendre la validation explicite
5. **Transactions MySQL** pour toutes les opérations de stock (atomicité)
6. **`entrepot_id`** hardcodé à `1` dans `admin-db.ts`
7. **Stock magasin** = `SUM(produit_stocks.stock) GROUP BY produit_id`
8. **`produit_id`** dans `getProduitsWithStock()` → retourne `p.id AS produit_id`, utiliser `.produit_id` (pas `.id`)
9. **Boutons CTA** : `bg-emerald-800 hover:bg-emerald-700`
10. **SSE** : utiliser `emitAdminEvent()` dans toutes les API routes de mutation
11. **Auto-init DB** : `ensureBoutiqueStockPopulated()`, `ensureBoutiqueClientsTable()`, `ensureMarquesTable()` — pas besoin d'exécuter des scripts SQL manuellement
12. **Table `achats`** : pas de `created_at`, colonne `notes` (pas `note`), statut sans `annule`
13. **CSS Modules workspaces** : `color-mix()` interdit (Turbopack crash). Sidebar classes = `styles.xxx` jamais `"xxx"`.
14. **Déployer Hetzner** : `npm run deploy` depuis le Mac local — ne pas relancer depuis le serveur SSH
15. **MySQL Hetzner** : port 3307, base `togolese`, partagée entre afrisika.com et togolese.tg
16. **Jamais subquery `reviews` dans `getProducts()`** — casse toute la liste produits. Avis via `RatingBadge` lazy client uniquement.

---

## 📝 Historique des sessions

### Session 8 (2026-05-30)
- **Store — Réglages boutique** : `ReglagesPage.tsx` créé — 6 sections (URL/domaine, apparence, infos, paiements, notifications, zone danger). localStorage persistance (`store_reglages`). Slug readonly, domaine perso éditable. Color picker + presets. Logo URL avec aperçu live.
- **Deploy script** : `deploy-hetzner.sh` + `npm run deploy` — SSH + git pull + docker compose rebuild automatique
- **Réglages persistés** : `useEffect` load depuis localStorage au mount, `handleSave` écrit au clic, zone danger sauvegarde immédiate

### Session 7 (2026-05-30)
- **Admin workspace** : `components/admin-ws/` (13 fichiers) — AdminWsShell, Sidebar, OverviewPage, UsersPage, WorkspacesPage, IntegrationsPage, ReportsPage, LogsPage, types, icons, Sparkline, sample-data, Admin.module.css
- **Route** : `app/admin/admin-ws/page.tsx` → `AdminWsShell`
- **AdminWorkspaceClient** : `admin: '/admin/admin-ws'` (était `/admin/config`)
- **AdminShell** : `ADMIN_ZONE` enrichi avec `"/admin/admin-ws"`
- **CSS Modules fix Magasin + Store sidebars** : `className="l1"` → `className={styles.l1}` (idem l2/n/r) + classes top-level ajoutées dans les 2 CSS modules
- **Magasin sample-data** : tous les tableaux vidés (`[]`), KPIs à `value: '0'`, `spark: []`
- **Vercel ignore saas** : API `commandForIgnoringBuildStep` configurée — `main` → Vercel (togolese.tg), `saas` → Hetzner (afrisika.com)
- **WorkspaceSelector** : accent orange, 5 cartes (Magasin/Boutique/Store/CRM/Admin), ⌘K palette, raccourcis 1–5

### Session 5 (2026-04-21)
- **SSE temps réel** : remplacement du polling 30s par Server-Sent Events — `lib/admin-events.ts` (EventEmitter singleton), `app/api/admin/events/route.ts` (heartbeat 25s), `AdminShell.tsx` (EventSource avec reconnexion auto)
- **Suppression refresh manuel** : `onRefresh`/`RefreshCw` retirés de `PageHeader`, `BoutiqueSegmentation`, `MessagesClient`
- **CategoriesManager** : refonte avec onglets Catégories/Marques + 3 KPI cards + `ensureMarquesTable()` compatible MySQL 8.0 (INFORMATION_SCHEMA au lieu de IF NOT EXISTS)
- **Clients boutique vs CRM** : séparation claire — `boutique_clients` (physique, auto-sync ventes) vs `clients` (vitrine)
- **`createVenteWithStock` + `createFacture`** : sync automatique `boutique_clients` après commit (INSERT...SELECT WHERE NOT EXISTS)
- **CRM page** : liste complète supprimée — KPIs + Top 10 uniquement
- **Dashboard Ventes** : 4 KPI cards (CA total, nb ventes, payées, livraisons) — `getVentesStats` enrichi
- **Dashboard Livraisons** : 4 KPI cards (total, en attente, en cours, livrées) — `getLivraisonsStats` ajouté
- **LivraisonsManager** : bouton "Ajouter" → modal livraison manuelle ; bouton "Livreur" déplacé dans `extra`
- **FinanceManager** : onglet "Recettes" → "Rentrées" ; onglet "Catégories" supprimé ; boutons CTA dans `extra` du PageHeader
- **Modal Nouvelle Vente** : autocomplétion client depuis `boutique_clients`, champ tél masqué/conditionnel, aperçu OpenStreetMap pour liens Google Maps avec coordonnées
- **`ensureBoutiqueStockPopulated()`** : auto-création + peuplement `boutique_stock` depuis `produits` si vide
- **Fix `from_magasin`** : filtre supprimé dans `getStockBoutiqueStats` et `getStockBoutiqueList`
- **Fix products page SSR** : `ProductsViewTabs` supprimé (utilisait `useSearchParams`), remplacé par `<Link>` server-side

### Session 4 (2026-04-17)
- **VentesManager — style tableau** : refonte visuelle calquée sur tableau Commandes
- **Système de thème — police "Système"** : `SYSTEM_FONT_STACK`, `isSystemFont()`, `fontFamilyValue()`
- **ThemeVars — fix régression font** : `!important` sur variables CSS pour survivre à l'injection HMR

### Session 3 (2026-04-17)
- **AdminTopBar** : barre fixe h-14, date live, toggle jour/nuit, dropdown SuperAdmin
- **Mode jour/nuit** : ThemeProvider (next-themes), `@variant dark`
- **Design system unifié** : CTA `bg-emerald-800`, inputs `focus:border-emerald-500`
- **PageHeader + TabBar + StatCard** : composants partagés sur toutes les pages

### Session 2 (2026-04-15)
- **MAGASIN** : stock_magasin via produit_stocks, entrepot_id supprimé de l'UI
- **MouvementModal** : multi-produits
- **Ventes** : tab Devis supprimé, modal 2 colonnes avec livraison/paiement
