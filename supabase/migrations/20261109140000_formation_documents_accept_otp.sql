-- OTP e-mail pour accepter devis / convention (preuve d'accès à la boîte du contact)

alter table public.formation_documents
  add column if not exists accept_otp_hash text,
  add column if not exists accept_otp_expires_at timestamptz,
  add column if not exists accept_otp_attempts integer not null default 0,
  add column if not exists accept_otp_sent_to text;

comment on column public.formation_documents.accept_otp_hash is
  'SHA-256 du code OTP e-mail (acceptation publique)';
comment on column public.formation_documents.accept_otp_expires_at is
  'Expiration du code OTP (typ. 10 min)';
comment on column public.formation_documents.accept_otp_attempts is
  'Tentatives de saisie OTP échouées';
comment on column public.formation_documents.accept_otp_sent_to is
  'E-mail (contact dossier) auquel le code a été envoyé';
