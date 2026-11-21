# Byound Care — Accueil apprenant v2

## Source praticiens / sujets
- **Praticiens** : `care_profiles` via `loadCareDirectoryRows()` (même filtre public que byoundcare.fr : `published` + `is_care`, hors `is_test` / e-mails de test).
- **Sujets** : config LMS `src/lib/apprenant/care-subjects.ts` (les 6 tuiles du brief), filtrés localement par domaines Care + mots-clés. Le `?sujet=` reste dans l’URL uniquement — jamais en base.
- **Liens profil** : `https://byoundcare.fr/praticiens/{slug}?utm_source=byound-lms` (aucun id apprenant).

## Praticiens fictifs retirés
Cartes OFFERS / démo Jade (absents de `care_profiles`) :
- Camille Roux
- Noah Petit
- Inès Morel
- Léa Bernard

Comptes test exclus de l’annuaire : Anaïs (`is_test`), Tim Darcy #2 (`is_test`).

Profils réels pouvant apparaître selon le sujet : Jessica Contentin, Timmy Darcy, Tim Darcy.

## Confidentialité — preuve
- API `GET /api/dashboard/apprenant/care/experts` : lecture seule (`care_profiles` + `care_services` + `profiles.birth_date` pour `isMinor`). Aucun `insert` / `update` / log sujet↔user.
- Tables de tracking absentes : `care_lms_clicks`, `care_subject_views`, `learner_care_events`, `care_page_views`.
- Clic praticien = navigation externe `target=_blank` sans callback analytics.
- Sujet filtré côté client ; l’API ne lit pas `?sujet=`.
- Visible école / entreprise / Control : rien de nouveau — pas d’événement Care stocké.

## Captures
- `care-desktop-majeur-sans-photo.png`
- `care-desktop-mineur-avec-photo.png`
- `care-mobile-majeur-sans-photo.png`
- `care-mobile-mineur-avec-photo.png`
- Preview interactive : `/tmp-preview/byound-care-accueil-v2.html`

Photos définitives : placer `public/care/hero-1.jpg` et `hero-2.jpg` (sinon dégradé framboise).
