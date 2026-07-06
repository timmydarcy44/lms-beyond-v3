# EDGE Accompagnement — Mise en production

## État actuel du tunnel

| Étape | Route | Statut |
|-------|-------|--------|
| Formules | `/dashboard/apprenant/coaching` | ✅ |
| Réservation (3 étapes) | `/dashboard/accompagnement/reserver?offer=…` | ✅ |
| Paiement Stripe | API `POST /api/edge/accompagnement/checkout` | ⏳ clés Stripe requises |
| Confirmation | `/dashboard/accompagnement/confirmation?session_id=…` | ✅ (polling + backup fulfill) |
| Gestion RDV | `/dashboard/accompagnement/gerer/[token]` | ✅ |
| Programme sur devis | `/dashboard/accompagnement/demande-programme` | ✅ |
| Admin réservations | `GET /api/edge/accompagnement/admin/reservations` | ✅ (super-admin) |

## TODO — Dès récupération du compte Stripe

Fichier central : `src/lib/stripe/edge-accompagnement-config.ts`

### 1. Variables Vercel (Production + Preview)

```
STRIPE_SECRET_KEY=sk_live_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
```

Optionnel :
```
STRIPE_EDGE_ACCOMPAGNEMENT_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_ID_COACHING_PROGRESS=price_…
STRIPE_PRICE_ID_SIMULATION_PRO=price_…
```

Sans Price ID → montants automatiques via `price_data` (149 € / 179 €).

### 2. Webhook Stripe Dashboard

- **URL** : `https://edgebs.fr/api/stripe/edge-accompagnement/webhook`
- **Événements** : `checkout.session.completed`, `checkout.session.expired`

### 3. Migrations Supabase

Appliquer dans l'ordre :

1. `20260706120000_edge_accompagnement_reservations.sql`
2. `20260706140000_edge_accompagnement_hardening.sql`

### 4. Test de bout en bout

1. Carte test `4242 4242 4242 4242`
2. Coaching 149 € → créneau → paiement → confirmation
3. Vérifier email + ICS + entrée Mon accompagnement
4. Vérifier admin `timmydarcy44@gmail.com`

## Sécurité & robustesse

- ✅ Réservation créée **uniquement** après `payment_status = paid` (webhook + backup session-status)
- ✅ Verrou créneau 30 min (`edge_accompagnement_slot_holds`) pendant checkout
- ✅ Index unique sur créneau confirmé (anti double-réservation)
- ✅ Réutilisation session Stripe ouverte (anti double-paiement)
- ✅ Stripe côté serveur uniquement (`edge-accompagnement-config.ts`)
- ✅ Statuts paiement : pending, paid, cancelled, refunded, failed

## Emails (Resend)

Requiert `RESEND_API_KEY` + `RESEND_FROM_EMAIL` :

- Confirmation premium + ICS joint
- Récapitulatif avec lien gestion RDV
- Notification admin

## Ce qui ne peut pas être testé sans Stripe

- Redirection Checkout réelle
- Webhook `checkout.session.completed`
- Paiement live / remboursement

Une fois les clés renseignées : **aucune modification code attendue**.
