-- Référentiel compétences Byound (langage simple) + déclarations apprenant
create extension if not exists pgcrypto;

create table if not exists public.skill_domains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.skill_domains(id) on delete cascade,
  slug text not null,
  label text not null,
  description text not null default '',
  aliases text[] not null default '{}',
  is_soft boolean not null default false,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (domain_id, slug)
);

create index if not exists skills_label_idx on public.skills (lower(label));
create index if not exists skills_aliases_gin on public.skills using gin (aliases);
create index if not exists skills_active_idx on public.skills (is_active) where is_active;

create table if not exists public.skill_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  raw_label text not null,
  match_confidence numeric(4,3),
  match_status text not null default 'matched'
    check (match_status in ('matched','kept_raw','pending_review')),
  kind text not null check (kind in ('hard','soft')),
  level text not null default 'intermediaire'
    check (level in ('debutant','intermediaire','confirme','expert')),
  context text check (context is null or context in ('stage','job','alternance','asso_club','perso')),
  proof_id uuid,
  proof_url text,
  proof_note text,
  status text not null default 'draft'
    check (status in ('draft','declared','proven')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skill_declarations_user_idx on public.skill_declarations (user_id, updated_at desc);
create index if not exists skill_declarations_pending_idx on public.skill_declarations (match_status)
  where match_status = 'pending_review';
create index if not exists skill_declarations_raw_idx on public.skill_declarations (lower(raw_label));

alter table public.skill_domains enable row level security;
alter table public.skills enable row level security;
alter table public.skill_declarations enable row level security;

drop policy if exists skill_domains_read on public.skill_domains;
create policy skill_domains_read on public.skill_domains for select to authenticated using (true);

drop policy if exists skills_read on public.skills;
create policy skills_read on public.skills for select to authenticated using (is_active = true);

drop policy if exists skill_declarations_self_select on public.skill_declarations;
create policy skill_declarations_self_select on public.skill_declarations
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists skill_declarations_self_insert on public.skill_declarations;
create policy skill_declarations_self_insert on public.skill_declarations
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists skill_declarations_self_update on public.skill_declarations;
create policy skill_declarations_self_update on public.skill_declarations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists skill_declarations_self_delete on public.skill_declarations;
create policy skill_declarations_self_delete on public.skill_declarations
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists skill_declarations_admin_select on public.skill_declarations;
create policy skill_declarations_admin_select on public.skill_declarations
  for select to authenticated using (
    public.user_has_role(auth.uid(), array['admin','super_admin','instructor'])
  );

drop policy if exists skill_declarations_admin_update on public.skill_declarations;
create policy skill_declarations_admin_update on public.skill_declarations
  for update to authenticated using (
    public.user_has_role(auth.uid(), array['admin','super_admin'])
  );

grant select on public.skill_domains to authenticated, anon, service_role;
grant select on public.skills to authenticated, anon, service_role;
grant select, insert, update, delete on public.skill_declarations to authenticated, service_role;
grant all on public.skill_domains to service_role;
grant all on public.skills to service_role;

-- Seed domaines
insert into public.skill_domains (slug, label, position)
values ('vente-et-relation-client', 'Vente et relation client', 1)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('commerce-en-boutique', 'Commerce en boutique', 2)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('marketing-et-communication', 'Marketing et communication', 3)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('management-et-encadrement', 'Management et encadrement', 4)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('gestion-et-organisation', 'Gestion et organisation', 5)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('sport-business', 'Sport business', 6)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('immobilier', 'Immobilier', 7)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('sante-et-medico-social', 'Santé et médico-social', 8)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('numerique-et-ia', 'Numérique et IA', 9)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('developpement-web-profils-techniques', 'Développement web (profils techniques)', 10)
on conflict (slug) do update set label = excluded.label, position = excluded.position;
insert into public.skill_domains (slug, label, position)
values ('soft-skills', 'Soft skills', 11)
on conflict (slug) do update set label = excluded.label, position = excluded.position;

-- Seed compétences
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'prospection-a-froid', 'Prospection à froid', 'Contacter des personnes qui ne te connaissent pas encore', ARRAY['phoning','appeler des prospects','démarchage','cold call','cold email','trouver des nouveaux clients','LinkedIn prospection','Prospection téléphonique','Cold emailing (délivrabilité)','Social selling (LinkedIn)','Multi-channel sequencing','Account-based marketing (ABM)','Scripts de vente directe','Cold Calling']::text[], false, true, 1
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'prospection-a-chaud', 'Prospection à chaud', 'Relancer des personnes déjà intéressées', ARRAY['relance','leads chauds','suivi des contacts','nurturing','Gestion de volume de leads','Lead scoring','Lead nurturing']::text[], false, true, 2
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'prise-de-rendez-vous', 'Prise de rendez-vous', 'Décrocher un rendez-vous par téléphone ou par message', ARRAY['prise de RDV','qualification','setting']::text[], false, true, 3
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'decouverte-des-besoins', 'Découverte des besoins', 'Poser les bonnes questions pour comprendre le client', ARRAY['questionnement','écoute client','SPIN','questions ouvertes','questions calibrées','Empathie tactique','Étiquetage émotionnel (labeling)','Miroir (mirroring)','SPIN selling']::text[], false, true, 4
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'argumentation', 'Argumentation', 'Présenter une offre de façon convaincante', ARRAY['pitch','présentation commerciale','vente de valeur','Vente de valeur (value-based)','Preuve sociale','Réciprocité','Créer une urgence légitime','Gestion de l''Urgence (FOMO)','Biais de décision','Biais Cognitifs']::text[], false, true, 5
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'traitement-des-objections', 'Traitement des objections', 'Répondre aux « c''est trop cher », « je vais réfléchir »…', ARRAY['objections','gérer les refus','Traitement des objections complexes (pant)']::text[], false, true, 6
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'negociation', 'Négociation', 'Trouver un accord gagnant-gagnant sur le prix et les conditions', ARRAY['négocier','négociation commerciale','ancrage de prix','négociation de contrat','Gestion du silence','Négociation de contrat (legal/procurement)']::text[], false, true, 7
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'closing', 'Closing', 'Conclure une vente et faire signer', ARRAY['conclure','signer','finaliser une vente','closer','Closing assomptif','Closing téléphonique']::text[], false, true, 8
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'fidelisation-client', 'Fidélisation client', 'Garder ses clients et les faire revenir', ARRAY['suivi client','satisfaction client','rétention','relation client']::text[], false, true, 9
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'vente-aux-entreprises-b2b', 'Vente aux entreprises (B2B)', 'Vendre à des professionnels, souvent sur un cycle long', ARRAY['B2B','grands comptes','vente complexe','cycle de vente long','Vente en B2B','Gestion du cycle de vente long']::text[], false, true, 10
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-d-un-portefeuille-clients', 'Gestion d''un portefeuille clients', 'Suivre et développer un ensemble de clients', ARRAY['account management','comptes clients']::text[], false, true, 11
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'utilisation-d-un-crm', 'Utilisation d''un CRM', 'Tenir à jour ses contacts et ses ventes dans un outil', ARRAY['CRM','HubSpot','Salesforce','Pipedrive','pipeline','Hygiène CRM (Salesforce/HubSpot)','Automatisation de pipeline']::text[], false, true, 12
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'suivi-des-resultats-commerciaux', 'Suivi des résultats commerciaux', 'Suivre ses chiffres et ses objectifs', ARRAY['KPI','reporting','tableau de bord commercial','Reporting & KPIs']::text[], false, true, 13
from public.skill_domains d where d.slug = 'vente-et-relation-client'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'accueil-client-en-magasin', 'Accueil client en magasin', 'Accueillir et conseiller en boutique', ARRAY['vente en magasin','conseil client','retail']::text[], false, true, 1
from public.skill_domains d where d.slug = 'commerce-en-boutique'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'merchandising', 'Merchandising', 'Mettre les produits en valeur dans le magasin', ARRAY['visuel merchandising','mise en rayon','vitrine','implantation']::text[], false, true, 2
from public.skill_domains d where d.slug = 'commerce-en-boutique'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'vente-additionnelle', 'Vente additionnelle', 'Proposer un produit en plus ou mieux adapté', ARRAY['upsell','cross-sell','panier moyen']::text[], false, true, 3
from public.skill_domains d where d.slug = 'commerce-en-boutique'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-des-stocks', 'Gestion des stocks', 'Commander, ranger et suivre les produits', ARRAY['inventaire','réassort','réception marchandise']::text[], false, true, 4
from public.skill_domains d where d.slug = 'commerce-en-boutique'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'encaissement', 'Encaissement', 'Tenir la caisse et les paiements', ARRAY['caisse','encaisser']::text[], false, true, 5
from public.skill_domains d where d.slug = 'commerce-en-boutique'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'animation-commerciale', 'Animation commerciale', 'Organiser une opération pour attirer les clients', ARRAY['promotion','animation magasin','événement boutique']::text[], false, true, 6
from public.skill_domains d where d.slug = 'commerce-en-boutique'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'vente-de-produits-haut-de-gamme', 'Vente de produits haut de gamme', 'Vendre dans le luxe et le premium', ARRAY['luxe','premium','clientèle exigeante']::text[], false, true, 7
from public.skill_domains d where d.slug = 'commerce-en-boutique'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'marketing-d-influence', 'Marketing d''influence', 'Travailler avec des créateurs de contenu', ARRAY['influenceurs','partenariats influence']::text[], false, true, 1
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'seo', 'SEO', 'Être bien placé sur Google sans payer', ARRAY['référencement naturel','SEO sémantique','SEO sémantique (bottom of funnel)']::text[], false, true, 2
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'sea', 'SEA', 'Faire de la publicité sur Google', ARRAY['Google Ads','référencement payant']::text[], false, true, 3
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'smo', 'SMO', 'Faire connaître une marque sur les réseaux sociaux', ARRAY['réseaux sociaux','présence sociale','Instagram','TikTok','LinkedIn']::text[], false, true, 4
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'sma', 'SMA', 'Faire de la publicité sur les réseaux sociaux', ARRAY['Meta Ads','publicité Facebook','publicité Instagram','LinkedIn Ads']::text[], false, true, 5
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'community-management', 'Community management', 'Animer une communauté en ligne', ARRAY['CM','community manager','modération']::text[], false, true, 6
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'creation-de-contenu', 'Création de contenu', 'Créer des posts, vidéos, visuels', ARRAY['contenu','content marketing','ghostwriting','vidéo','reels','Gestion de l''image (personal branding) des athlètes','Stratégie de content marketing','Lead magnets','Ghostwriting LinkedIn','Storytelling de marque']::text[], false, true, 7
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'redaction-web', 'Rédaction web', 'Écrire des textes pour le web', ARRAY['copywriting','rédaction','storytelling','micro-copy','Frameworks AIDA/PAS','Micro-copy de conversion (CTA)']::text[], false, true, 8
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'e-mailing', 'E-mailing', 'Envoyer des campagnes par e-mail', ARRAY['newsletter','emailing','lead nurturing']::text[], false, true, 9
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'analyse-des-statistiques', 'Analyse des statistiques', 'Lire les chiffres d''un site ou d''une campagne', ARRAY['Google Analytics','A/B test','taux de conversion','Neuromarketing','Analyse des parcours d''achat','Psychologie des prix','Étude des motivations profondes (jobs-to-be-done)','Détection des signaux faibles (tendances émergentes)','Social listening','Veille concurrentielle de niche','Framework AARRR','A/b testing','Analyse de churn']::text[], false, true, 10
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'organisation-d-evenements', 'Organisation d''événements', 'Préparer et animer un événement', ARRAY['événementiel','salon','séminaire']::text[], false, true, 11
from public.skill_domains d where d.slug = 'marketing-et-communication'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'animer-une-equipe', 'Animer une équipe', 'Motiver et faire avancer un groupe', ARRAY['manager','encadrer','leadership d''équipe']::text[], false, true, 1
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'deleguer', 'Déléguer', 'Confier une tâche et suivre sa réalisation', ARRAY['délégation']::text[], false, true, 2
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'fixer-des-objectifs', 'Fixer des objectifs', 'Donner un cap clair et mesurable', ARRAY['objectifs','OKR','Méthode OKR']::text[], false, true, 3
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'conduire-un-entretien-annuel', 'Conduire un entretien annuel', 'Préparer et mener l''échange annuel', ARRAY['entretien individuel','entretien professionnel']::text[], false, true, 4
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'recruter', 'Recruter', 'Trouver et choisir les bonnes personnes', ARRAY['recrutement','entretien d''embauche','Recrutement de talents']::text[], false, true, 5
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'integrer-un-nouvel-arrivant', 'Intégrer un nouvel arrivant', 'Accueillir et former un nouveau collègue', ARRAY['onboarding','intégration']::text[], false, true, 6
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gerer-les-plannings', 'Gérer les plannings', 'Organiser les présences et les remplacements', ARRAY['planning','emploi du temps','roulement']::text[], false, true, 7
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'accompagner-le-changement', 'Accompagner le changement', 'Aider une équipe à changer ses habitudes', ARRAY['conduite du changement','transformation','management de transition']::text[], false, true, 8
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'tutorat', 'Tutorat', 'Transmettre son savoir-faire à un apprenant', ARRAY['mentorat','maître d''apprentissage','tuteur']::text[], false, true, 9
from public.skill_domains d where d.slug = 'management-et-encadrement'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-de-projet', 'Gestion de projet', 'Planifier et piloter un projet jusqu''au bout', ARRAY['chef de projet','rétroplanning']::text[], false, true, 1
from public.skill_domains d where d.slug = 'gestion-et-organisation'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'methode-agile', 'Méthode agile', 'Avancer par petites étapes avec des points réguliers', ARRAY['agile','scrum','sprint','kanban','Méthode agile/scrum','Gestion de roadmap (Linear)','User stories']::text[], false, true, 2
from public.skill_domains d where d.slug = 'gestion-et-organisation'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-d-un-budget', 'Gestion d''un budget', 'Prévoir et suivre les dépenses', ARRAY['budget','pilotage budgétaire']::text[], false, true, 3
from public.skill_domains d where d.slug = 'gestion-et-organisation'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'tableaux-de-bord', 'Tableaux de bord', 'Suivre des indicateurs', ARRAY['reporting','KPI','indicateurs']::text[], false, true, 4
from public.skill_domains d where d.slug = 'gestion-et-organisation'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'tableur', 'Tableur', 'Utiliser Excel ou Google Sheets', ARRAY['Excel','Google Sheets','tableau croisé dynamique']::text[], false, true, 5
from public.skill_domains d where d.slug = 'gestion-et-organisation'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'organisation-administrative', 'Organisation administrative', 'Gérer les dossiers et les démarches', ARRAY['administratif','classement']::text[], false, true, 6
from public.skill_domains d where d.slug = 'gestion-et-organisation'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'recherche-de-sponsors', 'Recherche de sponsors', 'Trouver des entreprises partenaires pour un club', ARRAY['sponsoring','partenaires','commercialisation de sponsoring','Commercialisation de sponsoring (B2B)','Prospection de grands comptes sportifs','Networking B2B en environnement sportif']::text[], false, true, 1
from public.skill_domains d where d.slug = 'sport-business'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'dossier-de-partenariat', 'Dossier de partenariat', 'Rédiger une proposition de partenariat', ARRAY['plaquette partenaire','dossier sponsor','Rédaction de dossiers de partenariat']::text[], false, true, 2
from public.skill_domains d where d.slug = 'sport-business'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'activation-des-partenaires', 'Activation des partenaires', 'Faire vivre un partenariat (visibilité, événements)', ARRAY['activation','dispositif 360','Activation partenaire (dispositifs 360°)','Suivi opérationnel de contrat','Gestion de portefeuille partenaires','Gestion de Portefeuille Partenaires (Fidélisation & Rétention)','Gestion de la relation partenaire']::text[], false, true, 3
from public.skill_domains d where d.slug = 'sport-business'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'hospitalites-et-loges', 'Hospitalités et loges', 'Accueillir les partenaires les jours de match', ARRAY['loges VIP','réceptif','matchday','Gestion de loges VIP','Expérience client jour de match (matchday experience)','Upsell de prestations de services']::text[], false, true, 4
from public.skill_domains d where d.slug = 'sport-business'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'billetterie', 'Billetterie', 'Vendre et gérer les places', ARRAY['billets','abonnements']::text[], false, true, 5
from public.skill_domains d where d.slug = 'sport-business'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'mecenat', 'Mécénat', 'Monter un soutien d''entreprise avec avantage fiscal', ARRAY['mécénat','fondation','Ingénierie du mécénat (fiscalité & éthique)']::text[], false, true, 6
from public.skill_domains d where d.slug = 'sport-business'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'bilan-d-un-partenariat', 'Bilan d''un partenariat', 'Mesurer ce que le partenariat a rapporté', ARRAY['ROI partenaire','reporting d''impact','Analyse du ROI partenaire (visibilité/engagement/data)','Reporting d''impact (social & business)','Étude de notoriété de marque']::text[], false, true, 7
from public.skill_domains d where d.slug = 'sport-business'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'estimation-d-un-bien', 'Estimation d''un bien', 'Donner la valeur d''un logement ou d''un local', ARRAY['estimation','évaluation immobilière']::text[], false, true, 1
from public.skill_domains d where d.slug = 'immobilier'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'prise-de-mandat', 'Prise de mandat', 'Convaincre un propriétaire de confier son bien', ARRAY['mandat','rentrer des mandats','prospection immobilière']::text[], false, true, 2
from public.skill_domains d where d.slug = 'immobilier'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'visites-et-negociation-immobiliere', 'Visites et négociation immobilière', 'Faire visiter et négocier l''offre', ARRAY['visite','offre d''achat']::text[], false, true, 3
from public.skill_domains d where d.slug = 'immobilier'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-locative', 'Gestion locative', 'Gérer un bien en location', ARRAY['location','bail','état des lieux']::text[], false, true, 4
from public.skill_domains d where d.slug = 'immobilier'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'reglementation-immobiliere', 'Réglementation immobilière', 'Connaître les règles (loi Alur, diagnostics…)', ARRAY['loi Alur','réglementation','compromis de vente']::text[], false, true, 5
from public.skill_domains d where d.slug = 'immobilier'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'cadre-reglementaire-du-medico-social', 'Cadre réglementaire du médico-social', 'Connaître les règles d''un établissement', ARRAY['réglementation','ESMS','loi 2002-2','ARS']::text[], false, true, 1
from public.skill_domains d where d.slug = 'sante-et-medico-social'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'bientraitance', 'Bientraitance', 'Garantir un accompagnement respectueux', ARRAY['bientraitance','éthique du soin']::text[], false, true, 2
from public.skill_domains d where d.slug = 'sante-et-medico-social'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'accompagnement-des-familles', 'Accompagnement des familles', 'Informer et rassurer les proches', ARRAY['familles','aidants']::text[], false, true, 3
from public.skill_domains d where d.slug = 'sante-et-medico-social'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'qualite-et-securite', 'Qualité et sécurité', 'Suivre les procédures et les indicateurs qualité', ARRAY['démarche qualité','évaluation HAS','sécurité des soins']::text[], false, true, 4
from public.skill_domains d where d.slug = 'sante-et-medico-social'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'coordination-d-equipe-soignante', 'Coordination d''équipe soignante', 'Organiser le travail entre soignants', ARRAY['coordination des soins','transmissions']::text[], false, true, 5
from public.skill_domains d where d.slug = 'sante-et-medico-social'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'utiliser-l-ia-au-quotidien', 'Utiliser l''IA au quotidien', 'Se servir de ChatGPT, Claude… pour son travail', ARRAY['IA','ChatGPT','Claude','Copilot','IA générative']::text[], false, true, 1
from public.skill_domains d where d.slug = 'numerique-et-ia'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'rediger-des-prompts', 'Rédiger des prompts', 'Bien formuler ses demandes à une IA', ARRAY['prompt','prompt engineering','Prompt engineering avancé']::text[], false, true, 2
from public.skill_domains d where d.slug = 'numerique-et-ia'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'automatiser-des-taches', 'Automatiser des tâches', 'Relier des outils pour gagner du temps', ARRAY['automatisation','Make','Zapier','n8n','Automatisation (Make/Zapier)','Automatisation IA (n8n)']::text[], false, true, 3
from public.skill_domains d where d.slug = 'numerique-et-ia'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'outils-bureautiques', 'Outils bureautiques', 'Word, PowerPoint, Google Docs…', ARRAY['bureautique','Office','Google Workspace']::text[], false, true, 4
from public.skill_domains d where d.slug = 'numerique-et-ia'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'creation-graphique', 'Création graphique', 'Créer des visuels simples', ARRAY['Canva','Figma','design graphique']::text[], false, true, 5
from public.skill_domains d where d.slug = 'numerique-et-ia'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'creer-un-site-sans-coder', 'Créer un site sans coder', 'Monter un site avec un outil simple', ARRAY['no-code','Wix','Webflow','WordPress']::text[], false, true, 6
from public.skill_domains d where d.slug = 'numerique-et-ia'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'analyse-de-donnees', 'Analyse de données', 'Faire parler des chiffres', ARRAY['data','analyse','statistiques','Analyse de données prédictives']::text[], false, true, 7
from public.skill_domains d where d.slug = 'numerique-et-ia'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'developpement-web-front', 'Développement web (front)', 'Créer l''interface d''un site ou d''une appli', ARRAY['HTML','CSS','JavaScript','React','Next.js','Tailwind','TypeScript','React.js','Next.js (app router)','Tailwind CSS','Framer motion']::text[], false, true, 1
from public.skill_domains d where d.slug = 'developpement-web-profils-techniques'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'developpement-web-back', 'Développement web (back)', 'Créer le serveur et la logique d''une appli', ARRAY['Node.js','Python','API','serverless','Python (FastAPI)','Serverless functions','Edge computing']::text[], false, true, 2
from public.skill_domains d where d.slug = 'developpement-web-profils-techniques'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'bases-de-donnees', 'Bases de données', 'Stocker et interroger des données', ARRAY['SQL','PostgreSQL','Supabase','Redis','Redis (cache)','Pinecone/Chroma']::text[], false, true, 3
from public.skill_domains d where d.slug = 'developpement-web-profils-techniques'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'design-d-interface-ux-ui', 'Design d''interface (UX/UI)', 'Concevoir des écrans faciles à utiliser', ARRAY['UX','UI','Figma','prototypage','design system','accessibilité','Analyse de feedback (Hotjar)','UX research','UI design (Figma)','Design systems','Web accessibility (a11y)']::text[], false, true, 4
from public.skill_domains d where d.slug = 'developpement-web-profils-techniques'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'developper-avec-l-ia', 'Développer avec l''IA', 'Intégrer une IA dans une application', ARRAY['API OpenAI','API Anthropic','RAG','LangChain','fine-tuning','Intégration APIs OpenAI','Intégration APIs Anthropic','RAG (retrieval-augmented generation)','Vercel ai SDK','Fine-tuning de modèles']::text[], false, true, 5
from public.skill_domains d where d.slug = 'developpement-web-profils-techniques'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'mise-en-production', 'Mise en production', 'Déployer et faire tourner une application', ARRAY['Docker','Kubernetes','déploiement','CI/CD']::text[], false, true, 6
from public.skill_domains d where d.slug = 'developpement-web-profils-techniques'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'communication', 'Communication', 'Soft skill', ARRAY['Communication interpersonnelle','Communication asynchrone']::text[], true, true, 1
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'ecoute-active', 'Écoute active', 'Soft skill', '{}'::text[], true, true, 2
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'empathie', 'Empathie', 'Soft skill', '{}'::text[], true, true, 3
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-des-conflits', 'Gestion des conflits', 'Soft skill', '{}'::text[], true, true, 4
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'leadership', 'Leadership', 'Soft skill', '{}'::text[], true, true, 5
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'travail-en-equipe', 'Travail en équipe', 'Soft skill', ARRAY['Collaboration et travail en équipe','Culture d''entreprise']::text[], true, true, 6
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'adaptabilite', 'Adaptabilité', 'Soft skill', '{}'::text[], true, true, 7
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-du-stress', 'Gestion du stress', 'Soft skill', '{}'::text[], true, true, 8
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'intelligence-emotionnelle', 'Intelligence émotionnelle', 'Soft skill', ARRAY['Analyse comportementale (DISC, IDMC)','Analyse des types de personnalités (DISC)','Profilage DISC & IDMC Appliqué','Analyse Comportementale (Profilage)']::text[], true, true, 9
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'confiance-en-soi', 'Confiance en soi', 'Soft skill', '{}'::text[], true, true, 10
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'resolution-de-problemes', 'Résolution de problèmes', 'Soft skill', ARRAY['Résolution des problèmes']::text[], true, true, 11
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'prise-de-decision', 'Prise de décision', 'Soft skill', '{}'::text[], true, true, 12
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'gestion-du-temps', 'Gestion du temps', 'Soft skill', ARRAY['GTD (getting things done)','Deep work']::text[], true, true, 13
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'perseverance', 'Persévérance', 'Soft skill', '{}'::text[], true, true, 14
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'esprit-critique', 'Esprit critique', 'Soft skill', '{}'::text[], true, true, 15
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'creativite', 'Créativité', 'Soft skill', '{}'::text[], true, true, 16
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'proactivite', 'Proactivité', 'Soft skill', '{}'::text[], true, true, 17
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'sens-de-l-organisation', 'Sens de l''organisation', 'Soft skill', '{}'::text[], true, true, 18
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'ouverture-d-esprit', 'Ouverture d''esprit', 'Soft skill', '{}'::text[], true, true, 19
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;
insert into public.skills (domain_id, slug, label, description, aliases, is_soft, is_active, position)
select d.id, 'sens-des-responsabilites', 'Sens des responsabilités', 'Soft skill', '{}'::text[], true, true, 20
from public.skill_domains d where d.slug = 'soft-skills'
on conflict (domain_id, slug) do update set
  label = excluded.label,
  description = excluded.description,
  aliases = excluded.aliases,
  is_soft = excluded.is_soft,
  is_active = excluded.is_active,
  position = excluded.position;

-- Migration déclarations depuis profiles.hard_skills (aucune suppression)
-- Crée une déclaration 'declared' pour chaque hard_skill non encore migrée.
insert into public.skill_declarations (user_id, skill_id, raw_label, match_confidence, match_status, kind, level, status)
select
  p.id as user_id,
  sk.id as skill_id,
  trim(hs.skill_name) as raw_label,
  case when sk.id is null then null else 1 end as match_confidence,
  case when sk.id is null then 'pending_review' else 'matched' end as match_status,
  case when coalesce(sk.is_soft, false) then 'soft' else 'hard' end as kind,
  'intermediaire'::text as level,
  'declared'::text as status
from public.profiles p
cross join lateral (
  select trim(x) as skill_name
  from jsonb_array_elements_text(
    case
      when jsonb_typeof(to_jsonb(p.hard_skills)) = 'array' then to_jsonb(p.hard_skills)
      else '[]'::jsonb
    end
  ) as x
) hs
left join lateral (
  select s.id, s.is_soft
  from public.skills s
  where s.is_active
    and (
      lower(s.label) = lower(hs.skill_name)
      or exists (
        select 1 from unnest(s.aliases) a where lower(a) = lower(hs.skill_name)
      )
    )
  order by s.is_soft asc
  limit 1
) sk on true
where hs.skill_name <> ''
  and not exists (
    select 1 from public.skill_declarations sd
    where sd.user_id = p.id and lower(sd.raw_label) = lower(hs.skill_name)
  );
