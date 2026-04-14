# HANDOFF — Togolese Shop Admin
> Dernière mise à jour : 2026-04-14
> Commit actuel : `d333dc2`

---

## 🗂️ Architecture du projet

```
/Volumes/LOCAL/CLAUDE CODE/store-nextjs/
├── app/
│   ├── admin/
│   │   ├── page.tsx                  ← Dashboard admin (4 cartes modules)
│   │   ├── products/page.tsx         ← Catalogue + filtres + tableau stock
│   │   ├── stock/
│   │   │   ├── entree/page.tsx       ← Formulaire nouvelle entrée stock (recherche produit)
│   │   │   ├── sortie/page.tsx       ← Formulaire nouvelle sortie stock (recherche produit)
│   │   │   └── ajustement/page.tsx   ← Formulaire ajustement stock ± (recherche produit)
│   │   ├── categories/               ← CRUD catégories (grille cartes + KPIs)
│   │   ├── fournisseurs/             ← CRUD fournisseurs (grille cartes)
│   │   ├── achats/                   ← Achats fournisseurs (KPIs + tableau + création)
│   │   ├── orders/                   ← Commandes
│   │   ├── ventes/                   ← Gestion des ventes (tabs: Factures/Devis/Livraisons)
│   │   ├── stock-boutique/           ← Stock boutique (module BOUTIQUE)
│   │   ├── finance/                  ← Finance (KPIs, tabs Dépenses/Recettes)
│   │   ├── factures/                 ← Factures
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
│       ├── products/                 ← CRUD produits (supporte stock_minimum)
│       ├── stock/
│       │   ├── entree/route.ts       ← POST entrée stock
│       │   ├── sortie/route.ts       ← POST sortie stock
│       │   ├── ajustement/route.ts   ← POST ajustement stock
│       │   ├── entrepots/route.ts    ← GET liste entrepôts
│       │   └── produits/route.ts     ← GET liste produits avec stock
│       ├── stock-boutique/           ← Mouvements stock boutique
│       ├── finance/                  ← CRUD entrées finance
│       ├── categories/               ← CRUD catégories
│       ├── fournisseurs/             ← CRUD fournisseurs (GET/POST/PUT/DELETE)
│       ├── achats/                   ← Achats fournisseurs (GET/POST/PATCH/DELETE)
│       ├── orders/                   ← Commandes
│       └── ventes/                   ← Ventes / livraisons
├── components/admin/
│   ├── AdminSidebar.tsx              ← Sidebar modulaire (MAGASIN/BOUTIQUE/STORE/CRM)
│   ├── AdminProductActions.tsx       ← Icônes inline Eye/Pencil/Trash par ligne produit
│   ├── ProductQuickViewModal.tsx     ← Modal aperçu rapide produit
│   ├── ProductForm.tsx               ← Formulaire création/édition produit
│   ├── CategoriesManager.tsx         ← Grille cartes catégories + KPIs + modal CRUD
│   ├── FournisseursManager.tsx       ← Grille cartes fournisseurs + modal CRUD
│   ├── AchatsManager.tsx             ← Tableau achats + KPIs + modal création
│   ├── FinanceManager.tsx            ← Client component Finance (CRUD)
│   ├── StockBoutiqueManager.tsx      ← Gestion stock boutique
│   ├── StockParEntrepot.tsx          ← Stock par entrepôt
│   ├── VariantsManager.tsx           ← Gestion variantes produit
│   ├── ImportExportManager.tsx       ← Import/Export CSV
│   └── CreateOrderForm.tsx           ← Formulaire création commande
├── lib/
│   ├── db.ts                         ← MySQL pool (mysql2/promise), requêtes produits/catégories
│   ├── admin-db.ts                   ← Toutes les fonctions DB admin (stock, finance, ventes, fournisseurs, achats…)
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
| `produits` | Catalogue produits (nom, reference, prix, stock_boutique, stock_minimum, remise…) |
| `categories` | Catégories produits |
| `produit_stocks` | Stock par entrepôt (`produit_id`, `entrepot_id`, `quantite`) |
| `stock_mouvements` | Journal de tous les mouvements de stock |
| `entrepots` | Entrepôts / lieux de stockage |
| `fournisseurs` | Fournisseurs (nom, contact, telephone, email, adresse, note) |
| `achats` | Commandes fournisseurs (fournisseur_id, reference, date_achat, statut, montant_total, notes) |
| `achat_items` | Lignes d'un achat (achat_id, produit_id, designation, quantite, prix_unitaire) |
| `livraisons_ventes` | Livraisons (renommé depuis `livraisons` pour éviter conflit) |
| `finance_entries` | Entrées finance (type: depense/recette, montant, date…) |
| `commandes` | Commandes clients |
| `commande_items` | Lignes de commande |

### Schéma `achats` (table préexistante avec colonnes spécifiques)
```sql
-- Colonnes importantes à connaître :
id, fournisseur_id (FK ajouté), reference, date_achat,
nom_fournisseur (varchar, legacy), montant_total,
utilisateur_id, notes (TEXT — pas "note"), mode_transport,
statut ENUM('en_attente','recu','valide')  -- pas 'annule'
-- Pas de colonne created_at sur cette table
```

### Fonctions DB clés (`lib/admin-db.ts`)

**Stock :**
```ts
getEntrepots()
getProduitsWithStock()
getStockStats()
getStockMovements({ type, search, limit, offset })
getStockMovementCounts()
createStockEntree({ produit_id, entrepot_id, quantite, reference?, note? })
createStockSortie({ produit_id, entrepot_id, quantite, reference?, note? })
createStockAjustement({ produit_id, entrepot_id, quantite, motif })
```

**Finance :**
```ts
getFinanceStats()
listFinanceEntries({ type?, limit, offset })
createFinanceEntry({ type, montant, libelle, date, note? })
updateFinanceEntry(id, data)
deleteFinanceEntry(id)
```

**Catégories :**
```ts
listAdminCategories()   // inclut nb_produits (actifs) par catégorie
createCategory(nom, description)
updateCategory(id, nom, description)
deleteCategory(id)
```

**Fournisseurs :**
```ts
listFournisseurs()
createFournisseur({ nom, contact, telephone, email, adresse, note })
updateFournisseur(id, data)
deleteFournisseur(id)
```

**Achats :**
```ts
listAchats(limit, offset)           // JOIN fournisseurs, ORDER BY date_achat DESC, id DESC
countAchats()
getAchatStats()                     // { total, en_attente, recu, montant_total }
getAchatById(id)                    // { achat, items[] }
createAchat({ fournisseur_id, reference, date_achat, statut, note, items[] })
updateAchatStatut(id, statut)
deleteAchat(id)                     // supprime aussi les achat_items (transaction)
```

**Produits (`lib/db.ts`) :**
```ts
getProducts({ search, categoryId, limit, offset, statut? })
getProductCount({ search, categoryId, statut? })
getProductStatusCounts()
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
| `magasin` | MAGASIN | brand-900 (noir) | Tous les produits, Catégories, Fournisseurs, Achats, Import/Export |
| `boutique` | BOUTIQUE | amber-500 | Commandes, Ventes, Stock boutique, Facture, Proformat, Finance, Coupons |
| `store` | STORE | emerald-700 | Réglages, Hero, Livraison, Apparence, WhatsApp, Paiements, Domaine, Utilisateurs |
| `crm` | CRM | indigo-700 | Clients, **Avis clients**, Messages, Diffusion |

### Règle critique du routing sidebar
`ROUTE_TO_MODULE` utilise `startsWith()` → **les routes plus spécifiques doivent être placées AVANT les routes générales**.

`/admin/stock-boutique` précède `/admin/stock` dans le tableau.
`/admin/reviews` est mappé vers `"crm"` (déplacé depuis magasin).

---

## 📦 Page Produits (`/admin/products`)

### Fonctionnement (Server Component)
- Paramètres URL : `view`, `statut`, `q`, `category`, `page`
- `view` : `stock` | `mouvements` | `entrees` | `sorties` | `ajustements`
- `statut` : `all` | `disponible` | `faible` | `epuise`

### Boutons header (taille réduite `px-3 py-2 text-xs`)
| Bouton | Icône | Destination |
|---|---|---|
| Ajouter un produit | `PackagePlus` | `/admin/products/new` |
| Nouvelle Entrée | `PackagePlus` | `/admin/stock/entree` |
| Nouvelle Sortie | `PackageMinus` | `/admin/stock/sortie` |
| Ajustement | `ArrowLeftRight` | `/admin/stock/ajustement` |

---

## 📋 Pages Stock (Entrée / Sortie / Ajustement)

### Recherche produit (autocomplete)
Les 3 pages utilisent un **champ de recherche** au lieu d'un `<select>` déroulant :
- Filtre local sur les produits chargés (par nom ou référence)
- Dropdown de résultats sous le champ
- Produit sélectionné affiché dans un badge coloré avec bouton "×" pour changer
- Couleur du badge : vert (entrée), rouge (sortie), bleu (ajustement)
- `entrepot_id: 1` toujours passé automatiquement

---

## 🛍️ Page Produit — Formulaire (`ProductForm.tsx`)

Champs dans la section "Prix & stock" :
- Prix unitaire (FCFA)
- Remise (%)
- **Stock magasin** (anciennement "Stock boutique")
- **Stock minimum** — seuil d'alerte stock faible (défaut : 5)

Le champ `stock_minimum` est enregistré dynamiquement (vérifie la présence de la colonne comme les autres).

---

## 🏪 Page Catégories (`/admin/categories`)

- **KPIs** : nombre de catégories + total produits catalogués
- **Grille de cartes** : nom, description, nb produits actifs liés
- Lien "Voir les produits →" par carte (filtre `/admin/products?category=ID`)
- **Modal** création/édition (plus d'édition inline dans tableau)
- CRUD complet via `CategoriesManager.tsx`

---

## 🏢 Page Fournisseurs (`/admin/fournisseurs`)

- Grille de cartes : nom, contact, téléphone, email, adresse, note
- **Modal** création/édition
- CRUD via `FournisseursManager.tsx` + API `/api/admin/fournisseurs`

---

## 🚚 Page Achats (`/admin/achats`)

- **KPIs** : total achats, en attente, reçus, montant total
- **Tableau** avec changement de statut inline (select par ligne)
- **Modal** création : référence, fournisseur, date, statut, lignes articles (désignation / qté / prix)
- Statuts : `en_attente` / `recu` / `valide`
- CRUD via `AchatsManager.tsx` + API `/api/admin/achats`

---

## 💰 Page Finance (`/admin/finance`)

- KPIs : Solde caisse, Total dépenses, Total recettes
- Tabs : Dépenses / Recettes
- 3 boutons : Caisse, Dépense, Rentrée
- CRUD complet via `FinanceManager.tsx`
- API : `GET/POST /api/admin/finance`, `PUT/DELETE /api/admin/finance/[id]`

---

## 🛒 Page Ventes (`/admin/ventes`)

- Table `livraisons_ventes` (renommée depuis `livraisons`)
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
7. **Table `achats`** : pas de colonne `created_at`, colonne `notes` (pas `note`), statut sans `annule` (utilise `valide`)

---

## 📝 Historique des commits récents

```
d333dc2  feat: pages Fournisseurs, Achats, refonte Catégories + améliorations MAGASIN
aaee656  docs: handoff complet
0fe8c97  feat: filtres produits, actions inline, pages stock entree/sortie/ajustement
f77607b  feat: page Finance avec KPIs, tabs Dépenses/Recettes et CRUD
d9e957c  feat: add Gestion des Ventes page avec Factures, Devis et Livraisons tabs
6468ddb  feat: Stock Boutique — page dédiée avec KPIs, mouvements et retraits clients
```
