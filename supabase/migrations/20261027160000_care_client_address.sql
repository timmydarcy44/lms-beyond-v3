-- Adresse postale des membres CRM (factures nominatives).
-- À coller dans le SQL Editor si la table expert_care_clients existe déjà.

alter table public.expert_care_clients add column if not exists address_line text;
alter table public.expert_care_clients add column if not exists postal_code text;
alter table public.expert_care_clients add column if not exists city text;
