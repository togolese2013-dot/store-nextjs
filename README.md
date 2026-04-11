# Togolese Shop — Document de handoff

> Boutique e-commerce Next.js 15 déployée sur Netlify · Base de données MySQL cloud · Paiement à la livraison

---

## Stack technique

| Couche | Techno |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| Styling | Tailwind CSS v4 |
| Base de données | MySQL (cloud — Railway ou PlanetScale) |
| Auth admin | JWT via `jose` + cookies httpOnly |
| Passwords | bcryptjs |
| Upload images | Cloudinary |
| PDF factures | @react-pdf/renderer |
| Déploiement | Netlify + `@netlify/plugin-nextjs` |
| Dev local | `npx next dev` (webpack, **pas** Turbopack) |

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine (non commité) :

```env
# Base de données MySQL
DB_HOST=your-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database

# Auth JWT (chaîne aléatoire longue)
JWT_SECRET=change-me-in-production

# URL publique du site
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app

# WhatsApp (numéro principal, format international sans +)
NEXT_PUBLIC_WHATSAPP_NUMBER=22890000000

# Cloudinary (upload images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Sur Netlify, ces variables se définissent dans **Site Settings → Environment Variables**.

---

## Lancer en local

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le .env.local (voir ci-dessus)

# 3. Initialiser la base de données
# Exécuter scripts/schema.sql sur ta base MySQL cloud
# Puis scripts/features-migration.sql (colonnes supplémentaires)
# Puis scripts/gallery-migration.sql (galerie images)
# Puis scripts/related-products-migration.sql (produits liés)

# 4. Lancer le serveur de dev (webpack — ne pas utiliser npm run dev car Turbopack a des bugs en worktree)
npx next dev
```

> **Note** : Si tu travailles dans un git worktree, assure-toi que `node_modules` est accessible (symlink depuis le repo principal).

---

## Structure du projet

```
app/
├── (shop)/              # Vitrine publique
│   ├── page.tsx         # Page d'accueil
│   ├── products/        # Liste + fiche produit
│   ├── cart/            # Panier
│   └── checkout/        # Commande
├── admin/               # Back-office (protégé par JWT)
│   ├── page.tsx         # Dashboard
│   ├── products/        # Gestion produits
│   ├── orders/          # Gestion commandes
│   ├── categories/      # Catégories
│   ├── coupons/         # Codes promo
│   ├── crm/             # Clients
│   ├── entrepots/       # Multi-boutiques / stocks
│   ├── import-export/   # Import/export CSV produits
│   ├── messages/        # Messages WhatsApp
│   ├── reviews/         # Avis produits
│   ├── settings/        # Paramètres généraux
│   └── users/           # Utilisateurs admin
└── api/                 # Routes API Next.js
    └── admin/           # APIs back-office (auth required)

components/
├── admin/               # Composants back-office
│   ├── ProductForm.tsx          # Formulaire produit (+ variantes + produits liés)
│   ├── VariantsManager.tsx      # Gestion variantes par SKU
│   ├── RelatedProductsManager.tsx
│   ├── GeneralSettingsForm.tsx  # Paramètres + bannière + WhatsApp
│   ├── OrderNotifier.tsx        # Notifications SSE temps réel
│   └── ImportExportManager.tsx  # Import/Export CSV
├── ProductVariantSelector.tsx   # Sélecteur variantes (fiche produit)
├── AddToCartButton.tsx          # Bouton panier (variant-aware)
├── ProductCard.tsx              # Carte produit
├── AnnouncementBar.tsx          # Bannière promotionnelle
├── Header.tsx                   # Navigation
└── Footer.tsx

context/
└── CartContext.tsx       # Panier (localStorage, variant-aware)

lib/
├── db.ts                # Pool MySQL + queries publiques + getProductVariants
├── admin-db.ts          # Queries admin (orders, clients, settings…)
├── auth.ts              # JWT session
└── utils.ts             # Types Product, formatPrice, finalPrice

public/
└── sw.js                # Service Worker PWA (offline + push notifs)
```

---

## Schéma de base de données

### Tables principales

| Table | Description |
|---|---|
| `produits` | Catalogue produits (référence, prix, stock, images JSON…) |
| `product_variants` | Variantes par SKU (taille/couleur) avec prix et stock individuels |
| `categories` | Catégories produits |
| `orders` | Commandes (items JSON, statuts, zone livraison) |
| `order_events` | Timeline d'événements par commande |
| `admin_users` | Comptes administrateurs (roles : admin, manager, livreur) |
| `settings` | Paramètres clé/valeur (bannière, WhatsApp…) |
| `delivery_zones` | Zones et tarifs de livraison |
| `coupons` | Codes de réduction (%, montant fixe) |
| `reviews` | Avis produits (modérés) |
| `clients` | CRM clients (VIP, blacklist, notes) |
| `produits_lies` | Produits recommandés "Vous aimerez aussi" |
| `entrepots` | Multi-boutiques / entrepôts |
| `produit_stocks` | Stock par entrepôt |
| `whatsapp_messages` | Messages WhatsApp entrants/sortants |

> **`product_variants`** est créée automatiquement (CREATE TABLE IF NOT EXISTS) au premier appel à l'API variants — pas besoin de migration manuelle.

### Schéma `product_variants`
```sql
CREATE TABLE product_variants (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  produit_id    INT NOT NULL,
  nom           VARCHAR(255) NOT NULL,      -- ex: "M · Rouge"
  options       JSON,                       -- ex: {"Taille":"M","Couleur":"Rouge"}
  prix          INT NOT NULL DEFAULT 0,     -- en FCFA
  stock         INT NOT NULL DEFAULT 0,
  reference_sku VARCHAR(255),              -- ex: "PROD-001-M-ROUGE"
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_produit_id (produit_id)
);
```

---

## Compte admin par défaut

```
Email    : admin@togolese.net
Password : admin123
```

**Changer ce mot de passe immédiatement après la première connexion.**

---

## Fonctionnalités implémentées

### Vitrine (shop)
- [x] Page d'accueil avec hero, produits en vedette, catégories
- [x] Catalogue produits avec filtres (catégorie, recherche, promos)
- [x] Fiche produit avec galerie d'images, avis, produits liés
- [x] **Variantes produit** (taille, couleur…) — prix et stock par SKU
- [x] Panier localStorage avec déduplication par variante
- [x] Checkout avec zones de livraison et codes promo
- [x] Commande WhatsApp directe depuis panier et fiche produit
- [x] Bannière promotionnelle avec plages de dates configurables
- [x] PWA : Service Worker, mode hors-ligne, icônes

### Back-office (/admin)
- [x] Dashboard avec stats 30 jours et dernières commandes
- [x] Gestion produits (CRUD, galerie multi-images via Cloudinary, actif/inactif)
- [x] **Variantes produit** — ajout/modification/suppression par produit
- [x] Import/Export CSV produits
- [x] Gestion commandes avec timeline, statuts, génération de facture PDF
- [x] Notifications temps réel nouvelles commandes (SSE + son + vibration + notification native)
- [x] Gestion catégories, zones de livraison, coupons
- [x] CRM clients (statut VIP/blacklist, historique commandes, stats)
- [x] Multi-entrepôts / stocks par entrepôt
- [x] Avis produits (modération)
- [x] Messagerie WhatsApp (lecture/envoi)
- [x] Paramètres généraux (nom site, bannière, numéros WhatsApp)
- [x] Gestion utilisateurs admin (rôles, création, désactivation)

### Infrastructure
- [x] Auth JWT httpOnly (expiration 7 jours, refresh automatique)
- [x] Protection middleware sur `/admin` et `/api/admin`
- [x] Upload Cloudinary avec transformations auto
- [x] Introspection dynamique du schéma DB (colonnes optionnelles)
- [x] Service Worker PWA avec `notificationclick` → `/admin/orders`

---

## Déploiement Netlify

Le repo est connecté à Netlify sur la branche `main`.  
Chaque `git push origin main` déclenche un build automatique.

```bash
# Vérifier le build en local avant de pousser
npm run build

# Pousser
git push origin main
```

Le fichier `netlify.toml` est configuré avec `@netlify/plugin-nextjs`.

---

## Fonctionnalités non encore implémentées

| # | Fonctionnalité | Priorité |
|---|---|---|
| 11 | Programme de fidélité (points clients) | Moyenne |
| 12 | Récupération paniers abandonnés | Moyenne |
| 13 | Analytics intégrées (ventes, conversions) | Basse |
| 14 | Notifications email commandes | Basse |
| 15 | Intégration paiement mobile (Flooz, T-Money) | Haute |

---

## Notes techniques importantes

- **Turbopack** est désactivé en dev local (`npx next dev` au lieu de `npm run dev`) — il panique dans les git worktrees avec des `node_modules` symlinkés.
- **`unstable_noStore()`** est utilisé sur `AnnouncementBar` pour forcer le rendu dynamique (paramètres lus en temps réel).
- **`product_variants`** ne nécessite pas de migration manuelle — la table est créée automatiquement.
- **CartContext** supporte la migration transparente des anciens paniers localStorage (items sans `cartKey`).
- Le champ `items` des commandes est un JSON contenant le snapshot des produits au moment de la commande (nom, prix, qty, variante).
