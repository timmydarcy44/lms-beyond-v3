-- Une seule veille fusionnée (kind = globale)

alter table public.crm_qualiopi_veille_sources
  drop constraint if exists crm_qualiopi_veille_sources_kind_check;
alter table public.crm_qualiopi_veille_sources
  add constraint crm_qualiopi_veille_sources_kind_check
  check (kind in ('globale', 'legale', 'metier', 'pedagogie'));

alter table public.crm_qualiopi_veille_digests
  drop constraint if exists crm_qualiopi_veille_digests_kind_check;
alter table public.crm_qualiopi_veille_digests
  add constraint crm_qualiopi_veille_digests_kind_check
  check (kind in ('globale', 'legale', 'metier', 'pedagogie'));

alter table public.crm_qualiopi_veille_highlights
  drop constraint if exists crm_qualiopi_veille_highlights_kind_check;
alter table public.crm_qualiopi_veille_highlights
  add constraint crm_qualiopi_veille_highlights_kind_check
  check (kind in ('globale', 'legale', 'metier', 'pedagogie'));

-- Une URL = une source RAG 1 (évite le conflit unique après fusion)
delete from public.crm_qualiopi_veille_sources a
using public.crm_qualiopi_veille_sources b
where a.url = b.url
  and a.id::text > b.id::text;

update public.crm_qualiopi_veille_sources set kind = 'globale' where kind <> 'globale';
update public.crm_qualiopi_veille_highlights set kind = 'globale' where kind <> 'globale';
