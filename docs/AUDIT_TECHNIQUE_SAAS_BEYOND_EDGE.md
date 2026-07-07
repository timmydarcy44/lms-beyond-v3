# Audit technique du SaaS Beyond / EDGE

**Date de l'audit :** 5 juillet 2026  
**Repository analysé :** `lms-beyond-v3` (monorepo Next.js)  
**Périmètre :** SaaS Beyond / EDGE uniquement  
**Méthode :** Analyse statique du code source, des migrations, de la configuration et de l'historique Git (613 commits observables)

---

## 1. Synthèse exécutive

### Ce qu'est le SaaS Beyond / EDGE

Beyond / EDGE est une **plateforme SaaS multi-tenant** de gestion, validation et développement des compétences professionnelles. Elle combine :

- un **LMS** (formations, parcours, contenus, progression) ;
- un **moteur d'évaluation** (tests comportementaux DISC, soft skills, IDMC, hard skills, entretiens expérientiels) ;
- un **système de badges** (Open Badges IMS Global via Prisma + badges internes) ;
- des **espaces métiers** pour apprenants, entreprises, écoles, formateurs, experts et administrateurs ;
- des **produits satellites** intégrés au même socle technique (Beyond Connect, Beyond Note, Beyond Care, Beyond No School, Beyond Play).

La branche **EDGE** (EDGE Lab / EDGE Online / EDGE Particulier) constitue le positionnement « validation et développement des compétences » avec profil public, référentiel métiers, matching de carrière et parcours de progression.

### Objectif fonctionnel

Permettre à des **particuliers**, **salariés**, **entreprises** et **organismes de formation** de :

1. **Évaluer** des compétences (comportementales, techniques, motivationnelles) ;
2. **Développer** des compétences via parcours, contenus et accompagnement ;
3. **Prouver** et **certifier** des acquis (badges, validations, preuves) ;
4. **Valoriser** les profils (profil public EDGE, analytics RH, radar d'équipe).

### Niveau d'avancement technique (observé)

| Dimension | Niveau |
|-----------|--------|
| Couverture fonctionnelle | **Élevé** — 20+ espaces dashboard, 474 routes API |
| Déploiement production | **Fonctionnel** — Vercel (`vercel.json`), région Paris (`cdg1`) |
| Profil EDGE / particulier | **Avancé en cours de consolidation** — migrations juillet 2026, tests unitaires récents |
| Qualité automatisée | **Faible** — 37 fichiers de tests pour ~474 APIs |
| CI/CD automatisé | **Absent** — pas de GitHub Actions identifié |
| Typage TypeScript en build | **Désactivé** — `ignoreBuildErrors: true` dans `next.config.ts` |

**Conclusion synthétique :** le SaaS constitue un **actif logiciel substantiel**, en production, avec une architecture monolithique modulaire. La dette principale porte sur les tests, la CI et la séparation stricte des produits dans le monorepo.

---

## 2. Périmètre de l'audit

### 2.1 Dossiers et modules INCLUS (SaaS Beyond / EDGE)

| Zone | Chemin principal | Rôle |
|------|------------------|------|
| Application Next.js | `src/app/` (hors exclusions) | Pages, routes, API |
| Dashboards multi-rôles | `src/app/dashboard/` | Espaces SaaS par persona |
| EDGE Online | `src/app/edgeonline/` | Portail formations / parcours public |
| EDGE Lab (gateway SaaS) | `src/app/edge-lab/` | Shell marketing + accès catalogue (couplé au SaaS) |
| Particuliers EDGE | `src/app/particuliers/` | Onboarding B2C |
| Super-admin | `src/app/super/` | Studio, CRM, catalogue, IA admin |
| API backend | `src/app/api/` (hors `jessica-contentin`) | ~474 handlers REST |
| Logique métier | `src/lib/` (hors `jessica-contentin`) | ~65 modules domaine |
| Composants SaaS | `src/components/` (hors Jessica) | UI réutilisable |
| Profil EDGE | `src/components/apprenant/profil-edge/`, `src/components/hard-skills/`, `src/components/public-profile/` | Validation compétences |
| Beyond produits | `src/app/beyond-connect-app/`, `beyond-note-app/`, `beyond-care/`, `beyond-no-school/`, `beyond-play/` | Modules SaaS intégrés |
| Schéma Supabase | `supabase/migrations/` | 108 migrations SQL |
| Open Badges | `prisma/`, `src/lib/openbadges/` | Schéma et logique badges |
| Auth & middleware | `middleware.ts`, `middleware-edgebs.ts`, `src/lib/auth/` | Multi-tenant, rôles |
| IA | `src/lib/ai/`, `src/app/api/ai/`, `docs/ia/` | Génération et analyse |
| Déploiement | `vercel.json`, `next.config.ts` | Build et crons |
| Tests | `src/**/*.test.ts`, `vitest.config.ts` | 37 fichiers |

### 2.2 Dossiers et modules EXCLUS (strictement hors périmètre)

| Exclusion | Chemins | Motif |
|-----------|---------|-------|
| **Site Jessica Contentin** | `src/app/jessica-contentin/`, `src/lib/jessica-contentin/`, `public/jessica-contentin/` | Site vitrine / programmes Jessica, non SaaS EDGE |
| **API Jessica** | `src/app/api/jessica-contentin/` (5 routes) | Fonctionnalités Jessica isolées |
| **Admin Jessica** | `src/app/super/catalogue-jessica`, `super/jessica-dashboard` | Back-office Jessica |
| **MOS** | `src/app/mos/`, `public/mos/` | Site institutionnel MOS |
| **Docs Jessica audit** | `AUDIT_*_JESSICA_*`, `SEO_STRATEGY_JESSICA_*`, `LISTE_EMAILS_JESSICA_*` (racine) | Documentation hors SaaS |
| **Redirects Jessica dans build** | Référence `jessica-contentin/programmes-catalog` dans `next.config.ts` | Couplage technique résiduel (signalé en risque §15) |

### 2.3 Périmètre hybride (inclus partiellement)

| Zone | Traitement |
|------|------------|
| `src/app/edge-lab/` | Inclus comme **porte d'entrée EDGE** vers le SaaS (catalogue, orientation) |
| `src/app/app-landing/`, `for-business/`, `for-education/` | Inclus comme **pages d'acquisition** du SaaS Beyond |
| `src/app/beyond-center/` (marketing) | **Exclu** si pages institutionnelles pures ; inclus si flux vers SaaS |
| `src/lib/edge-site/` | Marketing EDGE couplé au catalogue SaaS — mentionné, non valorisé comme actif principal |

---

## 3. Stack technique détaillée

| Technologie | Version / fichier | Rôle dans le SaaS |
|-------------|-------------------|-------------------|
| **Next.js** | 16.x (`package.json`) | Framework full-stack : SSR, App Router, API Routes |
| **React** | 19.2 | Interface utilisateur |
| **TypeScript** | 5.9 | Typage (partiellement contourné au build) |
| **Tailwind CSS** | 4.x | Design system utility-first |
| **Radix UI** | Multiple packages | Composants accessibles (dialogs, tabs, etc.) |
| **Supabase** | `@supabase/ssr`, `@supabase/supabase-js` | Auth, PostgreSQL, RLS, stockage |
| **Prisma** | 6.16 | ORM Open Badges (schéma séparé) |
| **PostgreSQL** | Via Supabase + `DATABASE_URL` Prisma | Base relationnelle principale |
| **Stripe** | 19.x | Paiements, Connect, webhooks (`api/nevo/stripe/`, `api/stripe/`) |
| **OpenAI** | 6.x | LLM principal (génération, analyse) |
| **Anthropic** | SDK 0.80 | LLM alternatif |
| **Google Generative AI** | 0.24 | LLM / compléments |
| **Google Cloud Vision** | 5.x | OCR / analyse documentaire |
| **AWS S3** | SDK 3.x | Stockage fichiers (`@aws-sdk/client-s3`) |
| **Resend** | 6.x | Emails transactionnels |
| **TanStack Query** | 5.x | Cache et fetching client |
| **Zustand** | 5.x | État global léger |
| **TipTap** | 3.x | Éditeur riche (contenus pédagogiques) |
| **Recharts** | 3.x | Graphiques analytics |
| **Framer Motion** | 12.x | Animations UI |
| **Vitest** | 2.x | Tests unitaires |
| **Puppeteer** | 24.x | Génération PDF / rendu |
| **next-pwa** | 5.x | Progressive Web App |
| **Zod** | 4.x | Validation schémas |
| **pnpm** | 9.0 | Gestionnaire de paquets |

### Routing

- **App Router** Next.js : `src/app/**/page.tsx`, `layout.tsx`
- **API** : `src/app/api/**/route.ts` (474 fichiers `route.ts` comptés)
- **Middleware** : `middleware.ts` (multi-tenant, rôles), `middleware-edgebs.ts` (domaine `edgebs.fr`)

### Hébergement (identifiable)

- **Vercel** — `vercel.json` : build `pnpm build`, région `cdg1` (Paris)
- Cron hebdomadaire : `/api/cron/radar-equipe-compute` (lundis 06:00)
- Output : `standalone` (`next.config.ts`)

### Variables d'environnement (non listées — non accessibles dans l'audit)

Rôles probables d'après le code : `DATABASE_URL`, clés Supabase, OpenAI, Stripe, Resend, AWS S3, URLs publiques.  
→ **Secrets non audités** (normal pour un audit code-only).

---

## 4. Architecture générale

### 4.1 Organisation du repository

Monorepo **single-package** (`package.json` unique) avec :

```
src/
├── app/          # Routes Next.js (pages + API)
├── components/   # UI par domaine
├── lib/          # Logique métier, requêtes, auth, IA
├── modules/      # Modules isolés (beyond-play)
├── hooks/        # Hooks React
└── types/        # Types partagés (database.ts, etc.)
supabase/migrations/  # Évolution schéma LMS
prisma/               # Schéma Open Badges
scripts/              # Scripts ops (91 fichiers — hors valorisation directe)
```

### 4.2 Séparation frontend / backend

- **Pas de backend séparé** : logique serveur dans Route Handlers Next.js (`src/app/api/`) et Server Components / actions.
- **Accès données** : clients Supabase (`src/lib/supabase/server.ts`, `client.ts`) + Prisma pour badges.

### 4.3 Patterns observés

| Pattern | Implémentation |
|---------|----------------|
| Multi-tenant par hostname | `src/lib/tenant/config.ts`, `middleware.ts` |
| RBAC par rôle | `src/lib/auth/dashboard-routing.ts`, `require-role.ts` |
| Requêtes centralisées | `src/lib/queries/` (apprenant, entreprise, edge-online, etc.) |
| Migrations incrémentales | `supabase/migrations/` (108 fichiers) |
| Génération IA centralisée | `src/lib/ai/openai-client.ts`, `ai-provider-config.ts` |
| Domain-driven lib folders | `hard-skills/`, `career-profiles/`, `openbadges/`, `radar-equipe/` |

### 4.4 Modularité et maintenabilité

**Points forts :**
- Modules métier identifiables sous `src/lib/`
- Composants Profil EDGE factorisés (`profil-edge/`, `hard-skills/`)
- Migrations datées et commentées (ex. `20260705100000_career_profiles.sql`)

**Points faibles :**
- Monorepo multi-produits (6+) dans un seul dépôt
- 474 APIs sans couche service uniforme
- `typescript.ignoreBuildErrors: true` — risque de régressions silencieuses
- Scripts ops nombreux non intégrés à un pipeline

**Évaluation maintenabilité globale :** **Moyenne à bonne** pour une équipe connaissant le domaine ; **exigeante** pour onboarding externe.

---

## 5. Description fonctionnelle du SaaS Beyond / EDGE

### 5.1 Tableau des fonctionnalités

| Module | Description | Fichiers clés | Maturité |
|--------|-------------|---------------|----------|
| **Auth & onboarding** | Login OTP/mot de passe Supabase, inscription particuliers/entreprises, onboarding client | `src/lib/auth/`, `src/app/(auth)/`, `api/auth/`, `api/onboarding/`, `api/particuliers/` | **Fonctionnel** |
| **Dashboard apprenant** | Parcours, formations, profil, tests, badges, coaching | `src/app/dashboard/apprenant/`, `src/lib/queries/apprenant.ts` | **Avancé** |
| **Profil EDGE particulier** | Maturité profil, projet pro, identité, expériences, diplômes, hard skills, matching métier | `src/components/apprenant/profil-edge/`, `src/lib/particulier/`, `src/lib/career-profiles/`, `src/lib/hard-skills/` | **Avancé** (évolution juillet 2026) |
| **Profil public EDGE** | Page publique `/p/[slug]`, cartes compétences, analyse, indice fiabilité | `src/components/public-profile/`, `src/app/p/` | **Fonctionnel** |
| **Hard skills validation** | Entretien expérientiel, import preuves, analyse EDGE, historique | `api/learner/skill-validation/`, `src/lib/hard-skills/` | **Fonctionnel** |
| **Soft skills** | Tests Likert, analyse IA, résultats salarié/apprenant | `src/lib/soft-skills/`, `api/soft-skills/` | **Fonctionnel** |
| **DISC / IDMC** | Tests comportementaux, scoring | `src/lib/disc/`, `src/lib/idmc/` | **Fonctionnel** |
| **Référentiel métiers** | Table `career_profiles`, matching, plan d'action | `src/lib/career-profiles/`, migration `20260705100000_career_profiles.sql` | **Fonctionnel** |
| **EDGE Online** | Catalogue formations, hero, filtres, parcours | `src/app/edgeonline/`, `src/lib/edge-online/`, `src/lib/training-courses/` | **Avancé** |
| **LMS / Formations** | Builder cours, chapitres, flashcards, progression | `src/app/dashboard/formateur/`, `api/courses/`, migrations `courses`, `learning_sessions` | **Avancé** |
| **Parcours** | Paths, enrollments, triggers (études de cas, oral, PDF) | `src/lib/parcours.ts`, `api/path-triggers/` | **Avancé** |
| **Open Badges** | BadgeClass, Assertion, Assessment, baking SVG/PNG, LinkedIn | `src/lib/openbadges/`, `prisma/schema.prisma`, `api/earner/badges/` | **Très avancé** (14+ tests) |
| **Dashboard entreprise** | Salariés, radar équipe, talents, offres, analytics, assistant IA | `src/app/dashboard/entreprise/`, `src/lib/radar-equipe/`, `api/dashboard/entreprise/` | **Avancé** |
| **Dashboard école** | Classes, alternance, handicap, Qualiopi, offres emploi | `src/app/dashboard/ecole/` | **Fonctionnel à avancé** |
| **Dashboard formateur** | Formations, drive, ressources, quiz IA | `src/app/dashboard/formateur/`, `api/formateur/` | **Avancé** |
| **Experts / Marketplace** | Cockpit expert, interventions, Stripe Connect, BCT | `src/lib/expert/`, `src/lib/marketplace/`, `api/marketplace/` | **Fonctionnel** |
| **Beyond Connect** | Matching emploi, offres, certifications | `src/app/beyond-connect-app/`, `api/beyond-connect/` (47 routes) | **Avancé** |
| **Beyond Note** | App note + IA (Nevo) | `src/app/beyond-note-app/`, `api/nevo/` | **Fonctionnel** (produit distinct, même socle) |
| **Beyond Care** | Santé mentale, questionnaires | `src/app/beyond-care/`, `api/mental-health/`, `api/beyond-care/` | **Fonctionnel** |
| **Beyond No School** | Preuves, parcours alternatifs | `src/lib/bns/`, `api/bns/`, migrations `013_bns_*` | **Fonctionnel** |
| **CRM / Super-admin** | Pipeline, Jarvis IA, studio formations | `src/app/super/`, `src/lib/crm/`, `api/super-admin/` | **Avancé** |
| **Stripe / facturation** | Checkout, webhooks, abonnements | `api/stripe/`, `api/nevo/stripe/webhook/route.ts` | **Fonctionnel** (webhook protégé par règle critique) |
| **Emails** | Templates particulier EDGE, validation compétences | `src/lib/emails/templates/particulier-edge-emails.ts` | **Fonctionnel** |
| **Recommandations / plan d'action** | Plan personnalisé formations/coachings/badges | `src/lib/learner/personalized-action-plan.ts` | **Fonctionnel** |
| **Analytics / radar** | Agrégats équipe, gaps, cron compute | `src/lib/radar-equipe/`, `api/cron/radar-equipe-compute` | **Fonctionnel** |
| **Drive / ressources** | Documents formateur, HTML, RLS | migrations `drive_*`, `resources_*` | **Fonctionnel** |

### 5.2 Produits Beyond intégrés au même actif

Le repository héberge **plusieurs produits SaaS** partageant auth, DB et déploiement. Pour la valorisation comptable, ils constituent des **modules d'un même socle technique Beyond**, dont **EDGE** est la verticale « compétences et validation ».

---

## 6. Analyse des modules SaaS valorisables

| # | Module | Objectif métier | Complexité | Fichiers principaux | Avancement | Intérêt économique |
|---|--------|-----------------|------------|---------------------|------------|-------------------|
| 1 | **Socle LMS multi-tenant** | Héberger formations et parcours pour plusieurs orgs | Très élevé | `middleware.ts`, `005_COMPLETE_DB_MIGRATION.sql`, `src/lib/queries/` | Avancé | Socle obligatoire — forte valeur |
| 2 | **Moteur Open Badges** | Certifier et partager compétences (IMS Global) | Très élevé | `src/lib/openbadges/`, `prisma/`, 14+ tests | Très avancé | Différenciant, monétisable |
| 3 | **Profil EDGE & validation compétences** | Évaluer, expliquer, développer, prouver compétences | Élevé | `hard-skills/`, `profil-edge/`, `public-profile/`, `career-profiles/` | Avancé (2026) | Cœur stratégique EDGE |
| 4 | **Référentiel métiers + matching** | Compatibilité métier, plan d'action | Élevé | `career-profile-matching.ts`, `career_profiles` table | Fonctionnel | B2C / orientation carrière |
| 5 | **EDGE Online (catalogue)** | Distribution formations EDGE | Moyen à élevé | `edgeonline/`, `training-courses/`, `edge-online/` | Avancé | Revenus abonnement |
| 6 | **Tests & scoring (DISC, soft, IDMC)** | Diagnostic comportemental | Moyen | `disc/`, `soft-skills/`, `idmc/` | Fonctionnel | Entrée tunnel conversion |
| 7 | **Radar équipe entreprise** | Analytics RH, gaps collectifs | Élevé | `radar-equipe/`, cron compute | Fonctionnel | B2B RH |
| 8 | **Beyond Connect** | Matching talents / offres | Très élevé | `api/beyond-connect/` (47 routes) | Avancé | Produit emploi |
| 9 | **Marketplace experts (BCT)** | Mise en relation coachs / praticiens | Élevé | `marketplace/`, Stripe Connect | Fonctionnel | Commission / services |
| 10 | **Studio super-admin + CRM** | Opérations commerciales et contenu | Élevé | `super/`, `crm/`, `super-admin/` APIs | Avancé | Opérations internes |
| 11 | **Moteur IA contenu** | Génération cours, chapitres, QCM, analyses | Très élevé | `api/ai/`, `src/lib/ai/` | Avancé | Productivité / différenciation |
| 12 | **Beyond Note (Nevo)** | Transformation documents IA | Élevé | `api/nevo/`, `beyond-note-app/` | Fonctionnel | Produit annexe |
| 13 | **Beyond Care / BNS** | Santé mentale / parcours non scolaire | Moyen à élevé | `mental-health/`, `bns/` | Fonctionnel | Verticales niche |

---

## 7. Modèle de données

### 7.1 Sources de schéma

1. **Supabase / PostgreSQL** — schéma LMS principal (108 migrations)
2. **Prisma** — Open Badges (`prisma/schema.prisma`)

### 7.2 Entités principales (Supabase — observées dans migrations)

| Entité | Rôle métier | Fichier référence |
|--------|-------------|-------------------|
| `organizations` | Tenants / galaxie / EDGE Lab | `005_COMPLETE_DB_MIGRATION.sql` |
| `org_memberships` | Appartenance utilisateur ↔ org | idem |
| `profiles` | Utilisateur enrichi (rôle, projet pro, hard_skills, skills_metadata, DISC, etc.) | `20260617100000_profiles_particuliers_edge_columns.sql`, `20260705000000_particulier_profil_comportemental.sql` |
| `courses` | Formations (builder_snapshot, cover, SEO) | `20260413_add_snapshot_to_courses.sql`, `20260703140000_training_courses.sql` |
| `paths` | Parcours multi-formations | `20260428123000_create_path_enrollments.sql` |
| `learning_sessions`, `course_progress`, `path_progress` | Progression apprenant | `005_COMPLETE_DB_MIGRATION.sql` |
| `career_profiles` | Référentiel métiers EDGE | `20260705100000_career_profiles.sql` |
| `training_courses` | Catalogue EDGE Online CMS | `20260703140000_training_courses.sql` |
| `soft_skills_resultats_salarie` | Résultats tests soft skills | `20260407160000_soft_skills_resultats_salarie.sql` |
| `experts` | Profils experts marketplace | `20260404120000_experts_cockpit_columns.sql` |
| `employee_missions` | Missions salariés entreprise | `20260605120000_employee_missions.sql` |
| `bns_proofs`, `bns_proof_paths` | Preuves Beyond No School | `013_bns_proofs.sql` |
| `path_trigger_submissions` | Soumissions études de cas / oral | `20260430162000_create_path_trigger_submissions.sql` |
| CRM / pipeline | Deals, onboarding client | `20260526120000_crm_pipeline.sql` |

### 7.3 Données compétences (Profil EDGE)

Stockées principalement dans **`profiles`** (JSONB) :

- `hard_skills` : liste compétences techniques
- `skills_metadata` : niveaux, preuves, `validation` (historique, analyse EDGE, verdict)
- `experiences_pro`, `diplomes` : parcours professionnel
- `professional_project`, `target_career_slug` : orientation métier
- Champs DISC, soft skills, IDMC (migrations comportementales)

### 7.4 Entités Prisma (Open Badges)

`Organization`, `User`, `BadgeClass`, `Assertion`, `Assessment`, `Evidence`, `IssuerProfile`, `CompetencyFramework`, `AuditLog` — conformité Open Badges v2.

### 7.5 Relations clés (logique)

```
Organization ──< org_memberships >── Profile (auth.users)
Organization ──< courses, paths, groups
Profile ── hard_skills / skills_metadata / career target
career_profiles (référentiel) ── matching ── Profile
BadgeClass ── Assertion ── Assessment ── Evidence
```

---

## 8. Authentification, droits et sécurité

### 8.1 Authentification

- **Supabase Auth** avec cookies SSR (`@supabase/ssr`)
- Session : `src/lib/auth/session.ts` (`getSession`)
- Flux particulier EDGE : `src/lib/auth/edge-signup-flow.ts`
- **Règle critique** (`.cursor/rules/critical-auth.mdc`) : `signInWithOtp`, webhook Stripe, note-app auth gate — zones sensibles identifiées

### 8.2 Rôles (`src/types/database.ts`)

`formateur | apprenant | admin | tuteur | entreprise | ecole | club | partenaire | demo | praticien | expert`

Routing dashboard : `src/lib/auth/dashboard-routing.ts`  
Particulier → espace `apprenant`.

### 8.3 Permissions API

- `src/lib/auth/require-role.ts` — headers `x-user-id`, `x-org-id`, `x-user-role`
- `src/lib/auth/super-admin.ts` + allowlist email
- RLS Supabase sur nombreuses tables (migrations `*_rls*`)

### 8.4 Points de vigilance

| Risque | Détail |
|--------|--------|
| Admin email hardcodé | Fallback dans `session.ts` (observé par exploration) |
| Double système de rôles | Supabase string roles vs Prisma `UserRole` enum |
| Build sans typage | `ignoreBuildErrors: true` |
| Surface API large | 474 routes — surface d'attaque étendue |
| Scripts prod | `scripts/prod-*.mjs` non versionnés en CI |

### 8.5 RGPD

- Table / logique radar équipe : `20260601120000_radar_equipe_rgpd.sql`
- Profil public : données exposées volontairement (`/p/[slug]`) — consentement à vérifier côté métier (hors code)

---

## 9. API et logique backend

### 9.1 Volume

**474 fichiers `route.ts`** sous `src/app/api/`.

### 9.2 Domaines API EDGE / Beyond (principaux)

| Préfixe | ~Routes | Finalité |
|---------|---------|----------|
| `/api/beyond-connect` | 47 | Emploi, matching |
| `/api/super-admin` | 38 | Administration plateforme |
| `/api/admin` | 35 | Badges, experts, compétences |
| `/api/dashboard` | 27 | APIs par rôle dashboard |
| `/api/ai` | 20 | Génération et analyse IA |
| `/api/nevo` | 20 | Beyond Note |
| `/api/bns` | 19 | Beyond No School |
| `/api/super` | 16 | CMS formations, career profiles |
| `/api/learner` | 6 | Validation compétences, profils |
| `/api/soft-skills` | 5 | Analyse soft skills |
| `/api/radar-equipe` | 5 | Calcul radar |
| `/api/stripe` | 12 | Paiements |
| `/api/auth` | 8 | Authentification |
| `/api/cron` | 3 | Tâches planifiées |

### 9.3 Exemple — validation hard skills

- `POST /api/learner/skill-validation/interview` — questions + analyse (`src/app/api/learner/skill-validation/interview/route.ts`)
- `POST /api/learner/skill-validation/import` — import preuve
- Logique : `src/lib/hard-skills/skill-validation-analysis.ts`, `skill-evaluation-report.ts`

---

## 10. IA, automatisation et scoring

### 10.1 Infrastructure

- Clients : `src/lib/ai/openai-client.ts`, `anthropic-client.ts`
- Configuration par feature : `ai-provider-config.ts`
- Logging usage : `usage-logger.ts`, `ai-interaction-logger.ts`

### 10.2 Usages IA dans EDGE / Beyond (observés)

| Usage | Finalité | Fichiers |
|-------|----------|----------|
| Entretien expérientiel | Évaluation hard skills | `api/learner/skill-validation/interview`, `api/ai/experiential-interview` |
| Analyse soft skills | Synthèse résultats tests | `api/soft-skills/analyze` |
| Génération référentiel métiers | Enrichissement `career_profiles` | `api/super/career-profiles/generate` |
| Génération contenu pédagogique | Chapitres, flashcards, cours | `api/ai/generate-*`, `api/beyond-ia/` |
| Assistants dashboard | Chat entreprise / école | `api/dashboard/*/assistant/chat` |
| Jarvis super-admin | Assistant ops | `api/super-admin/jarvis/chat` |
| Path triggers | Correction études de cas, oral | `api/path-triggers/submit-*` |
| Open Badges playground | Évaluation critères badges | `src/lib/openbadges/badge-playground-ai.ts` |
| Profil public / analyse | Synthèse profil | `api/public-profile-analysis`, `api/profile-analysis` |

### 10.3 Scoring (non-IA)

- DISC : `src/lib/disc/disc-scoring.ts`
- IDMC : axes dans profil apprenant
- Soft skills : scores Likert — `src/lib/soft-skills/`
- Matching métier : `src/lib/career-profiles/career-profile-matching.ts`
- Maturité Profil EDGE : `src/lib/particulier/profil-edge-maturity.ts`
- Radar équipe : `src/lib/radar-equipe/compute-aggregats.ts`

### 10.4 Limites

- Dépendance forte à **API OpenAI** (coûts, disponibilité)
- Prompts dispersés dans routes et libs — pas de registry unique
- Qualité analyses dépendante des données utilisateur (garde-fous partiels)

---

## 11. Interface utilisateur et expérience SaaS

### 11.1 Design system

- Tailwind 4 + variables CSS
- Composants Radix + `src/components/ui/` (boutons, selects, dialogs)
- Composants EDGE dédiés : `edge-select.tsx`, `edge-email-shell.ts`
- Copy de marque centralisée : `edge-brand-copy.ts`, `edge-skill-progression-copy.ts`

### 11.2 UX Profil EDGE (état juillet 2026)

- Parcours sectionné : identité, projet, tests, expériences, diplômes, hard skills
- Positionnement « OS compétences » (Parcours EDGE, pas « micro-formations »)
- Profil public premium (`edge-public-profile-view.tsx`)
- EDGE Online : hero type Netflix/Apple, filtres catalogue

### 11.3 Responsive / PWA

- `next-pwa` activé en production
- Layouts dashboard adaptatifs (composants `md:`, `lg:` observés)

### 11.4 Accessibilité

- Radix UI (bonne base ARIA)
- Audit accessibilité formel : **non identifiable dans le code analysé**

---

## 12. Qualité du code

| Critère | Évaluation | Justification |
|---------|------------|---------------|
| Lisibilité | Bonne | Nommage français/anglais cohérent par domaine |
| Structuration | Moyenne-bonne | Libs par domaine ; APIs parfois monolithiques |
| Duplication | Moyenne | Patterns répétés entre dashboards |
| Typage | Moyenne | TS présent mais build errors ignorés |
| Gestion erreurs | Variable | Try/catch dans APIs ; pas uniforme |
| Documentation | Partielle | `docs/ia/`, guides déploiement ; peu de JSDoc |
| Scalabilité | Moyenne | Monolithe Next.js — scale vertical Vercel + Supabase |
| Dette technique | **Présente** | Voir §15 |

---

## 13. Tests, validation et fiabilité

### 13.1 Inventaire

**37 fichiers de test** identifiés (`*.test.ts`, `*.test.mjs`) :

| Domaine | Fichiers |
|---------|----------|
| Open Badges | 14 |
| API routes badges/admin | 14 |
| Career profiles EDGE | 3 |
| Hard skills / profil EDGE | 2 |
| Soft skills, radar, auth, entreprise | 4 |

Commande : `pnpm test` → Vitest (`vitest.config.ts`)

### 13.2 Couverture

- Ratio **~37 tests / 474 APIs** ≈ **8 %** des endpoints couverts
- Zones critiques **sans tests API** : `learner/skill-validation`, `stripe/webhook`, majorité `beyond-connect`

### 13.3 Recommandations tests (priorité valorisation)

1. Tests E2E parcours particulier (inscription → profil → validation compétence)
2. Tests webhook Stripe (idempotence)
3. Tests matching métier + maturité profil (déjà amorcés)
4. Pipeline CI bloquant sur `pnpm test`

---

## 14. Déploiement et exploitation

| Élément | Détail |
|---------|--------|
| Build | `pnpm build` → Next.js standalone |
| Hébergement | Vercel, région `cdg1` |
| Cron | Radar équipe — lundis 06:00 UTC |
| CI/CD | **Aucun** GitHub Actions ; déploiement Vercel (push Git) |
| Scripts ops | 91 fichiers `scripts/` (vérif prod, migrations manuelles) |
| Docs déploiement | `VERCEL_DEPLOYMENT.md`, `DEPLOYMENT_CHECKLIST.md` |

---

## 15. Risques techniques

| # | Risque | Gravité | Description |
|---|--------|---------|-------------|
| 1 | Absence CI/CD | Élevée | Pas de gate tests/lint automatique |
| 2 | `ignoreBuildErrors` | Élevée | Erreurs TS masquées en production |
| 3 | Monorepo multi-produits | Moyenne | Jessica/MOS/Beyond mélangés — risque régression croisée |
| 4 | Couplage `next.config` ↔ Jessica | Moyenne | Import `jessica-contentin/programmes-catalog` |
| 5 | Dépendance OpenAI / Stripe / Supabase | Élevée | Tierces critiques |
| 6 | Faible couverture tests | Élevée | Régressions probables sur 474 APIs |
| 7 | Migrations hétérogènes | Moyenne | 108 fichiers + scripts `supabase/fixes/` hors migrations |
| 8 | Secrets dans scripts | Moyenne | Scripts `prod-*.mjs` — à ne pas committer |
| 9 | RGPD profil public | Moyenne | Exposition données compétences — cadre juridique à documenter hors code |

---

## 16. Recommandations techniques

### Court terme (avant valorisation / audit complémentaire)

1. Documenter l'inventaire des variables d'environnement (sans secrets)
2. Activer CI minimale : `lint` + `test` sur chaque push
3. Réduire progressivement `ignoreBuildErrors` sur modules EDGE
4. Séparer clairement les routes Jessica du build EDGE (découplage `next.config`)

### Moyen terme (avant commercialisation scale)

1. Tests E2E parcours EDGE particulier
2. Monitoring erreurs (Sentry ou équivalent) — **non identifiable actuellement**
3. Documentation API interne (OpenAPI ou équivalent)
4. Politique de rétention et consentement profil public

### Long terme

1. Extraction optionnelle micro-services IA / badges si charge augmente
2. Séparation packages monorepo (`@beyond/lms-core`, `@edge/profil`)
3. Couverture tests > 60 % sur modules à fort CA (EDGE Online, Profil EDGE, Open Badges)

---

## 17. Conclusion pour l'expert-comptable

### Nature de l'actif

Le **SaaS Beyond / EDGE** constitue un **actif logiciel distinct et identifiable** :

- Code source TypeScript/React/Next.js (~2 588 fichiers `.ts`/`.tsx` dans `src/`)
- Backend intégré (~474 routes API)
- Schéma de données structuré (108 migrations PostgreSQL + schéma Prisma Open Badges)
- Déployé en production (Vercel, historique Git depuis **17 octobre 2025**)

### Éléments justifiant l'existence technique

1. Plateforme multi-tenant opérationnelle (organisations, rôles, dashboards)
2. Moteur de validation des compétences EDGE (hard skills, soft skills, DISC, matching métiers)
3. Système de certification Open Badges (implementation complète, tests dédiés)
4. Intégration IA métier (analyse, génération, entretiens)
5. Modules B2B (entreprise, école, experts) et B2C (particuliers EDGE)

### Niveau de maturité global

**Production fonctionnelle avec évolution active** — phase actuelle (juin-juillet 2026) concentrée sur **Profil EDGE particulier** et **positionnement « OS compétences »**.

### Limites de l'audit

- Pas d'accès aux environnements de production ni aux secrets
- Pas d'audit de performance ni de pénétration sécurité
- Contenu Jessica et MOS **exclu** — ne doit pas être valorisé dans le même actif sans analyse séparée
- Estimations temps (§18) : **hypothèses techniques**, non facturation réelle

---

## 18. Estimation du développement

> **Avertissement :** Les sections 18.x sont des **estimations techniques** fondées sur la structure du code et l'historique Git. Elles ne constituent pas une comptabilisation du temps réellement passé ni une facturation.

### 18.1 Estimation de la période de développement

#### Faits observables (Git)

| Indicateur | Valeur |
|------------|--------|
| Premier commit | **17 octobre 2025** — `feat: init LMS with Supabase auth and dark premium UI` |
| Dernier commit (audit) | **5 juillet 2026** |
| Nombre total de commits | **613** |
| Durée calendaire | **~8,5 mois** |

#### Commits par trimestre (factuel Git)

| Période | Commits | Interprétation |
|---------|---------|----------------|
| Q4 2025 (oct-déc) | **313** | Phase fondatrice : LMS, auth, rôles, builder, déploiement Vercel |
| Q1 2026 (jan-mar) | **166** | Extension : badges, entreprise, école, CRM |
| Q2 2026 (avr-jun) | **103** | EDGE rebrand, particuliers, marketplace, training courses CMS |
| Q3 2026 (jul, partiel) | **31** | Profil EDGE, maturité, UX compétences, OS compétences |

#### Phases majeures identifiées dans le code

1. **Socle LMS** (2025) — `005_COMPLETE_DB_MIGRATION.sql`, dashboard formateur/apprenant
2. **Open Badges** (2025-2026) — `prisma/`, 14+ tests, APIs earner/admin
3. **Entreprise & radar** (2026) — `radar-equipe/`, missions salariés
4. **EDGE particulier** (2026) — migrations `20260617*` à `20260706*`
5. **EDGE Online CMS** (2026) — `training_courses`, `edgeonline/`

---

### 18.2 Estimation du temps de développement

#### Hypothèses

- Développement principalement par **1 à 2 développeurs full-stack** seniors (inféré de la cohérence architecturale et du volume de commits)
- Productivité moyenne estimée : **2 à 4 heures effectives par commit** (commits mixtes petits correctifs + grosses features)
- 613 commits × 2,5 h ≈ **1 530 h** (borne centrale)
- Ajustement à la hausse pour : IA (70+ touchpoints), Open Badges, multi-tenant, 20 dashboards

| Scénario | Heures | Jours homme (7h) | Mois homme (20j) |
|----------|--------|------------------|------------------|
| **Basse** | 1 000 – 1 200 h | 143 – 171 j | 7 – 8,5 mois |
| **Réaliste** | 1 600 – 2 200 h | 229 – 314 j | 11 – 15 mois |
| **Haute** | 2 800 – 3 500 h | 400 – 500 j | 20 – 25 mois |

La **fourchette réaliste (1 600 – 2 200 h)** correspond à un produit SaaS de cette envergure développé en moins d'un an calendaire avec une équipe réduite et un rythme de livraison soutenu (313 commits en Q4 2025).

---

### 18.3 Répartition estimative du temps (scénario réaliste = 1 900 h)

| Poste | % | Heures estimées |
|-------|---|-----------------|
| Conception architecture & multi-tenant | 8 % | 152 h |
| Modélisation BDD / migrations | 10 % | 190 h |
| Authentification & rôles | 6 % | 114 h |
| Développement frontend (dashboards, UI) | 22 % | 418 h |
| Développement backend (API, services) | 18 % | 342 h |
| LMS / formations / parcours / builder | 12 % | 228 h |
| Open Badges & certification | 8 % | 152 h |
| Profil EDGE / compétences / matching | 7 % | 133 h |
| Intelligence artificielle (intégration) | 8 % | 152 h |
| Analytics / radar équipe | 3 % | 57 h |
| Beyond Connect / marketplace | 4 % | 76 h |
| Stripe / emails / intégrations | 3 % | 57 h |
| UI/UX / design system / responsive | 5 % | 95 h |
| Tests / corrections / refactoring | 6 % | 114 h |
| Scripts ops / déploiement / docs | 2 % | 38 h |
| **Total** | **100 %** | **~1 918 h** |

---

### 18.4 Niveau de complexité par module

| Module | Complexité | Justification |
|--------|------------|---------------|
| Socle LMS multi-tenant | **Très élevé** | 108 migrations, RLS, 20 rôles, progression |
| Open Badges | **Très élevé** | Spec IMS, Prisma, baking, assessments, 14 tests |
| Moteur IA | **Très élevé** | Multi-provider, 70+ endpoints, prompts métier |
| Profil EDGE / validation | **Élevé** | Entretiens, preuves, rapport, profil public, matching |
| EDGE Online / CMS | **Élevé** | Catalogue, SEO, hero, filtres |
| Beyond Connect | **Élevé** | 47 routes API, matching emploi |
| Dashboard entreprise / radar | **Élevé** | Agrégats, RGPD, cron |
| Soft skills / DISC / IDMC | **Moyen** | Scoring établi, UI tests |
| Beyond Note / Nevo | **Élevé** | Produit document + Stripe + IA |
| CRM super-admin | **Moyen à élevé** | Pipeline, studio — patterns CRUD + IA |
| Pages marketing EDGE | **Faible à moyen** | Contenu + routing — moins de logique |

---

### 18.5 Équivalent équipe (ESN / agence)

Pour reproduire l'état actuel du SaaS Beyond / EDGE (hors Jessica/MOS) :

| Profil | Nombre | Durée estimée |
|--------|--------|---------------|
| Architecte / lead technique | 1 | 6–8 mois (temps partiel 30–50 %) |
| Développeur full-stack senior | 2 | 8–10 mois |
| Développeur frontend (UI/UX implémentation) | 1 | 4–6 mois |
| Ingénieur QA / test | 0,5 | 3–4 mois (non réalisé historiquement) |
| Product owner / UX designer | 0,5 | continu |

**Équivalent ESN réaliste :** **2 à 3 ETP développement** sur **9 à 12 mois**, ou **forfait agence 180 000 – 320 000 €** (fourchette marché France 2025-2026 pour SaaS B2B de cette taille — **hypothèse économique**, non calculée depuis le code).

---

## Tableau récapitulatif — Actifs logiciels Beyond / EDGE valorisables

| ID | Actif logiciel | Description courte | Maturité | Complexité | Fichiers / zones clés | Valorisation recommandée |
|----|----------------|-------------------|----------|------------|----------------------|--------------------------|
| A1 | **Plateforme LMS Beyond** | Multi-tenant, cours, parcours, progression | Avancé | Très élevée | `src/app/dashboard/`, `supabase/migrations/`, `src/lib/queries/` | **Oui — socle principal** |
| A2 | **Moteur Open Badges** | Certification IMS Global complète | Très avancé | Très élevée | `src/lib/openbadges/`, `prisma/` | **Oui — actif différenciant** |
| A3 | **EDGE — Validation compétences** | Hard/soft skills, entretiens, preuves, rapports | Avancé | Élevée | `src/lib/hard-skills/`, `src/components/hard-skills/` | **Oui — cœur EDGE** |
| A4 | **EDGE — Profil & maturité** | Profil particulier, gauge, sections, emails | Avancé | Élevée | `src/lib/particulier/`, `profil-edge/` | **Oui** |
| A5 | **EDGE — Référentiel métiers** | `career_profiles`, matching, plan d'action | Fonctionnel | Élevée | `src/lib/career-profiles/` | **Oui** |
| A6 | **EDGE — Profil public** | Page `/p/[slug]`, fiabilité, analyse | Fonctionnel | Moyenne-élevée | `src/components/public-profile/` | **Oui** |
| A7 | **EDGE Online** | Catalogue, CMS training courses, streaming UX | Avancé | Élevée | `edgeonline/`, `training-courses/` | **Oui** |
| A8 | **Scoring comportemental** | DISC, IDMC, soft skills | Fonctionnel | Moyenne | `disc/`, `idmc/`, `soft-skills/` | **Oui** |
| A9 | **Radar équipe B2B** | Analytics RH, gaps, cron | Fonctionnel | Élevée | `radar-equipe/` | **Oui** |
| A10 | **Beyond Connect** | Matching emploi / talents | Avancé | Très élevée | `api/beyond-connect/` | **Oui — module séparable** |
| A11 | **Marketplace experts BCT** | Sessions, Stripe Connect | Fonctionnel | Élevée | `marketplace/` | **Oui** |
| A12 | **Moteur IA métier** | Génération + analyse transverse | Avancé | Très élevée | `src/lib/ai/`, `api/ai/` | **Oui — actif méthodologique** |
| A13 | **Super-admin & CRM** | Studio, pipeline commercial | Avancé | Élevée | `super/`, `crm/` | **Oui — ops internes** |
| A14 | **Beyond Note (Nevo)** | Module document IA | Fonctionnel | Élevée | `beyond-note-app/`, `api/nevo/` | **Oui — module annexe** |
| A15 | **Beyond Care / BNS** | Santé mentale / preuves non scolaires | Fonctionnel | Moyenne-élevée | `beyond-care/`, `bns/` | **Optionnel — vertical** |
| — | **Site Jessica** | — | — | — | `jessica-contentin/` | **NON — hors périmètre** |
| — | **Site MOS** | — | — | — | `mos/` | **NON — hors périmètre** |

---

# ANNEXES EXHAUSTIVES

## ANNEXE A — Inventaire complet des domaines API (474 routes)

Comptage des fichiers `route.ts` par domaine de premier niveau sous `src/app/api/`.

| Routes | Domaine API | Périmètre audit |
|--------|-------------|-----------------|
| 47 | `beyond-connect` | **Inclus** — matching emploi, offres, certifications |
| 38 | `super-admin` | **Inclus** — CRM, Jarvis, orgs, catalogue admin |
| 35 | `admin` | **Inclus** — badges, experts, compétences, users |
| 27 | `dashboard` | **Inclus** — APIs par rôle (école, entreprise, salarié…) |
| 20 | `ai` | **Inclus** — génération contenu, entretiens, analyses |
| 20 | `nevo` | **Inclus** — Beyond Note (produit annexe même socle) |
| 19 | `bns` | **Inclus** — Beyond No School |
| 16 | `super` | **Inclus** — CMS formations, career profiles |
| 13 | `earner` | **Inclus** — parcours Open Badges apprenant |
| 12 | `stripe` | **Inclus** — paiements |
| 12 | `marketplace` | **Inclus** — BCT praticiens |
| 11 | `mental-health` | **Inclus** — Beyond Care questionnaires |
| 10 | `formateur` | **Inclus** — bibliothèque, quiz IA |
| 8 | `auth` | **Inclus** |
| 8 | `drive` | **Inclus** — documents formateur |
| 7 | `courses` | **Inclus** — CRUD cours LMS |
| 7 | `debug` | **Inclus** — routes debug (à isoler en prod) |
| 6 | `beyond-care` | **Inclus** |
| 6 | `learner` | **Inclus** — validation compétences EDGE |
| 6 | `public` | **Inclus** — assertions badges publiques |
| 6 | `test` / `tests` | **Inclus** — évaluations |
| 5 | `radar-equipe` | **Inclus** |
| 5 | `path-triggers` | **Inclus** — études de cas, oral, PDF + IA |
| 5 | `soft-skills` | **Inclus** |
| 5 | `jessica-contentin` | **EXCLU** |
| 5 | `messages` | **Inclus** |
| 5 | `onboarding` | **Inclus** |
| 4 | `ai-assistant` | **Inclus** |
| 4 | `tuteur` | **Inclus** |
| 4 | `cart` | **Partiel** — vérifier usage Jessica |
| 4 | `upload` | **Inclus** |
| 3 | `cron` | **Inclus** — tâches planifiées |
| 3 | `resources` | **Inclus** |
| 3 | `gamification` | **Inclus** |
| 3 | `mcp` | **Inclus** — serveur MCP |
| 3 | `beyond-ia` | **Inclus** — génération riche |
| 3 | `blog` | **Inclus** — CMS blog |
| 3 | `parcours` | **Inclus** |
| 3 | `cms` | **Inclus** |
| 3 | `entreprises` | **Inclus** |
| 3 | `subscriptions` | **Inclus** |
| 2 | `particuliers` | **Inclus** — signup EDGE B2C |
| 2 | `audio` | **Inclus** — speech / transcribe |
| 2 | `catalogue` | **Inclus** |
| 1 | `career-profiles` | **Inclus** — recherche métiers |
| 1 | `edge-orientation-lead` | **Inclus** — leads orientation |
| 1 | `edge-entreprise-lead` | **Inclus** — leads B2B |
| 1 | `public-profile-analysis` | **Inclus** — analyse profil public |
| 1 | `profile-analysis` | **Inclus** |
| 1 | `generate-job-offer` | **Inclus** — IA offres emploi |
| … | 30+ domaines à 1–2 routes | Voir repo `src/app/api/` |

### Détail API EDGE — validation compétences (`api/learner/`)

| Endpoint | Fichier | Rôle |
|----------|---------|------|
| POST interview (questions + analyze) | `api/learner/skill-validation/interview/route.ts` | Entretien expérientiel + analyse EDGE |
| POST import | `api/learner/skill-validation/import/route.ts` | Import preuve + analyse |
| GET/POST target-career | `api/learner/target-career/route.ts` | Métier cible particulier |
| POST resolve career | `api/learner/career-profiles/resolve/route.ts` | Résolution référentiel métier |
| POST objective-details | `api/learner/objective-details/route.ts` | Détails objectif professionnel |
| POST cross-profile trigger | `api/learner/cross-profile/trigger/route.ts` | Complétion profils croisés |

### Détail API IA (`api/ai/` — 20 routes)

`experiential-interview`, `experiential-interview/feedback`, `experiential-interview/revision-diagnostic`, `generate-chapter`, `create-chapter`, `create-subchapter`, `generate-course-structure`, `generate-flashcards`, `generate-test-from-chapters`, `generate-test-feedback`, `generate-mirror-question`, `generate-badge-content`, `generate-blog-post`, `analyze-case-study`, `quiz-remediation`, `quiz-global-analysis`, `lesson-assistant`, `transform-text`, `check-config`, `test-config`.

---

## ANNEXE B — Chronologie complète des migrations (108 fichiers)

### Phase 0 — Fondations (numérotées 000–017)

| Fichier | Objet |
|---------|-------|
| `000_admin_basics*.sql` | Bases admin |
| `001_add_role_column.sql` | Colonne rôle profils |
| `002_lms_tutor_builder_activity.sql` | Activité tuteur / builder |
| `003_fix_inconsistencies.sql` | Corrections schéma |
| `004_adapt_to_existing_structure.sql` | Adaptation structure existante |
| `005_COMPLETE_DB_MIGRATION.sql` | **Socle LMS** : organizations, memberships, groups, learning_sessions, course_progress, path_progress, drive, test_attempts |
| `006_create_lesson_ai_transformations.sql` | Transformations IA leçons |
| `007_update_flashcards_rls_for_super_admins.sql` | RLS flashcards |
| `008_add_stripe_checkout_url_to_catalog.sql` | Stripe catalogue |
| `009_dashboard_activity_and_favorites.sql` | Activité dashboard |
| `010_parcours_scenarios.sql` | Scénarios parcours |
| `011_parcours_scenarios_rls_patch.sql` | RLS scénarios |
| `012_bns_subscriptions.sql` | Abonnements BNS |
| `013_bns_proofs.sql` | Preuves BNS (7 tables) |
| `014_bns_proofs_hardening.sql` | Durcissement BNS |
| `015_bns_proof_paths.sql` | Parcours preuves BNS |
| `016_bns_club_survey_responses.sql` | Enquêtes club |
| `017_bns_survey_rls.sql` | RLS enquêtes |

### Phase 1 — LMS & badges (fév.–avr. 2026)

`20260217124500_add_apprenant_school_onboarding.sql` → onboarding école  
`20260303121500_add_onboarding_completed.sql` → flag onboarding  
`20260305120000_add_demo_role.sql` → rôle démo  
`20260404120000_experts_cockpit_columns.sql` → experts marketplace  
`20260407160000_soft_skills_resultats_salarie.sql` → table soft skills salarié  
`20260412_repair_lms_schema.sql` → réparation schéma  
`20260413_add_snapshot_to_courses.sql` → builder_snapshot cours  
`20260413_create_quiz_results.sql` → résultats quiz  
`20260418_*` → certification badges cours  
`20260419120000_quiz_submissions_badge_criteria.sql` → critères badges quiz  
`20260419140000_open_badges_table.sql` → tables open badges Supabase  
`20260419173000_open_badges_internal_quiz.sql` → quiz internes badges  
`20260419180000_flashcards_local_chapter_ref.sql` → flashcards par chapitre  
`20260419190000_courses_level_column.sql` → niveau cours  
`20260421100000_courses_validated_by_peer_id.sql` → validation pairs  
`20260421200000_courses_presentation.sql` → présentation cours  
`20260425120000_courses_category_id_name.sql` → catégories cours  
`20260428123000_create_path_enrollments.sql` → inscriptions parcours  
`20260430162000_create_path_trigger_submissions.sql` → soumissions triggers parcours  

### Phase 2 — Entreprise, école, CRM (mai 2026)

`20260501120000_normalize_profiles_role_type_school_labels.sql`  
`20260503100000_align_ecole_crm_school_jobs.sql` — offres emploi école  
`20260503200000_ensure_organization_edge_lab.sql` — **tenant EDGE Lab**  
`20260503240000_ecole_job_offers_company_soft_skills_alternance.sql`  
`20260510120000_lesson_ai_user_transformations_chapter_local.sql`  
`20260513130000_soft_skills_resultats_ai_analysis.sql` — **analyse IA soft skills**  
`20260519120000_rename_edge_lab_to_edge.sql` — **rebrand EDGE**  
`20260520140000_edge_orientation_leads.sql` — leads orientation  
`20260526120000_crm_pipeline.sql` — **pipeline CRM**  
`20260527110000_open_badges_prisma_schema.sql` — **schéma Prisma badges en PG**  

### Phase 3 — Marketplace, radar, RH (juin 2026)

`20260601120000_radar_equipe_rgpd.sql` — **radar équipe + RGPD**  
`20260602120000_client_onboarding_workflow.sql` — onboarding client  
`20260603120000_bct_marketplace.sql` — **marketplace BCT**  
`20260605120000_employee_missions.sql` — missions salariés  
`20260606120000_employee_hr_fields.sql` — champs RH employés  
`20260617100000_profiles_particuliers_edge_columns.sql` — **colonnes profil particulier EDGE**  
`20260618200000_organizations_edge_signup_profile.sql` — signup EDGE org  
`20260618210000_salarie_practitioners_coaching.sql` — coachings salariés  
`20260619101000_profiles_cross_profile_completion.sql` — complétion profils croisés  

### Phase 4 — EDGE Online & Profil EDGE (juillet 2026)

| Fichier | Objet métier |
|---------|--------------|
| `20260703140000_training_courses.sql` | **Catalogue EDGE Online** — table `training_courses` |
| `20260703160000_training_covers_bucket.sql` | Bucket stockage covers |
| `20260703200000_training_courses_seo.sql` | SEO formations |
| `20260704000000_training_courses_cms.sql` | CMS formations |
| `20260705000000_particulier_profil_comportemental.sql` | **Profil comportemental** — expériences, diplômes enrichis |
| `20260705100000_career_profiles.sql` | **Référentiel métiers** — table `career_profiles` |
| `20260706000000_particulier_profil_edge_maturite.sql` | **Maturité Profil EDGE** |

---

## ANNEXE C — Pages dashboard et portails (inventaire routes UI)

### Dashboard apprenant (`src/app/dashboard/apprenant/` — 35 pages)

| Route | Fichier | Fonction |
|-------|---------|----------|
| `/dashboard/apprenant` | `page.tsx` | Accueil apprenant |
| `/profil-comportemental` | `profil-comportemental/page.tsx` | **Hub Profil EDGE** |
| `/profil-comportemental/identite` | `identite/page.tsx` | Identité |
| `/profil-comportemental/projet` | `projet/page.tsx` | Projet professionnel |
| `/profil-comportemental/experiences` | `experiences/page.tsx` | Expériences |
| `/profil-comportemental/diplomes` | `diplomes/page.tsx` | Diplômes |
| `/profil-comportemental/hard-skills` | `hard-skills/page.tsx` | **Hard skills + validation** |
| `/profil-comportemental/tests` | `tests/page.tsx` | Tests comportementaux |
| `/parcours` | `parcours/page.tsx` | Parcours EDGE personnalisé |
| `/objectif` | `objectif/page.tsx` | Objectif professionnel |
| `/coaching` | `coaching/page.tsx` | Coaching |
| `/career` | `career/page.tsx` | Carrière |
| `/matching` | `matching/page.tsx` | Matching |
| `/disc`, `/disc/test` | Tests DISC |
| `/soft-skills*`, `/soft-skills-intro` | Tests soft skills + paiement Stripe |
| `/idmc-intro`, `/idmc/test` | Test IDMC |
| `/open-badges/[badgeClassId]` | Open Badges + épreuves |
| `/badges` | Wallet badges |
| `/missions` | Missions |
| `/questionnaires/[id]` | Questionnaires |

### Dashboard entreprise (31 pages)

`salaries`, `salaries/[id]`, `radar-equipe`, `equipe-radar`, `equipe-insight`, `talents`, `talents/[id]`, `talent-radar`, `offres`, `offres/creer`, `offres/creer/beyond-ai`, `offres/[id]/candidats`, `marketplace`, `marketplace/[praticienId]/reserver`, `actions`, `actions/[id]/report`, `analytics`, `matchs`, `messages`, `experts/[id]`, `parametres`.

### EDGE Online (`src/app/edgeonline/` — 17 fichiers)

| Route | Rôle |
|-------|------|
| `/edgeonline` | Accueil catalogue |
| `/edgeonline/formations` | Liste formations |
| `/edgeonline/formations/[slug]` | Fiche formation |
| `/edgeonline/formations/[slug]/play/[lesson]` | Lecteur leçon |
| `/edgeonline/formations/[slug]/play/[lesson]/entretien` | **Entretien expérientiel player** |
| `/edgeonline/parcours`, `/parcours/[slug]` | Parcours EDGE |
| `/edgeonline/badges` | Badges |
| `/edgeonline/profil` | Profil |
| `/edgeonline/progression` | Progression |
| `/edgeonline/communaute` | Communauté |

### Profil public

| Route | Fichier |
|-------|---------|
| `/p/[slug]` | `src/app/p/[slug]/page.tsx` — profil public EDGE |

### Super-admin (88 pages hors Jessica — sur 90 total)

**Inclus :** `studio/` (formations, modules, parcours, tests, ressources), `crm/` (pipeline, onboarding, emails, validators), `open-badges/`, `organisations/`, `experts/`, `gestion-client/`, `premium/` (beyond-connect, beyond-care, beyond-play, beyond-note), `ia/`, `metiers/`, `agenda/`, `utilisateurs/`, `blog/`, `pages/`, `no-school/`, `gamification/`, `chiffre-affaires/`, `statistiques/`, `alertes/`, `parametres/`.

**Exclus :** `catalogue-jessica/`, `jessica-dashboard/`.

### Dashboards additionnels (rôles)

| Rôle | Chemin |
|------|--------|
| Formateur | `src/app/dashboard/formateur/` |
| École | `src/app/dashboard/ecole/` |
| Expert | `src/app/dashboard/expert/` |
| Salarié | `src/app/dashboard/salarie/` |
| Praticien | `src/app/dashboard/praticien/` |
| Tuteur | `src/app/dashboard/tuteur/` |
| Talent | `src/app/dashboard/talent/` |
| Club / Partenaire | `dashboard/club/`, `dashboard/partenaire/` |
| Admin org | `dashboard/admin/` |
| Catalogue acheté | `dashboard/catalogue/` |
| Student (EDGE Online interne) | `dashboard/student/` |

---

## ANNEXE D — Modules `src/lib/` (hors `jessica-contentin/`)

| Module | Fichiers / rôle |
|--------|-----------------|
| `ai/` | Clients OpenAI, Anthropic, Vision ; config providers ; prompts |
| `auth/` | Session, routing dashboard, rôles, signup EDGE, super-admin |
| `career-profiles/` | Référentiel métiers, matching, analyse, génération IA, repo |
| `hard-skills/` | Portfolio, validation, analyse, rapport évaluation, emails |
| `particulier/` | Maturité Profil EDGE, progression, coaching, objectifs |
| `learner/` | Plan d'action, cross-profile, profile-analysis, practitioners |
| `soft-skills/` | Questions, scoring, résolution résultats |
| `disc/` | Scoring DISC |
| `idmc/` | Axes IDMC |
| `openbadges/` | Moteur complet Open Badges v2 (baking, verify, playground) |
| `radar-equipe/` | Agrégats équipe, insights, compute |
| `beyond-connect/` | Matching emploi, catalogue bridge |
| `bns/` | Beyond No School — preuves, parcours, facturation |
| `marketplace/` | Sessions BCT, Stripe |
| `crm/` | Pipeline, briefing coach |
| `entreprise/` | Overview RH, assistant access |
| `expert/` | Provisioning, CRM expert |
| `training-courses/` | CMS EDGE Online |
| `edge-online/` | Filtres catalogue, meta hero |
| `edge-brand-copy.ts`, `edge-skill-progression-copy.ts` | Copy marque EDGE |
| `queries/` | Requêtes Supabase centralisées (apprenant, entreprise, etc.) |
| `stripe/` | Produits, checkout |
| `supabase/` | Clients serveur / service role |
| `emails/` | Templates Resend (particulier EDGE, etc.) |
| `onboarding/` | Workflow client |
| `mental-health/` | Questionnaires Beyond Care |
| `parcours.ts`, `paths/` | Définition parcours |
| `tenant/` | Config multi-tenant hostname |

**Exclu :** `src/lib/jessica-contentin/` (catalogue, programmes Jessica).

---

## ANNEXE E — Arborescence détaillée Profil EDGE (actif valorisable principal)

### Logique métier (`src/lib/`)

```
particulier/
├── profil-edge-maturity.ts      # Score maturité globale, blocs, hrefs sections
├── profil-edge-progress.ts      # Progression par section
├── coaching-config.ts           # Offres coaching particulier
├── objective-compatibility.ts   # Compatibilité objectifs
└── professional-project-fields.ts

career-profiles/
├── career-profiles-data.ts      # Données métiers seed
├── career-profiles-repo.ts      # Accès DB career_profiles
├── career-profile-matching.ts # 4 buckets + priorité + plan d'action
├── career-profile-analysis.ts   # Analyse fit DISC/soft
├── generate-career-profile-ai.ts
└── resolve-career-profile.ts

hard-skills/
├── hard-skills-portfolio.ts     # Portfolio, niveaux, preuves, chips statut
├── skill-validation.ts          # Types session validation, verdicts
├── skill-validation-analysis.ts # Persistance analyse API, cartes publiques
├── skill-evaluation-report.ts   # Rapport d'évaluation recruteur
└── send-skill-validation-emails.ts
```

### Interface (`src/components/`)

```
apprenant/profil-edge/
├── profil-edge-maturity-gauge.tsx
├── profil-edge-matching-section.tsx
├── profil-edge-objective-card.tsx
├── profil-edge-profile-blocks.tsx
├── profil-edge-section-shell.tsx
└── sections/
    ├── profil-edge-identity-section.tsx
    ├── profil-edge-project-section.tsx
    ├── profil-edge-experiences-section.tsx
    ├── profil-edge-diplomas-section.tsx
    ├── profil-edge-hard-skills-section.tsx
    └── profil-edge-tests-section.tsx

hard-skills/
├── hard-skill-interview-modal.tsx
├── hard-skill-proof-modal.tsx
├── hard-skill-proof-choice-modal.tsx
├── skill-evaluation-report-panel.tsx
├── hard-skills-portfolio-table.tsx
└── hard-skill-catalog-modal.tsx

public-profile/
├── edge-public-profile-view.tsx
├── public-skill-card.tsx
├── public-skill-analysis-modal.tsx
└── edge-reliability-badge.tsx
```

### Schéma données Profil EDGE (colonnes `profiles` — migrations)

- `professional_project`, `objective_details`, `type_profil`
- `target_career_slug` — lien `career_profiles`
- `hard_skills` (text[]), `skills_metadata` (jsonb) — validation, historique, analyse
- `experiences_pro`, `diplomes` (jsonb enrichi)
- Scores DISC, soft skills, IDMC (migrations comportementales)
- `cross_profile_completion` — suivi complétion

### Table `career_profiles` (migration `20260705100000`)

Champs : `slug`, `title`, `sector`, `description`, `key_skills`, `soft_skills`, `behavioral_expectations`, `recommended_badges`, `main_missions`, `recommended_formations`, etc.

---

## ANNEXE F — Variables d'environnement identifiées dans le code

| Variable | Usage observé |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Opérations admin serveur |
| `DATABASE_URL` | Prisma Open Badges |
| `OPENAI_API_KEY` | Génération / analyse IA |
| `BEYOND_IA_OPENAI_MODEL` | Modèle Beyond IA |
| `STRIPE_SECRET_KEY` | Paiements |
| `NEVO_STRIPE_SECRET_KEY`, `NEVO_STRIPE_WEBHOOK_SECRET` | Beyond Note Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` | URLs redirection |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Emails |
| `ADMIN_BCC_EMAIL` | Copie admin emails |
| `CRON_SECRET` | Sécurisation crons Vercel |
| `SOFT_SKILLS_ALLOW_UNPAID_ACCESS` | Bypass paiement dev |
| `AI_COST_OPENAI_*` | Coûts IA logging |
| `NODE_ENV` | Environnement |

*Liste non exhaustive — fichier `.env.example` : non identifiable dans le repository.*

---

## ANNEXE G — Tests automatisés (37 fichiers)

| Fichier | Domaine |
|---------|---------|
| `src/lib/career-profiles/__tests__/career-profile-matching.test.ts` | Matching métier EDGE |
| `src/lib/career-profiles/__tests__/career-profile-analysis.test.ts` | Analyse carrière |
| `src/lib/career-profiles/__tests__/resolve-career-profile.test.ts` | Résolution métier |
| `src/lib/hard-skills/__tests__/hard-skills-portfolio.test.ts` | Portfolio hard skills |
| `src/lib/particulier/__tests__/profil-edge-maturity.test.ts` | Maturité profil |
| `src/lib/soft-skills/__tests__/resolve-soft-skills-result.test.ts` | Soft skills |
| `src/lib/radar-equipe/__tests__/compute-aggregats.test.ts` | Radar équipe |
| `src/lib/openbadges/__tests__/*` (8 fichiers) | Open Badges |
| `src/lib/openbadges/v2/__tests__/*` (2 fichiers) | Badges v2 |
| `src/lib/openbadges/baking/__tests__/*` (2 fichiers) | Baking SVG/PNG |
| `src/app/api/admin/open-badges/**/*.test.ts` (6 fichiers) | API admin badges |
| `src/app/api/earner/badges/**/*.test.ts` (3 fichiers) | API earner |
| `src/app/api/public/assertions/**/*.test.ts` (2 fichiers) | API publique |
| `src/lib/auth/super-admin.test.ts` | Super admin |
| `src/lib/entreprise/assistant-access.test.ts` | Assistant entreprise |
| `middleware-edgebs.test.mjs` | Middleware EDGE domain |

---

## ANNEXE H — Historique Git (faits observables)

| Indicateur | Valeur |
|------------|--------|
| Premier commit | **2025-10-17 20:22** — init LMS Supabase auth |
| Dernier commit (audit) | **2026-07-05 18:59** |
| Total commits | **613** |
| Q4 2025 | **313 commits** — fondation LMS |
| Q1 2026 | **166 commits** |
| Q2 2026 | **103 commits** |
| Q3 2026 (partiel) | **31 commits** — Profil EDGE |

Commits EDGE récents (échantillon messages) :
- `feat(edge): OS compétences — rapport d'évaluation et Parcours EDGE`
- `feat(edge): refonte UX sans IA visible et expérience premium`
- `feat(edge): plateforme validation compétences particulier`
- `feat(edge): profil public crédible et EDGE Online premium`
- `feat(edge): Profil EDGE cohérent et workflow particulier complet`

---

## ANNEXE I — Modèle Open Badges (Prisma — `prisma/schema.prisma`)

Entités : `Organization`, `User`, `IssuerProfile`, `CompetencyFramework`, `Competency`, `BadgeClass`, `BadgeCriteria`, `BadgeReceivability`, `Assessment`, `Evidence`, `Assertion`, `RevocationEntry`, `StatusList`, `AuditLog`.

Rôles Prisma : `SUPER_ADMIN | ADMIN | EVALUATOR | EARNER`.

Statuts assessment : `DRAFT | SUBMITTED | NEEDS_INFO | APPROVED | REJECTED`.

Modes révision : `AI | HUMAN | MIXED`.

---

## ANNEXE J — Produits Beyond intégrés au socle (valorisation modulaire)

| Produit | Routes app | Routes API | Maturité |
|---------|------------|------------|----------|
| **EDGE** (LMS + validation) | `edgeonline/`, `dashboard/apprenant/`, `particuliers/` | `learner/`, `super/`, `training-courses` | Avancé |
| **Beyond Connect** | `beyond-connect-app/` | `beyond-connect/` (47) | Avancé |
| **Beyond Note** | `beyond-note-app/`, `note-app/` | `nevo/` (20) | Fonctionnel |
| **Beyond Care** | `beyond-care/` | `mental-health/`, `beyond-care/` | Fonctionnel |
| **Beyond No School** | `beyond-no-school/` | `bns/` (19) | Fonctionnel |
| **Beyond Play** | `beyond-play/`, `super/beyond-play/` | `gamification/`, `parcours/scenarios` | Partiel |

---

*Document généré par analyse statique du repository. Version exhaustive incluant annexes A–J. Pour valorisation comptable : compléter avec temps réels, factures prestataires et contrats PI.*

*Fichier : `docs/AUDIT_TECHNIQUE_SAAS_BEYOND_EDGE.md` — ~1 100 lignes, 17 sections + 10 annexes.*
