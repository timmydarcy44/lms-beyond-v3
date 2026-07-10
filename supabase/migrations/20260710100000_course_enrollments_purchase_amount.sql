-- Montant cabinet / vente hors ligne pour inscriptions studio (course_enrollments)
alter table public.course_enrollments
  add column if not exists purchase_amount numeric(10, 2);

comment on column public.course_enrollments.purchase_amount is
  'Montant facturé en cabinet (€) pour le CRM Jessica — hors paiement Stripe.';
