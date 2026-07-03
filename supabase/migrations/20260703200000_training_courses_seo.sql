-- SEO & FAQ formations EDGE Business

alter table public.training_courses
  add column if not exists meta_description text,
  add column if not exists seo_tags text[],
  add column if not exists faq jsonb,
  add column if not exists why_choose text[];

comment on column public.training_courses.meta_description is 'Meta description SEO (150-160 car.)';
comment on column public.training_courses.seo_tags is 'Tags SEO / mots-clés';
comment on column public.training_courses.faq is 'FAQ [{q,a}]';
comment on column public.training_courses.why_choose is 'Pourquoi choisir cette formation';
