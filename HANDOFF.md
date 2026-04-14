# HANDOFF — Togolese Shop Admin
> Dernière mise à jour : 2026-04-14
> Commit actuel : `0fe8c97`

---

## 🗂️ Architecture du projet

```
/Volumes/LOCAL/CLAUDE CODE/store-nextjs/
├── app/
│   ├── admin/
│   │   ├── page.tsx                  ← Dashboard admin (4 cartes modules)
│   │   ├── products/page.tsx         ← Catalogue + filtres + tableau stock
│   │   ├── stock/
│   │   │   ├── entree/page.tsx       ← Formulaire nouvelle entrée stock
│   │   │   ├── sortie/page.tsx       ← Formulaire nouvelle sortie stock
│   │   │   └── ajustement/page.tsx   ← Formulaire ajustement stock ±
│   │   ├── categories/               ← CRUD catégories
│   │   ├── orders/                   ← Commandes
│   │   ├── ventes/                   ← Gestion des ventes (tabs: Factures/Devis/Livraisons)
│   │   ├── stock-boutique/           ← Stock boutique (module BOUTIQUE)
│   │   ├── finance/                  ← Finance (KPIs, tabs Dépenses/Recettes)
│   │   ├── factures/                 ← Factures
│   │   ├── proforma/                 ← Proformat
│   │   ├── coupons/                  ← Coupons
│   │   ├── reviews/                  ← Avis clients
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
│       │   ├── entree/route.ts       ← POST entrée stock
│       │   ├── sortie/route.ts       ← POST sortie stock
│       │   ├── ajustement/route.ts   ← POST ajustement stock
│       │   ├── entrepots/route.ts    ← GET liste entrepôts
│       │   └── produits/route.ts     ← GET liste produits avec stock
│       ├── stock-boutique/           ← Mouvements stock boutique
│       ├── finance/                  ← CRUD entrées finance
│       ├── categories/               ← CRUD catégories
│       ├── orders/                   ← Commandes
│       └── ventes/                   ← Ventes / livraisons
├── components/admin/
│   ├── AdminSidebar.tsx              ← Sidebar modulaire (MAGASIN/BOUTIQUE/STORE/CRM)
│   ├── AdminProductActions.tsx       ← Icônes inline Eye/Pencil/Trash par ligne produit
│   ├── ProductQuickViewModal.tsx     ← Modal aperçu rapide produit
│   ├── ProductForm.tsx               ← Formulaire création/édition produit
│   ├── FinanceManager.tsx            ← Client component Finance (CRUD)
│   ├── StockBoutiqueManager.tsx      ← Gestion stock boutique
│   ├── StockParEntrepot.tsx          ← Stock par entrepôt
│   ├── VariantsManager.tsx           ← Gestion variantes produit
│   ├── ImportExportManager.tsx       ← Import/Export CSV
│   └── CreateOrderForm.tsx           ← Formulaire création commande
├── lib/
│   ├── db.ts                         ← MySQL pool (mysql2/promise), requêtes produits/catégories
│   ├── admin-db.ts                   ← Toutes les fonctions DB admin (stock, finance, ventes…)
│   ├── auth.ts                       ← getAdminSession() via cookie JWT
│   └── utils.ts                      ← finalPrice(), formatPrice()
├── prisma/                           ← NON UTILISÉ (Prisma absent, MySQL direct)
├── package.json                      ← "dev": "next dev --turbopack --port 3003"
└── .env.local                        ← Variables d'environnement (DB + secrets)
```

---

## 🔧 Stack technique

| Technologie | Usage |
|---|---|
| Next.js 14 App Router | Framework principal |
| TypeScript strict | Typage |
| Tailwind CSS | Styles |
| MySQL (mysql2/promise) | Base de données — **pas Prisma** |
| JWT (jose) | Auth admin via cookie httpOnly |
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
| `produit_stocks` | Stock par entrepôt (`produit_id`, `entrepot_id`, `quantite`) |
| `stock_mouvements` | Journal de tous les mouvements de stock |
| `entrepots` | Entrepôts / lieux de stockage |
| `livraisons_ventes` | Livraisons (renommé depuis `livraisons` pour éviter conflit) |
| `finance_entries` | Entrées finance (type: depense/recette, montant, date…) |
| `commandes` | Commandes clients |
| `commande_items` | Lignes de commande |

### Fonctions DB clés (`lib/admin-db.ts`)

**Stock :**
```ts
getEntrepots()                          // Liste des entrepôts
getProduitsWithStock()                  // Produits avec stock_boutique
getStockStats()                         // KPIs stock (en_stock, valeur_totale, faible, rupture…)
getStockMovements({ type, search, limit, offset })  // Mouvements paginés
getStockMovementCounts()                // { total, entrees, sorties, ajustements }
createStockEntree({ produit_id, entrepot_id, quantite, reference?, note? })
createStockSortie({ produit_id, entrepot_id, quantite, reference?, note? })
  // ↳ Valide stock disponible, lève erreur si insuffisant
createStockAjustement({ produit_id, entrepot_id, quantite, motif })
  // ↳ quantite peut être négatif (réduction) ou positif (augmentation)
  // ↳ Toutes ces fonctions utilisent des transactions MySQL
```

**Finance :**
```ts
getFinanceStats()                       // Solde, total dépenses, total recettes
listFinanceEntries({ type?, limit, offset })
createFinanceEntry({ type, montant, libelle, date, note? })
updateFinanceEntry(id, data)
deleteFinanceEntry(id)
```

**Produits (`lib/db.ts`) :**
```ts
getProducts({ search, categoryId, limit, offset, statut? })
  // statut: "disponible" (>5) | "faible" (1-5) | "epuise" (0)
getProductCount({ search, categoryId, statut? })
getProductStatusCounts()                // { total, disponible, faible, epuise }
```

---

## 🔐 Authentification

- Cookie httpOnly `admin_token` (JWT signé avec `ADMIN_JWT_SECRET`)
- `getAdminSession()` dans `lib/auth.ts` — utilisé dans toutes les API routes
- Middleware : `middleware.ts` protège `/admin/*` (redirige vers `/admin/login` si non connecté)

---

## 🧭 Sidebar (AdminSidebar.tsx)

La sidebar est **modulaire** : elle affiche uniquement les items du module actif selon l'URL.

### Modules
| Clé | Label | Couleur | Items |
|---|---|---|---|
| `magasin` | MAGASIN | brand-900 (noir) | Tous les produits, Catégories, Avis clients, Import/Export |
| `boutique` | BOUTIQUE | amber-500 | Commandes, Ventes, Stock boutique, Facture, Proformat, Finance, Coupons |
| `store` | STORE | emerald-700 | Réglages, Hero, Livraison, Apparence, WhatsApp, Paiements, Domaine, Utilisateurs |
| `crm` | CRM | indigo-700 | Clients, Messages, Diffusion |

### Règle critique du routing sidebar
`ROUTE_TO_MODULE` utilise `startsWith()` → **les routes plus spécifiques doivent être placées AVANT les routes générales**.

Exemple : `/admin/stock-boutique` doit précéder `/admin/stock` dans le tableau, sinon stock-boutique serait classé dans MAGASIN.

---

## 📦 Page Produits (`/admin/products`)

### Fonctionnement (Server Component)
- Paramètres URL : `view`, `statut`, `q`, `category`, `page`
- `view` : `stock` | `mouvements` | `entrees` | `sorties` | `ajustements`
- `statut` : `all` | `disponible` | `faible` | `epuise`

### Tab-bar gauche (vue)
```
[📦 Produits N] [📈 Mouvements N] [➕ Entrées N] [➖ Sorties N] [↔ Ajustements N]
```
Style actif : `bg-blue-600 text-white`

### Tab-bar droite (statut stock)
```
[Tous N] [Disponible N] [Faible N] [Épuisé N]
```
Couleurs actives : vert / amber / rouge

### Boutons header (style neutre, bordure)
| Bouton | Destination |
|---|---|
| Ajouter un produit | `/admin/products/new` |
| Nouvelle Entrée | `/admin/stock/entree` |
| Nouvelle Sortie | `/admin/stock/sortie` |
| Ajustement | `/admin/stock/ajustement` |

### Colonne ACTIONS
Icônes inline (pas de menu 3 points) :
- 👁 **Eye** → ouvre `ProductQuickViewModal`
- ✏️ **Pencil** → `/admin/products/[id]/edit`
- 🗑 **Trash2** → suppression avec confirmation

---

## 📋 Pages Stock

### `/admin/stock/entree`
- Champs : Produit (select avec stock affiché), Quantité, Référence BL, Note
- `entrepot_id: 1` passé automatiquement (champ supprimé de l'UI)
- POST → `/api/admin/stock/entree`
- Succès → redirect `/admin/products`

### `/admin/stock/sortie`
- Champs : Produit (avec stock disponible affiché en temps réel), Quantité (max = stock dispo), Référence, Motif/Note
- `entrepot_id: 1` passé automatiquement
- POST → `/api/admin/stock/sortie`
- API vérifie stock suffisant, renvoie erreur si insuffisant

### `/admin/stock/ajustement`
- Champs : Produit (avec prévisualisation nouveau stock en temps réel), Quantité ± (bordure verte/rouge selon signe), Motif (obligatoire)
- `entrepot_id: 1` passé automatiquement
- POST → `/api/admin/stock/ajustement`

---

## 💰 Page Finance (`/admin/finance`)

- KPIs : Solde caisse, Total dépenses, Total recettes
- Tabs : Dépenses / Recettes
- 3 boutons : Caisse, Dépense, Rentrée
- CRUD complet via `FinanceManager.tsx` (client component)
- API : `GET/POST /api/admin/finance`, `PUT/DELETE /api/admin/finance/[id]`

---

## 🛒 Page Ventes (`/admin/ventes`)

- Table `livraisons_ventes` (renommée depuis `livraisons` — l'ancienne table PHP avait un schéma incompatible)
- Tabs : Factures, Devis, Livraisons

---

## 🏪 Stock Boutique (`/admin/stock-boutique`)

- Module BOUTIQUE (distinct du stock MAGASIN)
- KPIs, liste produits avec stock, mouvements
- Entrée/retrait depuis la page elle-même (modal)

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
4. **Toujours expliquer avant d'appliquer** — attendre la validation explicite de l'utilisateur
5. **Transactions MySQL** pour toutes les opérations de stock (atomicité)
6. **`entrepot_id: 1`** par défaut dans les formulaires stock (le champ entrepôt a été retiré de l'UI)

---

## 📝 Historique des commits récents

```
0fe8c97  feat: filtres produits, actions inline, pages stock entree/sortie/ajustement
f77607b  feat: page Finance avec KPIs, tabs Dépenses/Recettes et CRUD
d9e957c  feat: add Gestion des Ventes page avec Factures, Devis et Livraisons tabs
6468ddb  feat: Stock Boutique — page dédiée avec KPIs, mouvements et retraits clients
4f25a3c  docs: mise à jour complète du handoff
b8e3df6  feat: stock dashboard on products page + BOUTIQUE module pages
```
