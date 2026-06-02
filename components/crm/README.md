# CRM — intégration TSX

Espace **CRM** de ShopSaaS prêt à l'emploi : shell sidebar + topbar avec
cinq pages (Vue d'ensemble, Comptes clients, Fidélité, Parrainage,
Campagnes). Accent violet, thème papier chaud, polices Geist / Instrument Serif.

## Fichiers

```
crm/
├─ Crm.tsx              ← composant principal (shell + routeur interne)
├─ Crm.module.css       ← styles scoped (CSS Modules)
├─ types.ts             ← types du domaine (Client, Tier, Referral, Campaign…)
├─ data.ts              ← données de démo + maps de couleurs par statut
├─ icons.tsx            ← set d'icônes (remplaçable par lucide-react)
├─ primitives.tsx       ← Spark, PageHead, KpiRow, Tag, fmt
└─ pages/
   ├─ OverviewPage.tsx
   ├─ ClientsPage.tsx
   ├─ LoyaltyPage.tsx
   ├─ ReferralPage.tsx
   └─ CampaignsPage.tsx
```

## Installation

Copiez le dossier `crm/` dans `src/components/crm/`.
Aucune dépendance en dehors de React 18+. Le projet doit supporter les
**CSS Modules** (natif sous Next.js, Vite, CRA).

## Polices (optionnel)

Ajoutez dans votre `<head>` (ou `_app.tsx` / `layout.tsx`) :

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
```

## Usage — autonome (state interne)

Le composant gère lui-même la page active : il suffit de le monter.

```tsx
// app/admin/crm/page.tsx
'use client';
import Crm from '@/components/crm/Crm';

export default function CrmPage() {
  return <Crm shopName="Maison Diallo" userName="Kent Diallo" userRole="Propriétaire" />;
}
```

## Usage — piloté par le routeur (mode contrôlé)

Pour synchroniser la page active avec l'URL (`/admin/crm/clients`, etc.) :

```tsx
'use client';
import { useRouter } from 'next/navigation';
import Crm from '@/components/crm/Crm';
import type { CrmPageId } from '@/components/crm/types';

export default function CrmPage({ params }: { params: { page: CrmPageId } }) {
  const router = useRouter();
  return (
    <Crm
      page={params.page}
      onPageChange={(p) => router.push(`/admin/crm/${p}`)}
      onBack={() => router.push('/admin')}
    />
  );
}
```

## Props

| Prop           | Type                        | Défaut             | Rôle |
|----------------|-----------------------------|--------------------|------|
| `shopName`     | `string`                    | `"Maison Diallo"`  | Fil d'ariane |
| `userName`     | `string`                    | `"Kent Diallo"`    | Pied de sidebar + avatar |
| `userRole`     | `string`                    | `"Propriétaire"`   | Sous-titre utilisateur |
| `page`         | `CrmPageId`                 | —                  | Mode contrôlé : page active |
| `onPageChange` | `(p: CrmPageId) => void`    | —                  | Mode contrôlé : navigation |
| `onBack`       | `() => void`                | —                  | Clic sur le chevron retour |

`CrmPageId = 'overview' | 'clients' | 'loyalty' | 'referral' | 'campaigns'`

## Brancher des données live

Les tableaux exportés par `data.ts` sont des **démos**. Remplacez-les par
vos résultats d'API — les formes sont typées dans `types.ts` :

```tsx
import type { Client, Campaign } from '@/components/crm/types';

const clients: Client[] = await api.getClients();   // → table Comptes clients
const campaigns: Campaign[] = await api.getCampaigns(); // → cartes Campagnes
```

Chaque page importe directement depuis `data.ts`. Pour des données live,
deux options :
1. Remplacez le contenu de `data.ts` par vos fetchers / hooks.
2. Refactorisez chaque page pour recevoir ses données en `props` (les
   composants sont déjà découpés par page, c'est trivial).

Les `KPIS` et séries de sparkline sont définis en tête de chaque page —
ajustez-y les valeurs et les couleurs (`c`) au besoin.

## Icônes

`icons.tsx` fournit un set compatible Lucide. Si vous utilisez déjà
`lucide-react`, remplacez les imports par les équivalents
(`Home`, `Users`, `Award`, `Gift`, `Send`, `Mail`, `MessageCircle`,
`Star`, `Settings`…) et supprimez `icons.tsx`.

## Personnalisation

- **Couleur d'accent** : `--accent` / `--accent-2` / `--accent-bg` en tête
  de `.page` dans `Crm.module.css` (violet par défaut).
- **Couleurs de statut** : maps `TIER_STYLE`, `REFERRAL_STYLE`,
  `CAMPAIGN_STYLE` dans `data.ts`.
- **Navigation** : tableau `NAV` dans `data.ts` (libellés, compteurs, badge).

## Responsive

Sous **1080px** la sidebar se masque et les grilles passent en 2 (puis 1)
colonnes. Pour conserver la sidebar sur mobile, ajoutez un tiroir (drawer)
autour de `<aside className={styles.sidebar}>`.
