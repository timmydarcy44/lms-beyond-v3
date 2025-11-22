-- Script pour importer la landing page avec structure de grille
-- Cette structure permet d'éditer chaque section avec le système de grille

DO $$
DECLARE
  v_super_admin_id UUID;
  v_page_id UUID;
  v_grid_content JSONB;
BEGIN
  -- Récupérer un super admin
  SELECT user_id INTO v_super_admin_id
  FROM public.super_admins
  LIMIT 1;

  IF v_super_admin_id IS NULL THEN
    RAISE NOTICE 'Aucun super admin trouvé. La page sera créée sans created_by.';
  END IF;

  -- Structure de grille pour la landing page
  v_grid_content := '[
    {
      "id": "section-hero",
      "type": "section",
      "layout": "1",
      "columns": [
        {
          "id": "column-hero-1",
          "width": "1",
          "blocks": [
            {
              "id": "block-hero-h1",
              "type": "heading1",
              "content": "Réapprendre à apprendre.",
              "styles": {
                "fontSize": "7xl",
                "fontWeight": "medium",
                "color": "#FFFFFF",
                "textAlign": "center"
              }
            },
            {
              "id": "block-hero-subtitle",
              "type": "text",
              "content": "Parce que la performance commence par le bien-être. Beyond est une expérience d''apprentissage pensée pour le cerveau humain. Ici, on n''accumule pas du savoir. On apprend à apprendre, à son rythme, dans le calme.",
              "styles": {
                "fontSize": "xl",
                "color": "#FFFFFF",
                "textAlign": "center",
                "opacity": "0.6"
              }
            }
          ]
        }
      ],
      "styles": {
        "backgroundColor": "#0B0B0C",
        "padding": "py-40",
        "minHeight": "min-h-screen"
      }
    },
    {
      "id": "section-philosophy",
      "type": "section",
      "layout": "1",
      "columns": [
        {
          "id": "column-philosophy-1",
          "width": "1",
          "blocks": [
            {
              "id": "block-philosophy-h2",
              "type": "heading2",
              "content": "Nous avons fait de l''apprentissage une course à la performance. Il est temps de remettre l''humain au centre.",
              "styles": {
                "fontSize": "5xl",
                "fontWeight": "medium",
                "color": "#0B0B0C",
                "textAlign": "center"
              }
            },
            {
              "id": "block-philosophy-text",
              "type": "text",
              "content": "Beyond n''est pas un simple LMS. C''est une philosophie qui réconcilie science, émotion et technologie. En s''appuyant sur les neurosciences, la psychologie cognitive et le design humain, Beyond crée des environnements d''apprentissage apaisés, efficaces et durables.",
              "styles": {
                "fontSize": "xl",
                "color": "#0B0B0C",
                "textAlign": "left"
              }
            }
          ]
        }
      ],
      "styles": {
        "backgroundColor": "#F8F9FB",
        "padding": "py-40"
      }
    },
    {
      "id": "section-experiences",
      "type": "section",
      "layout": "3",
      "columns": [
        {
          "id": "column-exp-1",
          "width": "1",
          "blocks": [
            {
              "id": "block-exp-h2",
              "type": "heading2",
              "content": "Les expériences Beyond",
              "styles": {
                "fontSize": "5xl",
                "fontWeight": "medium",
                "color": "#0B0B0C",
                "textAlign": "center"
              }
            },
            {
              "id": "block-exp-1",
              "type": "text",
              "content": "Mode Focus - Apprendre dans le calme, sans distractions.",
              "styles": {
                "fontSize": "lg",
                "color": "#0B0B0C"
              }
            }
          ]
        },
        {
          "id": "column-exp-2",
          "width": "1",
          "blocks": [
            {
              "id": "block-exp-2",
              "type": "text",
              "content": "Pomodoro - Trouver le bon rythme entre effort et récupération.",
              "styles": {
                "fontSize": "lg",
                "color": "#0B0B0C"
              }
            }
          ]
        },
        {
          "id": "column-exp-3",
          "width": "1",
          "blocks": [
            {
              "id": "block-exp-3",
              "type": "text",
              "content": "Accessibilité DYS - Un apprentissage sans friction ni fatigue visuelle.",
              "styles": {
                "fontSize": "lg",
                "color": "#0B0B0C"
              }
            }
          ]
        }
      ],
      "styles": {
        "backgroundColor": "#FFFFFF",
        "padding": "py-40"
      }
    }
  ]'::jsonb;

  -- Vérifier si la page landing existe déjà
  SELECT id INTO v_page_id
  FROM public.cms_pages
  WHERE slug = 'landing';

  IF v_page_id IS NOT NULL THEN
    RAISE NOTICE 'La page landing existe déjà avec l''ID: %. Mise à jour avec structure de grille...', v_page_id;
    
    -- Mettre à jour la page existante
    UPDATE public.cms_pages
    SET
      title = 'Page d''accueil - Beyond LMS',
      meta_title = 'Beyond LMS - L''apprentissage repensé pour l''esprit, le corps et l''âme',
      meta_description = 'Une plateforme d''apprentissage qui s''adapte au cerveau humain. Fusion des neurosciences, de la psychologie et du design minimaliste.',
      h1 = 'Réapprendre à apprendre.',
      h2 = 'Parce que la performance commence par le bien-être.',
      content = v_grid_content,
      content_type = 'grid',
      is_published = true,
      updated_at = NOW()
    WHERE id = v_page_id;
    
    RAISE NOTICE 'Page landing mise à jour avec structure de grille.';
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
      content_type,
      is_published,
      created_by
    ) VALUES (
      'landing',
      'Page d''accueil - Beyond LMS',
      'Beyond LMS - L''apprentissage repensé pour l''esprit, le corps et l''âme',
      'Une plateforme d''apprentissage qui s''adapte au cerveau humain. Fusion des neurosciences, de la psychologie et du design minimaliste.',
      'Réapprendre à apprendre.',
      'Parce que la performance commence par le bien-être.',
      v_grid_content,
      'grid',
      true,
      v_super_admin_id
    )
    RETURNING id INTO v_page_id;
    
    RAISE NOTICE 'Page landing créée avec structure de grille. ID: %.', v_page_id;
  END IF;
END
$$;

-- Vérifier le résultat
SELECT 
  id,
  slug,
  title,
  content_type,
  is_published,
  jsonb_array_length(content) as sections_count,
  created_at,
  updated_at
FROM public.cms_pages
WHERE slug = 'landing';







