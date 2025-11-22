-- Script pour importer la landing page existante dans le CMS
-- Cette page sera visible dans /super/pages pour modification

DO $$
DECLARE
  v_super_admin_id UUID;
  v_page_id UUID;
BEGIN
  -- Récupérer un super admin (le premier trouvé)
  SELECT user_id INTO v_super_admin_id
  FROM public.super_admins
  LIMIT 1;

  IF v_super_admin_id IS NULL THEN
    RAISE NOTICE 'Aucun super admin trouvé. La page sera créée sans created_by.';
  END IF;

  -- Vérifier si la page landing existe déjà
  SELECT id INTO v_page_id
  FROM public.cms_pages
  WHERE slug = 'landing';

  IF v_page_id IS NOT NULL THEN
    RAISE NOTICE 'La page landing existe déjà avec l''ID: %. Mise à jour...', v_page_id;
    
    -- Mettre à jour la page existante
    UPDATE public.cms_pages
    SET
      title = 'Page d''accueil - Beyond LMS',
      meta_title = 'Beyond LMS - L''apprentissage repensé pour l''esprit, le corps et l''âme',
      meta_description = 'Une plateforme d''apprentissage qui s''adapte au cerveau humain. Fusion des neurosciences, de la psychologie et du design minimaliste.',
      h1 = 'Réapprendre à apprendre.',
      h2 = 'Parce que la performance commence par le bien-être.',
      content = '[
        {
          "id": "block-hero",
          "type": "heading1",
          "content": "Réapprendre à apprendre.",
          "metadata": {}
        },
        {
          "id": "block-hero-subtitle",
          "type": "text",
          "content": "Parce que la performance commence par le bien-être. Beyond est une expérience d''apprentissage pensée pour le cerveau humain. Ici, on n''accumule pas du savoir. On apprend à apprendre, à son rythme, dans le calme.",
          "metadata": {}
        },
        {
          "id": "block-philosophy",
          "type": "heading2",
          "content": "Nous avons fait de l''apprentissage une course à la performance.",
          "metadata": {}
        },
        {
          "id": "block-philosophy-text",
          "type": "text",
          "content": "Il est temps de remettre l''humain au centre. Beyond n''est pas un simple LMS. C''est une philosophie qui réconcilie science, émotion et technologie.",
          "metadata": {}
        }
      ]'::jsonb,
      is_published = true,
      updated_at = NOW()
    WHERE id = v_page_id;
    
    RAISE NOTICE 'Page landing mise à jour avec succès.';
  ELSE
    -- Créer la nouvelle page landing
    INSERT INTO public.cms_pages (
      slug,
      title,
      meta_title,
      meta_description,
      h1,
      h2,
      content,
      is_published,
      created_by
    ) VALUES (
      'landing',
      'Page d''accueil - Beyond LMS',
      'Beyond LMS - L''apprentissage repensé pour l''esprit, le corps et l''âme',
      'Une plateforme d''apprentissage qui s''adapte au cerveau humain. Fusion des neurosciences, de la psychologie et du design minimaliste.',
      'Réapprendre à apprendre.',
      'Parce que la performance commence par le bien-être.',
      '[
        {
          "id": "block-hero",
          "type": "heading1",
          "content": "Réapprendre à apprendre.",
          "metadata": {}
        },
        {
          "id": "block-hero-subtitle",
          "type": "text",
          "content": "Parce que la performance commence par le bien-être. Beyond est une expérience d''apprentissage pensée pour le cerveau humain. Ici, on n''accumule pas du savoir. On apprend à apprendre, à son rythme, dans le calme.",
          "metadata": {}
        },
        {
          "id": "block-philosophy",
          "type": "heading2",
          "content": "Nous avons fait de l''apprentissage une course à la performance.",
          "metadata": {}
        },
        {
          "id": "block-philosophy-text",
          "type": "text",
          "content": "Il est temps de remettre l''humain au centre. Beyond n''est pas un simple LMS. C''est une philosophie qui réconcilie science, émotion et technologie.",
          "metadata": {}
        }
      ]'::jsonb,
      true,
      v_super_admin_id
    )
    RETURNING id INTO v_page_id;
    
    RAISE NOTICE 'Page landing créée avec succès avec l''ID: %.', v_page_id;
  END IF;
END
$$;

-- Vérifier le résultat
SELECT 
  id,
  slug,
  title,
  is_published,
  created_at,
  updated_at
FROM public.cms_pages
WHERE slug = 'landing';







