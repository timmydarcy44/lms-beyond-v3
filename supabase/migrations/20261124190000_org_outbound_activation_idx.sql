-- Accélère les anti-doublons des mails d'activation entreprise
create index if not exists org_outbound_emails_org_kind_sent_idx
  on public.org_outbound_emails (org_id, kind, sent_at desc);

create index if not exists org_outbound_emails_org_kind_to_idx
  on public.org_outbound_emails (org_id, kind, to_email);
