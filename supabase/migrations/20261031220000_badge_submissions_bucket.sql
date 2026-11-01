-- Bucket privé pour les vidéos et réponses orales d'un passage de badge.
-- Non appliqué : à lancer quand le passage candidat est validé.
insert into storage.buckets (id, name, public)
values ('badge-submissions', 'badge-submissions', false)
on conflict (id) do nothing;
