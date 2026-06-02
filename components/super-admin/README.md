# Super Admin ShopSaaS — package TSX (handoff Claude Code)

Back-office **plateforme** (super admin / opérateur) de ShopSaaS, prêt à
intégrer. Shell sidebar + topbar avec **7 pages entièrement interactives** :
Vue d'ensemble · Boutiques · Facturation · Plans & tarifs · Support ·
Santé système · Journal d'audit. Accent **indigo**, thème papier chaud,
polices Geist / Instrument Serif. Devise **F CFA (XOF)**, calibré ~51 boutiques.

C'est un portage **fidèle, sans perte** de `super-admin-preview.html` : mêmes
données, mêmes interactions (modals, sélection multiple, menus d'action,
toasts, journal qui s'écrit en direct), mêmes noms de classes CSS.

## Arborescence

```
super-admin/
├─ SuperAdmin.tsx          ← composant racine (UIProvider + shell + ModalRouter)
├─ SuperAdmin.css          ← feuille de styles GLOBALE (importée par SuperAdmin.tsx)
├─ store.tsx               ← UIProvider + useUI : état + TOUTES les actions
├─ types.ts                ← types du domaine + contrat du store (UIStore)
├─ icons.tsx               ← set d'icônes (remplaçable par lucide-react) + initials()
├─ data.ts                 ← données de démo + maps de couleurs par statut + NAV
├─ primitives.tsx          ← Spark, PageHead, KpiRow, Avatar, Cbx, useSel,
│                            RowMenu, Field, Modal, PlanPick, fmt, stClass
├─ modals.tsx              ← 11 modals + <ModalRouter/>
└─ pages/
   ├─ OverviewPage.tsx     ├─ BillingPage.tsx   ├─ SupportPage.tsx   └─ LogsPage.tsx
   ├─ TenantsPage.tsx      └─ PlansPage.tsx      └─ SystemPage.tsx
```

## Installation

1. Copier le dossier `super-admin/` dans `src/components/super-admin/`.
2. Monter le composant :

```tsx
// app/super-admin/page.tsx  (Next.js App Router)
'use client';
import SuperAdmin from '@/components/super-admin/SuperAdmin';
export default function Page() { return <SuperAdmin />; }
```

Aucune prop requise, aucune dépendance hors **React 18+**.
La navigation entre pages et tous les modals sont gérés en interne par le store.

> **Styles** — `SuperAdmin.css` est une feuille **globale** (classes
> volontairement non-modulaires, identiques à la source design, pour garantir
> zéro perte visuelle). Elle est importée par `SuperAdmin.tsx`. Si votre lint
> interdit les imports CSS dans un composant, déplacez l'import vers votre
> `globals.css` / `layout.tsx`. Les sélecteurs sont préfixés par `.page` ou des
> classes spécifiques ; surveillez les collisions avec des classes génériques
> existantes (`.btn`, `.tag`, `.top`…) — au besoin, enveloppez tout dans un
> wrapper et préfixez, ou convertissez en CSS Modules.

## Polices (optionnel)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
```

## Brancher des données live

Les tableaux de `data.ts` sont des **démos**. Le store (`store.tsx`) initialise
son état avec `TENANTS0`, `INVOICES0`, `TICKETS0`, `PLANS0`, `AUDIT`. Pour des
données réelles, deux options :

1. **Rapide** : remplacer le contenu des constantes `*0` de `data.ts` par vos
   fetchers (les formes sont typées dans `types.ts`).
2. **Propre** : injecter les données initiales en props de `UIProvider` et
   remplacer chaque action (`inviteTenant`, `changePlan`, `markInvoice`,
   `addTicket`…) par un appel API + invalidation. Le contrat `UIStore` liste
   toutes les actions à câbler.

Toutes les pages lisent l'état via `useUI()` — elles se mettent à jour
automatiquement quand le store change.

## Ce qui est interactif (sans perte vs le prototype)

- **Navigation** : sidebar → 7 pages.
- **Boutiques** : onglets de statut (compteurs dynamiques), cases à cocher +
  tout sélectionner → **barre d'actions groupées** (email, suspendre) ; menu ⋮
  par ligne (détails, changer de plan, email, suspendre/réactiver, supprimer) ;
  clic ligne → modal détail.
- **Facturation** : sélection multiple (relancer / marquer payées), menu ⋮,
  modal facture (renvoyer / marquer payée / rembourser) + modal remboursement.
- **Plans** : éditer un plan, créer un plan.
- **Support** : nouveau ticket, modal conversation (répondre, assigner, résoudre,
  rouvrir).
- **Santé système** : modal incident (chronologie).
- **Effets réels** : suspendre déplace la boutique entre onglets et met à jour
  les KPIs ; marquer payé change le statut ; chaque action écrit une ligne dans
  le **Journal d'audit** et déclenche un **toast**.

## Icônes

`icons.tsx` exporte un objet `I` d'icônes compatibles Lucide. Si vous utilisez
`lucide-react`, mappez-les (voir l'en-tête du fichier) et supprimez `icons.tsx`.

## Personnalisation

- **Accent** : `--accent` / `--accent-2` / `--accent-bg` en tête de `.page`
  dans `SuperAdmin.css` (indigo par défaut).
- **Couleurs de statut** : `PLAN_ST`, `INV_ST`, `PRIO_ST`, `SYS_ST` dans `data.ts`.
- **Navigation** : tableau `NAV` dans `data.ts`.

---

## ⌁ PROMPT EXACT à coller dans Claude Code

> Copiez-collez le bloc ci-dessous tel quel dans Claude Code, à la racine de
> votre projet React/Next.js, **après avoir déposé le dossier `super-admin/`**.

```
Tu intègres le module « Super Admin » (back-office plateforme) de ShopSaaS dans ce projet React + TypeScript. Le code source complet se trouve dans le dossier `super-admin/` (composants TSX + une feuille `SuperAdmin.css`). NE RÉÉCRIS PAS les composants : intègre-les tels quels, sans perte de données ni de fonctionnalités.

Contexte du module :
- Back-office de l'OPÉRATEUR de la plateforme (pas l'admin d'une boutique). Multi-tenant : il pilote toutes les boutiques abonnées.
- Pile : React 18+, TypeScript. Aucune dépendance externe. Styles via feuille globale `SuperAdmin.css`.
- 7 pages dans `super-admin/pages/` : Vue d'ensemble (MRR/ARR/churn), Boutiques (tenants), Facturation, Plans & tarifs, Support, Santé système, Journal d'audit.
- État + actions centralisés dans `super-admin/store.tsx` (`UIProvider` / `useUI`). Le contrat complet est typé dans `super-admin/types.ts` (interface `UIStore`).
- Interactivité déjà câblée : modals (`super-admin/modals.tsx` + `ModalRouter`), sélection multiple, menus d'action ⋮, toasts, journal qui s'écrit en direct.
- Données de démo dans `super-admin/data.ts` (devise F CFA, ~51 boutiques, villes du Togo). Les formes sont typées.

Tâches, dans cet ordre :
1. Place le dossier sous `src/components/super-admin/` (ou l'équivalent de ce projet) sans modifier les fichiers.
2. Monte le composant : `import SuperAdmin from '.../super-admin/SuperAdmin'` puis `<SuperAdmin />` sur une route protégée réservée aux administrateurs plateforme (ex. `/super-admin`). Le composant gère lui-même sa navigation interne.
3. Assure l'import de `SuperAdmin.css`. S'il y a un risque de collision de classes globales (`.btn`, `.tag`, `.top`, `.page`, `.head`…) avec le reste de l'app, isole le module : enveloppe le rendu dans un conteneur dédié et préfixe les sélecteurs, OU convertis `SuperAdmin.css` en CSS Module — sans changer l'apparence.
4. Branche les données réelles SANS perte : remplace les constantes `TENANTS0`, `INVOICES0`, `TICKETS0`, `PLANS0`, `AUDIT` de `data.ts` par les données de l'API, en respectant strictement les types de `types.ts`. Puis remplace le corps de chaque action du store (`inviteTenant`, `changePlan`, `setStatus`, `bulkStatus`, `removeTenant`, `markInvoice`, `savePlan`, `addTicket`, `updateTicket`, `assignTicket`) par les appels API correspondants, en conservant les mises à jour optimistes de l'UI, les toasts et l'écriture au journal d'audit.
5. (Optionnel) Polices Geist / Geist Mono / Instrument Serif via Google Fonts ; sinon le fallback système s'applique.
6. Vérifie la compilation TypeScript, le rendu des 7 pages, l'ouverture de tous les modals et le bon fonctionnement de la sélection multiple. Ne modifie ni les libellés FR, ni la palette, ni la structure visuelle.

Contraintes : garde le français, l'accent indigo et la devise F CFA. N'introduis aucune librairie UI. Préserve chaque interaction existante.
```
