# UI Freeze — Dashboard

Les fichiers suivants sont gelés. Aucune modification n'est autorisée sans :
1) Label GitHub `allow-ui-change`
2) Approbation du PO (CODEOWNERS)

## Liste des fichiers gelés
- app/(private)/dashboard/page.tsx
- components/dashboard/Hero.tsx
- components/dashboard/QuickCreateCarousel.tsx
- components/layout/Sidebar.tsx
- app/(private)/dashboard/_components/StatCard.tsx
- app/globals.css
- tailwind.config.ts

## Raisons
- Préserver l'UI validée (hero, slider, CTA, sidebar, KPIs)
- Éviter toute régression avant la démo PSG

## Comment déverrouiller temporairement

Pour modifier un fichier gelé :
1. Créer une PR
2. Ajouter le label `allow-ui-change` à la PR
3. Le PO approuve la PR via CODEOWNERS
4. La modification est permise

## Tag de freeze
- Tag immuable : `ui-freeze-2025-10-26`
- Branche stable : `stable/dashboard-ui-v1`

Pour revenir à l'état gelé :
```bash
git checkout ui-freeze-2025-10-26
```

