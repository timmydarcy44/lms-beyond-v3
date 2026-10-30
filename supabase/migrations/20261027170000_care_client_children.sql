-- Suivi enfant(s) sur les membres CRM Care.
-- À coller dans le SQL Editor si la table expert_care_clients existe déjà.

alter table public.expert_care_clients add column if not exists follow_up text not null default 'self';
alter table public.expert_care_clients add column if not exists child_one_first_name text;
alter table public.expert_care_clients add column if not exists child_one_last_name text;
alter table public.expert_care_clients add column if not exists child_two_first_name text;
alter table public.expert_care_clients add column if not exists child_two_last_name text;
