-- Script optimisé pour stocker les questions du test de confiance en soi
-- Utilise une approche plus efficace pour éviter les timeouts

-- Créer une fonction temporaire pour construire les questions
CREATE OR REPLACE FUNCTION build_confidence_test_questions()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    likert_labels JSONB;
BEGIN
    -- Construire les labels Likert une seule fois
    likert_labels := jsonb_build_object(
        '1', 'Pas du tout d''accord',
        '2', 'Plutôt pas d''accord',
        '3', 'Plutôt d''accord',
        '4', 'Tout à fait d''accord'
    );

    -- Construire le tableau de questions
    result := jsonb_build_array(
        -- Estime de soi (6 questions)
        jsonb_build_object('id', 'estime_1', 'title', 'Je me sens capable de reconnaître mes qualités.', 'text', 'Je me sens capable de reconnaître mes qualités.', 'type', 'likert', 'category', 'estime', 'dimension', 'estime', 'dimensionLabel', 'Estime de soi', 'reversed', false, 'imageIndex', 0, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'estime_2', 'title', 'Globalement, je suis satisfait(e) de moi-même.', 'text', 'Globalement, je suis satisfait(e) de moi-même.', 'type', 'likert', 'category', 'estime', 'dimension', 'estime', 'dimensionLabel', 'Estime de soi', 'reversed', false, 'imageIndex', 1, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'estime_3', 'title', 'Je me sens digne d''être respecté(e) par les autres.', 'text', 'Je me sens digne d''être respecté(e) par les autres.', 'type', 'likert', 'category', 'estime', 'dimension', 'estime', 'dimensionLabel', 'Estime de soi', 'reversed', false, 'imageIndex', 2, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'estime_4', 'title', 'Il m''arrive de penser que je ne vaux pas grand-chose.', 'text', 'Il m''arrive de penser que je ne vaux pas grand-chose.', 'type', 'likert', 'category', 'estime', 'dimension', 'estime', 'dimensionLabel', 'Estime de soi', 'reversed', true, 'imageIndex', 3, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'estime_5', 'title', 'Je me sens légitime dans mes choix et dans ce que j''entreprends.', 'text', 'Je me sens légitime dans mes choix et dans ce que j''entreprends.', 'type', 'likert', 'category', 'estime', 'dimension', 'estime', 'dimensionLabel', 'Estime de soi', 'reversed', false, 'imageIndex', 4, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'estime_6', 'title', 'Je suis à l''aise pour parler de mes réussites sans culpabiliser.', 'text', 'Je suis à l''aise pour parler de mes réussites sans culpabiliser.', 'type', 'likert', 'category', 'estime', 'dimension', 'estime', 'dimensionLabel', 'Estime de soi', 'reversed', false, 'imageIndex', 5, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        -- Auto-efficacité (6 questions)
        jsonb_build_object('id', 'auto_1', 'title', 'Je me sens capable de trouver des solutions même en situation difficile.', 'text', 'Je me sens capable de trouver des solutions même en situation difficile.', 'type', 'likert', 'category', 'auto_efficacite', 'dimension', 'auto_efficacite', 'dimensionLabel', 'Auto-efficacité', 'reversed', false, 'imageIndex', 0, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'auto_2', 'title', 'Je peux gérer un imprévu avec calme et lucidité.', 'text', 'Je peux gérer un imprévu avec calme et lucidité.', 'type', 'likert', 'category', 'auto_efficacite', 'dimension', 'auto_efficacite', 'dimensionLabel', 'Auto-efficacité', 'reversed', false, 'imageIndex', 1, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'auto_3', 'title', 'Je crois en ma capacité à atteindre mes objectifs.', 'text', 'Je crois en ma capacité à atteindre mes objectifs.', 'type', 'likert', 'category', 'auto_efficacite', 'dimension', 'auto_efficacite', 'dimensionLabel', 'Auto-efficacité', 'reversed', false, 'imageIndex', 2, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'auto_4', 'title', 'Lorsque je rencontre un obstacle, je trouve généralement un moyen de m''en sortir.', 'text', 'Lorsque je rencontre un obstacle, je trouve généralement un moyen de m''en sortir.', 'type', 'likert', 'category', 'auto_efficacite', 'dimension', 'auto_efficacite', 'dimensionLabel', 'Auto-efficacité', 'reversed', false, 'imageIndex', 3, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'auto_5', 'title', 'Je peux rester concentré(e) même lorsque je suis sous pression.', 'text', 'Je peux rester concentré(e) même lorsque je suis sous pression.', 'type', 'likert', 'category', 'auto_efficacite', 'dimension', 'auto_efficacite', 'dimensionLabel', 'Auto-efficacité', 'reversed', false, 'imageIndex', 4, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'auto_6', 'title', 'Je me sens capable d''affronter des défis importants sans me décourager.', 'text', 'Je me sens capable d''affronter des défis importants sans me décourager.', 'type', 'likert', 'category', 'auto_efficacite', 'dimension', 'auto_efficacite', 'dimensionLabel', 'Auto-efficacité', 'reversed', false, 'imageIndex', 5, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        -- Assertivité (6 questions)
        jsonb_build_object('id', 'assertivite_1', 'title', 'Je me sens capable d''exprimer clairement mon opinion.', 'text', 'Je me sens capable d''exprimer clairement mon opinion.', 'type', 'likert', 'category', 'assertivite', 'dimension', 'assertivite', 'dimensionLabel', 'Assertivité', 'reversed', false, 'imageIndex', 0, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'assertivite_2', 'title', 'J''ose défendre mes idées face aux autres.', 'text', 'J''ose défendre mes idées face aux autres.', 'type', 'likert', 'category', 'assertivite', 'dimension', 'assertivite', 'dimensionLabel', 'Assertivité', 'reversed', false, 'imageIndex', 1, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'assertivite_3', 'title', 'Je peux dire non sans culpabiliser.', 'text', 'Je peux dire non sans culpabiliser.', 'type', 'likert', 'category', 'assertivite', 'dimension', 'assertivite', 'dimensionLabel', 'Assertivité', 'reversed', false, 'imageIndex', 2, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'assertivite_4', 'title', 'Je me sens légitime pour poser des limites.', 'text', 'Je me sens légitime pour poser des limites.', 'type', 'likert', 'category', 'assertivite', 'dimension', 'assertivite', 'dimensionLabel', 'Assertivité', 'reversed', false, 'imageIndex', 3, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'assertivite_5', 'title', 'Je peux accepter les critiques sans me sentir diminué(e).', 'text', 'Je peux accepter les critiques sans me sentir diminué(e).', 'type', 'likert', 'category', 'assertivite', 'dimension', 'assertivite', 'dimensionLabel', 'Assertivité', 'reversed', false, 'imageIndex', 4, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'assertivite_6', 'title', 'Je me permets de demander de l''aide lorsque j''en ai besoin.', 'text', 'Je me permets de demander de l''aide lorsque j''en ai besoin.', 'type', 'likert', 'category', 'assertivite', 'dimension', 'assertivite', 'dimensionLabel', 'Assertivité', 'reversed', false, 'imageIndex', 5, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        -- Compétences sociales (6 questions)
        jsonb_build_object('id', 'social_1', 'title', 'Je me sens à l''aise dans des situations sociales nouvelles.', 'text', 'Je me sens à l''aise dans des situations sociales nouvelles.', 'type', 'likert', 'category', 'competences_sociales', 'dimension', 'competences_sociales', 'dimensionLabel', 'Compétences sociales & Adaptabilité', 'reversed', false, 'imageIndex', 0, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'social_2', 'title', 'J''ose prendre des initiatives même si je risque de me tromper.', 'text', 'J''ose prendre des initiatives même si je risque de me tromper.', 'type', 'likert', 'category', 'competences_sociales', 'dimension', 'competences_sociales', 'dimensionLabel', 'Compétences sociales & Adaptabilité', 'reversed', false, 'imageIndex', 1, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'social_3', 'title', 'Je peux prendre des décisions rapidement lorsque c''est nécessaire.', 'text', 'Je peux prendre des décisions rapidement lorsque c''est nécessaire.', 'type', 'likert', 'category', 'competences_sociales', 'dimension', 'competences_sociales', 'dimensionLabel', 'Compétences sociales & Adaptabilité', 'reversed', false, 'imageIndex', 2, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'social_4', 'title', 'Je me sens capable de parler devant un groupe.', 'text', 'Je me sens capable de parler devant un groupe.', 'type', 'likert', 'category', 'competences_sociales', 'dimension', 'competences_sociales', 'dimensionLabel', 'Compétences sociales & Adaptabilité', 'reversed', false, 'imageIndex', 3, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'social_5', 'title', 'J''essaie volontiers de nouvelles expériences.', 'text', 'J''essaie volontiers de nouvelles expériences.', 'type', 'likert', 'category', 'competences_sociales', 'dimension', 'competences_sociales', 'dimensionLabel', 'Compétences sociales & Adaptabilité', 'reversed', false, 'imageIndex', 4, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels)),
        jsonb_build_object('id', 'social_6', 'title', 'Je m''adapte facilement à des environnements ou des personnes inconnues.', 'text', 'Je m''adapte facilement à des environnements ou des personnes inconnues.', 'type', 'likert', 'category', 'competences_sociales', 'dimension', 'competences_sociales', 'dimensionLabel', 'Compétences sociales & Adaptabilité', 'reversed', false, 'imageIndex', 5, 'score', 1, 'status', 'ready', 'likert', jsonb_build_object('min', 1, 'max', 4, 'labels', likert_labels))
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Utiliser la fonction pour mettre à jour le test
DO $$
DECLARE
    test_id UUID;
    questions_json JSONB;
BEGIN
    -- Chercher le test par slug ou titre
    SELECT id INTO test_id
    FROM tests
    WHERE slug = 'test-confiance-en-soi' 
       OR title ILIKE '%confiance en soi%'
    LIMIT 1;

    IF test_id IS NULL THEN
        RAISE EXCEPTION 'Test de confiance en soi non trouvé. Veuillez d''abord créer le test.';
    END IF;

    -- Construire les questions via la fonction
    questions_json := build_confidence_test_questions();

    -- Mettre à jour le test
    UPDATE tests
    SET questions = questions_json,
        updated_at = NOW()
    WHERE id = test_id;

    RAISE NOTICE 'Questions du test de confiance en soi stockées avec succès (Test ID: %)', test_id;
END $$;

-- Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS build_confidence_test_questions();

