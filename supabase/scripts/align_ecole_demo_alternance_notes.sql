-- Script informatif (à lancer manuellement si besoin) : vérifier rattachements école / entreprise / tuteur.
-- Remplacer les UUID par ceux de votre environnement.

-- Apprenants rattachés à l'école via school_students :
-- select ss.school_id, p.id, p.email, p.first_name, p.last_name
-- from public.school_students ss
-- join public.profiles p on p.id = ss.student_id
-- where ss.school_id = '<school_uuid>';

-- Entreprises CRM de l'école :
-- select id, company_name, name, school_id from public.crm_prospects where school_id = '<school_uuid>' limit 20;

-- Mettre une entreprise d'accueil + tuteur sur un profil apprenant :
-- update public.profiles
-- set host_company_prospect_id = '<crm_prospect_uuid>',
--     enterprise_tutor_name = 'Nom Prénom',
--     enterprise_tutor_email = 'tuteur@entreprise.fr'
-- where id = '<learner_profile_uuid>';
