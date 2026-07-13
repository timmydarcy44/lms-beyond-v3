-- Colonne « Mail envoyé + catalogue » + suivi d'envoi email

alter table public.crm_pipeline_deals
  add column if not exists catalog_email_sent_at timestamptz;

update public.crm_pipeline_stages
set sort_order = sort_order + 1
where pipeline_type = 'btob'
  and sort_order >= 2
  and slug <> 'mail_envoye_catalogue';

insert into public.crm_pipeline_stages (pipeline_type, slug, label, sort_order)
values ('btob', 'mail_envoye_catalogue', 'Mail envoyé + catalogue', 2)
on conflict (pipeline_type, slug) do update
  set label = excluded.label,
      sort_order = excluded.sort_order;
