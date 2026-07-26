/* eslint-disable */
/** Auto-généré par scripts/generate-jessica-questionnaires.mjs — ne pas éditer à la main. */
export type JessicaQuestionType = "text" | "single" | "checkbox" | "boolean" | "scale";

export type JessicaQuestionDef = {
  id: string;
  label: string;
  type: JessicaQuestionType;
  options?: string[];
  min?: number;
  max?: number;
};

export type JessicaQuestionnaireDef = {
  slug: string;
  title: string;
  description: string;
  questions: JessicaQuestionDef[];
};

export const JESSICA_QUESTIONNAIRES: Record<string, JessicaQuestionnaireDef> = {
  "situation-enfant": {
    "slug": "situation-enfant",
    "title": "Questionnaire relatif à la situation de l'enfant",
    "description": "Anamnèse parentale — situation de l'enfant (ex-Typeform).",
    "questions": [
      {
        "id": "situation-enfant_nom_de_l_enfant_1",
        "label": "Nom de l'enfant",
        "type": "text"
      },
      {
        "id": "situation-enfant_prenom_de_l_enfant_2",
        "label": "Prénom de l'enfant",
        "type": "text"
      },
      {
        "id": "situation-enfant_age_de_votre_enfant_3",
        "label": "âge de votre enfant",
        "type": "text"
      },
      {
        "id": "situation-enfant_profession_parent_1_4",
        "label": "Profession parent 1",
        "type": "single",
        "options": [
          "Assistante de direction",
          "Directrice du pôle ressources",
          "Gestionnaire de paie"
        ]
      },
      {
        "id": "situation-enfant_profession_parent_2_5",
        "label": "Profession parent 2",
        "type": "single",
        "options": [
          "Artisan couvreur",
          "Responsable antenne bureau d’étude",
          "Responsable magasin pièces détachées"
        ]
      },
      {
        "id": "situation-enfant_en_quelle_classe_est_actuellement_votre_enfant_6",
        "label": "En quelle classe est actuellement votre enfant ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_dans_quelle_ecole_suit_il_sa_scolarite_7",
        "label": "Dans quelle école suit-il sa scolarité ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_pouvez_vous_decrire_brievement_votre_enfant_en_q_8",
        "label": "Pouvez-vous décrire brièvement votre enfant en quelques mots ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_quels_sont_les_centres_d_interet_de_votre_enfant_9",
        "label": "Quels sont les centres d'intérêt de votre enfant ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_comment_se_deroule_une_journee_type_a_la_maison__10",
        "label": "Comment se déroule une journée type à la maison avec votre enfant ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_reveil_11",
        "label": "Réveil",
        "type": "checkbox",
        "options": [
          "Réveil"
        ]
      },
      {
        "id": "situation-enfant_depart_a_l_ecole_12",
        "label": "Départ à l'école",
        "type": "checkbox",
        "options": [
          "Départ à l'école"
        ]
      },
      {
        "id": "situation-enfant_les_repas_13",
        "label": "Les repas",
        "type": "checkbox",
        "options": [
          "Les repas"
        ]
      },
      {
        "id": "situation-enfant_les_devoirs_14",
        "label": "Les devoirs",
        "type": "checkbox",
        "options": [
          "Les devoirs"
        ]
      },
      {
        "id": "situation-enfant_le_coucher_15",
        "label": "Le coucher",
        "type": "checkbox",
        "options": [
          "Le coucher"
        ]
      },
      {
        "id": "situation-enfant_other_1_16",
        "label": "Précision (autre) #1",
        "type": "text"
      },
      {
        "id": "situation-enfant_coleres_ou_frustrations_frequentes_17",
        "label": "Colères ou frustrations fréquentes",
        "type": "checkbox",
        "options": [
          "Colères ou frustrations fréquentes"
        ]
      },
      {
        "id": "situation-enfant_difficultes_a_suivre_les_consignes_18",
        "label": "Difficultés à suivre les consignes",
        "type": "checkbox",
        "options": [
          "Difficultés à suivre les consignes"
        ]
      },
      {
        "id": "situation-enfant_problemes_d_attention_concentration_19",
        "label": "Problèmes d'attention/concentration",
        "type": "checkbox",
        "options": [
          "Problèmes d'attention/concentration"
        ]
      },
      {
        "id": "situation-enfant_other_2_20",
        "label": "Précision (autre) #2",
        "type": "text"
      },
      {
        "id": "situation-enfant_comment_votre_enfant_reagit_il_face_a_un_changem_21",
        "label": "Comment votre enfant réagit-il face à un changement de routine ou à une situation imprévue ?",
        "type": "single",
        "options": [
          "Bien, il/elle s'adapte facilement",
          "Difficulté importante à s'adapter",
          "Un peu stressé(e) mais parvient à gérer"
        ]
      },
      {
        "id": "situation-enfant_other_3_22",
        "label": "Précision (autre) #3",
        "type": "checkbox",
        "options": [
          "Other"
        ]
      },
      {
        "id": "situation-enfant_avez_vous_eu_des_retours_de_la_part_des_enseigna_23",
        "label": "Avez-vous eu des retours de la part des enseignant(e)s concernant le comportement de votre enfant à l'école ?",
        "type": "checkbox",
        "options": [
          "Avez-vous eu des retours de la part des enseignant(e)s concernant le comportement de votre enfant à l'école ?"
        ]
      },
      {
        "id": "situation-enfant_si_oui_quels_sont_les_principaux_points_souleves_24",
        "label": "Si oui, quels sont les principaux points soulevés ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_comment_votre_enfant_vit_il_la_socialisation_a_l_25",
        "label": "Comment votre enfant vit-il la socialisation à l'école ?",
        "type": "single",
        "options": [
          "A beaucoup d'amis et s'intègre bien",
          "A quelques amis proches",
          "Semble isolé(e) ou a des difficultés à se faire des amis"
        ]
      },
      {
        "id": "situation-enfant_other_4_26",
        "label": "Précision (autre) #4",
        "type": "text"
      },
      {
        "id": "situation-enfant_manque_de_concentration_27",
        "label": "Manque de concentration",
        "type": "checkbox",
        "options": [
          "Manque de concentration"
        ]
      },
      {
        "id": "situation-enfant_incomprehension_des_consignes_28",
        "label": "Incompréhension des consignes",
        "type": "checkbox",
        "options": [
          "Incompréhension des consignes"
        ]
      },
      {
        "id": "situation-enfant_rythme_de_travail_plus_lent_29",
        "label": "Rythme de travail plus lent",
        "type": "checkbox",
        "options": [
          "Rythme de travail plus lent"
        ]
      },
      {
        "id": "situation-enfant_other_5_30",
        "label": "Précision (autre) #5",
        "type": "single",
        "options": [
          "Exprime le besoin de bouger plus souvent",
          "N’ose pas faire par elle même",
          "Refus de suivre les consignes",
          "difficultés avec les chiffres",
          "non"
        ]
      },
      {
        "id": "situation-enfant_lecture_31",
        "label": "Lecture",
        "type": "checkbox",
        "options": [
          "Lecture"
        ]
      },
      {
        "id": "situation-enfant_ecriture_32",
        "label": "Ecriture",
        "type": "checkbox",
        "options": [
          "Ecriture"
        ]
      },
      {
        "id": "situation-enfant_mathematique_33",
        "label": "Mathématique",
        "type": "checkbox",
        "options": [
          "Mathématique"
        ]
      },
      {
        "id": "situation-enfant_other_6_34",
        "label": "Précision (autre) #6",
        "type": "single",
        "options": [
          "Aucune",
          "Phonétique",
          "non"
        ]
      },
      {
        "id": "situation-enfant_comment_votre_enfant_reagit_il_face_aux_devoirs__35",
        "label": "Comment votre enfant réagit-il face aux devoirs et aux leçons à la maison ?",
        "type": "single",
        "options": [
          "Il/elle est plutôt enthousiaste",
          "Il/elle est plutôt indifférent(e)",
          "Il/elle s'oppose ou résiste"
        ]
      },
      {
        "id": "situation-enfant_other_7_36",
        "label": "Précision (autre) #7",
        "type": "single",
        "options": [
          "Pas encore de devoir",
          "n'admet pas qu'on verifie quand il fait en autonomie"
        ]
      },
      {
        "id": "situation-enfant_avez_vous_remarque_des_signes_de_stress_lies_aux_37",
        "label": "Avez-vous remarqué des signes de stress liés aux apprentissages ?",
        "type": "single",
        "options": [
          "Non",
          "Oui, fréquemment",
          "Parfois"
        ]
      },
      {
        "id": "situation-enfant_par_des_mots_38",
        "label": "Par des mots",
        "type": "checkbox",
        "options": [
          "Par des mots"
        ]
      },
      {
        "id": "situation-enfant_par_des_gestes_pleurs_cris_etc_39",
        "label": "Par des gestes (pleurs, cris, etc.)",
        "type": "checkbox",
        "options": [
          "Par des gestes (pleurs, cris, etc.)"
        ]
      },
      {
        "id": "situation-enfant_a_du_mal_a_exprimer_ses_emotions_40",
        "label": "A du mal à exprimer ses émotions",
        "type": "checkbox",
        "options": [
          "A du mal à exprimer ses émotions"
        ]
      },
      {
        "id": "situation-enfant_other_8_41",
        "label": "Précision (autre) #8",
        "type": "text"
      },
      {
        "id": "situation-enfant_votre_enfant_semble_t_il_facilement_stresse_ou_a_42",
        "label": "Votre enfant semble t-il facilement stressé ou angoissé ?",
        "type": "single",
        "options": [
          "Non",
          "Oui, souvent",
          "Parfois"
        ]
      },
      {
        "id": "situation-enfant_quelles_sont_les_situations_qui_generent_le_plus_43",
        "label": "Quelles sont les situations qui génèrent le plus de frustation chez votre enfant ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_comment_se_passe_la_relation_de_votre_enfant_ave_44",
        "label": "Comment se passe la relation de votre enfant avec les autres membres de la famille ?",
        "type": "single",
        "options": [
          "Difficile",
          "Quelques tensions",
          "Très bien"
        ]
      },
      {
        "id": "situation-enfant_votre_enfant_participe_t_il_a_des_activites_de_g_45",
        "label": "Votre enfant participe-t-il à des activités de groupe ?",
        "type": "checkbox",
        "options": [
          "Votre enfant participe-t-il à des activités de groupe ?"
        ]
      },
      {
        "id": "situation-enfant_comment_se_comporte_t_il_elle_dans_ces_situation_46",
        "label": "Comment se comporte t-il/elle dans ces situations ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_quels_sont_les_aspects_de_la_vie_de_votre_enfant_47",
        "label": "Quels sont les aspects de la vie de votre enfant qui vous préoccupent le plus actuellement ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_quelles_sont_les_qualites_de_votre_enfant_que_vo_48",
        "label": "Quelles sont les qualités de votre enfant que vous souhaitez mettre en avant ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_qu_attendez_vous_de_cet_accompagnement_psychoped_49",
        "label": "Qu'attendez-vous de cet accompagnement psychopédagogique pour votre enfant ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_y_a_t_il_des_elements_importants_que_vous_souhai_50",
        "label": "Y a-t-il des éléments importants que vous souhaitez ajouter concernant le contexte familial, les apprentissages ou le comportement de votre enfant ?",
        "type": "text"
      },
      {
        "id": "situation-enfant_avez_vous_deja_consulte_d_autres_professionnels__51",
        "label": "Avez-vous déjà consulté d'autres professionnels (ortophoniste, psychologue, etc) pour votre enfant ? Si oui, pouvez-vous indiquer lesquels et à quelle occasion ?",
        "type": "text"
      }
    ]
  },
  "tdah": {
    "slug": "tdah",
    "title": "Questionnaire TDAH",
    "description": "Questionnaire importé depuis Typeform, désormais disponible dans le CRM.",
    "questions": [
      {
        "id": "tdah_mon_enfant_a_du_mal_a_rester_concentre_sur_une_t_1",
        "label": "Mon enfant a du mal à rester concentré sur une tâche, même pour des activités qu'il aime.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_il_elle_fait_souvent_des_erreurs_d_etourderie_da_2",
        "label": "Il/elle fait souvent des erreurs d'étourderie dans ses devoirs ou ses activités quotidiennes.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_a_tendance_a_perdre_des_objets_import_3",
        "label": "Mon enfant a tendance à perdre des objets importants (stylos, jouets, vêtements).",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_il_elle_semble_ne_pas_ecouter_quand_on_lui_parle_4",
        "label": "Il/elle semble ne pas écouter quand on lui parle directement ou se \"déconnecte\" facilement.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_evite_ou_repousse_les_activites_deman_5",
        "label": "Mon enfant évite ou repousse les activités demandant une concentration prolongée (devoirs, lecture).",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_il_elle_se_laisse_facilement_distraire_par_des_b_6",
        "label": "Il/elle se laisse facilement distraire par des bruits ou des mouvements autour de lui.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_a_des_difficultes_a_organiser_ses_dev_7",
        "label": "Mon enfant a des difficultés à organiser ses devoirs ou ses tâches quotidiennes.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_a_du_mal_a_finir_ce_qu_il_commence_pa_8",
        "label": "Mon enfant a du mal à finir ce qu'il commence, passant souvent d'une tâche à une autre sans la terminer.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_bouge_constamment_se_tortille_ou_agit_9",
        "label": "Mon enfant bouge constamment, se tortille ou agite les mains et les pieds lorsqu'il est assis.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_il_elle_se_leve_souvent_de_son_siege_lorsqu_il_e_10",
        "label": "Il/elle se lève souvent de son siège lorsqu'il est censé rester assis (par exemple, en classe ou à table).",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_court_ou_grimpe_dans_des_situations_i_11",
        "label": "Mon enfant court ou grimpe dans des situations inappropriées, même après qu’on lui ait demandé de ne pas le faire.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_parle_beaucoup_meme_dans_des_moments__12",
        "label": "Mon enfant parle beaucoup, même dans des moments où il devrait rester calme.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_il_elle_est_en_constante_activite_comme_s_il_eta_13",
        "label": "Il/elle est en constante activité, comme s'il était \"poussé par un moteur\".",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_semble_avoir_du_mal_a_jouer_calmement_14",
        "label": "Mon enfant semble avoir du mal à jouer calmement ou à s’engager dans des activités de manière tranquille.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_repond_souvent_aux_questions_avant_qu_15",
        "label": "Mon enfant répond souvent aux questions avant que la personne ait terminé de parler.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_il_elle_a_du_mal_a_attendre_son_tour_dans_les_je_16",
        "label": "Il/elle a du mal à attendre son tour dans les jeux ou lors d'activités de groupe.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_interrompt_ou_s_immisce_souvent_dans__17",
        "label": "Mon enfant interrompt ou s'immisce souvent dans les conversations ou les jeux des autres.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_a_des_acces_de_colere_ou_d_impulsivit_18",
        "label": "Mon enfant a des accès de colère ou d'impulsivité lorsqu'il est frustré.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_il_elle_prend_des_risques_sans_reflechir_aux_con_19",
        "label": "Il/elle prend des risques sans réfléchir aux conséquences (par exemple, courir dans la rue).",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      },
      {
        "id": "tdah_mon_enfant_semble_avoir_des_difficultes_a_contro_20",
        "label": "Mon enfant semble avoir des difficultés à contrôler ses émotions, passant rapidement de la joie à la colère ou à la tristesse.",
        "type": "single",
        "options": [
          "Jamais",
          "Parfois",
          "Souvent",
          "Très souvent"
        ]
      }
    ]
  },
  "pre-diagnostic-dys": {
    "slug": "pre-diagnostic-dys",
    "title": "Pré-diagnostic DYS",
    "description": "Questionnaire importé depuis Typeform, désormais disponible dans le CRM.",
    "questions": [
      {
        "id": "pre-diagnostic-dys_avez_vous_des_difficultes_a_vous_exprimer_claire_5",
        "label": "Avez-vous des difficultés à vous exprimer clairement à l’oral ? (Ex. : chercher vos mots, formuler des phrases complètes, être compris par les autres)",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_a_quelle_frequence_avez_vous_des_difficultes_a_c_6",
        "label": "À quelle fréquence avez-vous des difficultés à comprendre des instructions orales complexes ou des conversations longues ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_lorsque_vous_parlez_avez_vous_tendance_a_hesiter_7",
        "label": "Lorsque vous parlez, avez-vous tendance à hésiter, à répéter des mots ou à faire des erreurs de prononciation ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_avez_vous_des_difficultes_a_planifier_et_organis_8",
        "label": "Avez-vous des difficultés à planifier et organiser vos tâches, comme terminer un projet ou préparer vos devoirs ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_vous_arrive_t_il_souvent_d_oublier_des_informati_9",
        "label": "Vous arrive-t-il souvent d’oublier des informations importantes ou des instructions que vous avez reçues récemment ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_avez_vous_des_difficultes_a_rester_concentre_e_p_10",
        "label": "Avez-vous des difficultés à rester concentré(e) pendant des périodes prolongées, que ce soit en classe, lors d’une tâche ou même en écoutant quelqu'un parler ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_rencontrez_vous_des_difficultes_a_lire_un_texte__11",
        "label": "Rencontrez-vous des difficultés à lire un texte fluide ? (Ex. : inverser ou omettre des lettres, confondre des sons, lire lentement)",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_avez_vous_des_difficultes_a_ecrire_correctement__12",
        "label": "Avez-vous des difficultés à écrire correctement des mots ou des phrases ? (Ex. : fautes d’orthographe fréquentes, lettres inversées, écriture irrégulière)",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_lorsque_vous_devez_ecrire_un_texte_avez_vous_des_13",
        "label": "Lorsque vous devez écrire un texte, avez-vous des difficultés à organiser vos idées ou à structurer votre discours ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_avez_vous_des_difficultes_a_realiser_des_gestes__14",
        "label": "Avez-vous des difficultés à réaliser des gestes précis ou coordonnés, comme utiliser des outils (ex. : ciseaux, stylos), ou à accomplir des tâches manuelles (ex. : boutonner une chemise, lacer vos chaussures) ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_vous_arrive_t_il_de_faire_tomber_des_objets_de_t_15",
        "label": "Vous arrive-t-il de faire tomber des objets, de trébucher ou de renverser des choses par maladresse ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_avez_vous_des_difficultes_a_suivre_les_mouvement_16",
        "label": "Avez-vous des difficultés à suivre les mouvements ou les séquences de mouvements dans des activités physiques (ex. : sports, danses, gestes répétitifs) ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "pre-diagnostic-dys_acceptez_vous_d_etre_rappele_par_la_psychopedago_17",
        "label": "Acceptez-vous d'être rappelé par la psychopédagogue de l'école si elle estime que cela nécessaire ?",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "pre-diagnostic-dys_aimeriez_vous_avoir_un_accompagnement_psychopeda_18",
        "label": "Aimeriez-vous avoir un accompagnement psychopédagogique ?",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "pre-diagnostic-dys_pour_quelle_s_raison_s_19",
        "label": "Pour quelle(s) raison(s) ?",
        "type": "text"
      }
    ]
  },
  "stress-academique": {
    "slug": "stress-academique",
    "title": "Test de stress académique",
    "description": "Questionnaire importé depuis Typeform, désormais disponible dans le CRM.",
    "questions": [
      {
        "id": "stress-academique_sur_une_echelle_de_1_a_5_a_quel_point_vous_sente_5",
        "label": "Sur une échelle de 1 à 5, à quel point vous sentez-vous stressé(e) actuellement ?",
        "type": "scale",
        "min": 0,
        "max": 5
      },
      {
        "id": "stress-academique_a_quelle_frequence_vous_sentez_vous_submerge_e_p_6",
        "label": "À quelle fréquence vous sentez-vous submergé(e) par vos responsabilités ou vos tâches quotidiennes ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "stress-academique_sur_une_echelle_de_1_a_5_comment_evalueriez_vous_7",
        "label": "Sur une échelle de 1 à 5, comment évalueriez-vous votre capacité à gérer le stress ?",
        "type": "scale",
        "min": 0,
        "max": 5
      },
      {
        "id": "stress-academique_au_cours_des_dernieres_semaines_avez_vous_ressen_8",
        "label": "Au cours des dernières semaines, avez-vous ressenti des symptômes physiques liés au stress (ex. : maux de tête, douleurs musculaires, fatigue) ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "stress-academique_sur_une_echelle_de_1_a_5_a_quel_point_ces_sympto_9",
        "label": "Sur une échelle de 1 à 5, à quel point ces symptômes physiques affectent-ils votre quotidien ?",
        "type": "scale",
        "min": 0,
        "max": 5
      },
      {
        "id": "stress-academique_ces_derniers_jours_a_quelle_frequence_avez_vous__10",
        "label": "Ces derniers jours, à quelle fréquence avez-vous ressenti des émotions négatives (ex. : anxiété, tristesse, irritabilité) ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "stress-academique_lorsque_vous_ressentez_ces_emotions_a_quel_point_11",
        "label": "Lorsque vous ressentez ces émotions, à quel point elles affectent-elles votre capacité à vous concentrer ou à étudier ?",
        "type": "single",
        "options": [
          "Pas du tout",
          "Peu",
          "Modérément",
          "Beaucoup",
          "Enormément"
        ]
      },
      {
        "id": "stress-academique_a_quelle_frequence_avez_vous_des_difficultes_a_v_12",
        "label": "À quelle fréquence avez-vous des difficultés à vous concentrer en classe ou pendant vos révisions à cause du stress ?",
        "type": "single",
        "options": [
          "Jamais",
          "Rarement",
          "Parfois",
          "Souvent",
          "Toujours"
        ]
      },
      {
        "id": "stress-academique_sur_une_echelle_de_1_a_5_comment_decririez_vous__13",
        "label": "Sur une échelle de 1 à 5, comment décririez-vous l’impact du stress sur votre mémoire et votre capacité d’apprentissage ?",
        "type": "scale",
        "min": 0,
        "max": 5
      },
      {
        "id": "stress-academique_quelles_strategies_utilisez_vous_actuellement_po_14",
        "label": "Quelles stratégies utilisez-vous actuellement pour gérer votre stress ? (Cochez toutes les réponses applicables)",
        "type": "single",
        "options": [
          "Sport ou exercice physique",
          "Parler à un proche ou à un professionnel",
          "Techniques de relaxation (ex. : respiration, méditation)",
          "Divertissements (ex. : jeux vidéo, films, etc.)",
          "Aucune stratégie particulière"
        ]
      },
      {
        "id": "stress-academique_sur_une_echelle_de_1_a_5_dans_quelle_mesure_ces__15",
        "label": "Sur une échelle de 1 à 5, dans quelle mesure ces stratégies sont-elles efficaces pour réduire votre stress ?",
        "type": "scale",
        "min": 0,
        "max": 5
      },
      {
        "id": "stress-academique_le_travail_scolaire_devoirs_examens_etc_16",
        "label": "Le travail scolaire (devoirs, examens, etc.)",
        "type": "checkbox",
        "options": [
          "Le travail scolaire (devoirs, examens, etc.)"
        ]
      },
      {
        "id": "stress-academique_le_travail_en_entreprise_ou_en_apprentissage_17",
        "label": "Le travail en entreprise ou en apprentissage",
        "type": "checkbox",
        "options": [
          "Le travail en entreprise ou en apprentissage"
        ]
      },
      {
        "id": "stress-academique_les_relations_sociales_amis_famille_18",
        "label": "Les relations sociales (amis, famille)",
        "type": "checkbox",
        "options": [
          "Les relations sociales (amis, famille)"
        ]
      },
      {
        "id": "stress-academique_incertitude_face_a_l_avenir_professionnel_19",
        "label": "Incertitude face à l'avenir professionnel",
        "type": "checkbox",
        "options": [
          "Incertitude face à l'avenir professionnel"
        ]
      },
      {
        "id": "stress-academique_problemes_personnels_ou_familiaux_20",
        "label": "Problèmes personnels ou familiaux",
        "type": "checkbox",
        "options": [
          "Problèmes personnels ou familiaux"
        ]
      },
      {
        "id": "stress-academique_sante_ou_bien_etre_physique_21",
        "label": "Santé ou bien-être physique",
        "type": "checkbox",
        "options": [
          "Santé ou bien-être physique"
        ]
      },
      {
        "id": "stress-academique_other_1_22",
        "label": "Précision (autre) #1",
        "type": "text"
      }
    ]
  },
  "metacognition": {
    "slug": "metacognition",
    "title": "Test de métacognition",
    "description": "Questionnaire importé depuis Typeform, désormais disponible dans le CRM.",
    "questions": [
      {
        "id": "metacognition_quel_cursus_suivez_vous_5",
        "label": "Quel cursus suivez-vous ?",
        "type": "text"
      },
      {
        "id": "metacognition_je_connais_mes_forces_et_faiblesses_dans_les_app_6",
        "label": "Je connais mes forces et faiblesses dans les apprentissages.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_sais_quel_type_d_information_est_importante_a_7",
        "label": "Je sais quel type d’information est importante à apprendre.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_sais_organiser_des_informations_8",
        "label": "Je sais organiser des informations.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_connais_les_attentes_de_l_enseignant_pour_mes_9",
        "label": "Je connais les attentes de l'enseignant pour mes apprentissages.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_memorise_bien_les_informations_10",
        "label": "Je mémorise bien les informations",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_sais_controler_la_qualite_de_mes_apprentissag_11",
        "label": "Je sais contrôler la qualité de mes apprentissages",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_sais_bien_juger_evaluer_la_qualite_de_ma_comp_12",
        "label": "Je sais bien juger/évaluer la qualité de ma compréhension",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_apprends_mieux_quand_le_sujet_m_interesse_13",
        "label": "J'apprends mieux quand le sujet m'intéresse",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_utilise_des_strategies_d_apprentissage_qui_ont_14",
        "label": "J'utilise des stratégies d'apprentissage qui ont déjà été efficaces pour moi",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_utilise_mes_strategies_d_apprentissage_dans_de_15",
        "label": "J'utilise mes stratégies d'apprentissage dans des buts précis",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_suis_conscient_e_des_strategies_que_j_utilise_16",
        "label": "Je suis conscient(e) des stratégies que j'utilise quand je révise.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_utilise_des_strategies_efficaces_et_utiles_spo_17",
        "label": "J'utilise des stratégies efficaces et utiles, spontanément/automatiquement.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_apprends_mieux_quand_j_ai_deja_des_connaissanc_18",
        "label": "J'apprends mieux quand j'ai déjà des connaissances sur le sujet (par exemple, si ton enseignant donne des exemples sur le football ou sur l'automobile).",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_utilise_des_strategies_d_apprentissage_differe_19",
        "label": "J'utilise des stratégies d'apprentissage différentes en fonction du contexte.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_arrive_a_me_motiver_a_travailler_quand_c_est_n_20",
        "label": "J'arrive à me motiver à travailler quand c'est nécessaire",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_utilise_mes_forces_pour_compenser_mes_faibless_21",
        "label": "J'utilise mes forces pour compenser mes faiblesses.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_sais_dans_quel_contexte_chacune_de_mes_strate_22",
        "label": "Je sais dans quel contexte chacune de mes stratégies est la plus effiace.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_surveille_le_temps_lorsque_j_apprends_pour_ne_23",
        "label": "Je surveille le temps lorsque j'apprends pour ne pas être débordé, pour finir à temps.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_reflechis_a_ce_que_j_ai_vraiment_besoin_d_app_24",
        "label": "Je réfléchis à ce que j'ai vraiment besoin d'apprendre avant de me mettre au travail.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_me_fixe_des_objectifs_avant_de_commencer_une__25",
        "label": "Je me fixe des objectifs avant de commencer une tâche.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_interroge_sur_le_materiel_necessaire_avant__26",
        "label": "Je m'interroge sur le matériel nécessaire avant de me mettre au travail.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_envisage_differentes_manieres_de_resoudre_le_p_27",
        "label": "J'envisage différentes manières de résoudre le problème avant de commencer.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_lis_attentivement_les_consignes_avant_de_me_m_28",
        "label": "Je lis attentivement les consignes avant de me mettre au travail.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_organise_mon_temps_afin_de_remplir_mes_objecti_29",
        "label": "J'organise mon temps afin de remplir mes objectifs",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_ralentis_lorsque_je_traite_des_informations_i_30",
        "label": "Je ralentis lorsque je traite des informations importantes",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_fais_un_effort_de_concentration_lorsque_je_tr_31",
        "label": "Je fais un effort de concentration lorsque je traite des informations importantes",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_me_concentre_sur_la_signification_et_la_compr_32",
        "label": "Je me concentre sur la signification et la compréhension des informations nouvelles",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_me_cree_des_exemples_pour_que_l_information_s_33",
        "label": "Je me crée des exemples pour que l'information soit plus parlante.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_effectue_des_schemas_ou_dessins_pour_m_aider_a_34",
        "label": "J'effectue des schémas ou dessins pour m'aider à comprendre mes leçons.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_essaie_de_traduire_les_informations_nouvelles__35",
        "label": "J'essaie de traduire les informations nouvelles avec mes propres mots.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_utilise_le_plan_du_texte_pour_m_aider_a_appren_36",
        "label": "J'utilise le plan du texte pour m'aider à apprendre.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_me_pose_la_question_de_savoir_si_ce_que_je_li_37",
        "label": "Je me pose la question de savoir si ce que je lis est en lien avec des choses que je connais déjà.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_divise_mes_taches_en_sous_taches_38",
        "label": "Je divise mes tâches en sous-tâches.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_me_concentre_sur_le_sens_global_d_un_contexte_39",
        "label": "Je me concentre sur le sens global d'un contexte plutôt sur sur les détails.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_demande_de_l_aide_quand_je_ne_comprends_pas_q_40",
        "label": "Je demande de l'aide quand je ne comprends pas quelque chose.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_change_de_strategie_si_je_n_y_arrive_pas_41",
        "label": "Je change de stratégie si je n'y arrive pas.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_reevalue_ma_comprehension_si_ma_comprehension_42",
        "label": "Je réévalue ma compréhension si ma compréhension n'est pas claire.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_arrete_et_retourne_en_arriere_si_une_inform_43",
        "label": "Je m'arrête et retourne en arrière si une information n'est pas claire.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_arrete_et_relis_si_je_comprends_pas_bien_un_44",
        "label": "Je m'arrête et relis si je comprends pas bien un texte.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_me_pose_regulierement_la_question_de_savoir_s_45",
        "label": "Je me pose régulièrement la question de savoir si je remplis mes objectifs.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_considere_plusieurs_reponses_a_un_probleme_av_46",
        "label": "Je considère plusieurs réponses à un problème avant de répondre.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_me_demande_si_j_ai_considere_toutes_les_optio_47",
        "label": "Je me demande si j'ai considéré toutes les options face à un problème.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_revois_ma_lecon_regulierement_pour_m_assurer__48",
        "label": "Je revois ma leçon régulièrement pour m'assurer d'avoir compris les liens entre les informations.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_j_analyse_en_cours_de_travail_l_efficacite_de_ma_49",
        "label": "J'analyse en cours de travail l'efficacité de ma stratégie de travail.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_fais_des_pauses_regulieres_pour_verifier_que__50",
        "label": "Je fais des pauses régulières pour vérifier que j'ai bien compris ma leçon.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_interroge_sur_l_efficacite_de_mon_apprentis_51",
        "label": "Je m'interroge sur l'efficacité de mon apprentissage lorsque j'apprends une nouvelle leçon.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_sais_si_j_ai_reussi_ou_non_a_l_issue_d_un_con_52",
        "label": "Je sais si j'ai réussi ou non à l'issue d'un contrôle.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_interroge_sur_le_fait_de_savoir_s_il_y_avai_53",
        "label": "Je m'interroge sur le fait de savoir s'il y avait un moyen plus efficace pour résoudre la tâche.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_resume_ce_que_je_viens_de_terminer_d_apprendr_54",
        "label": "Je résume ce que je viens de terminer/d'apprendre.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_interroge_pour_savoir_verifier_si_j_ai_bien_55",
        "label": "Je m'interroge pour savoir/vérifier si j'ai bien rempli mes objectifs.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_interroge_pour_savoir_verifier_si_j_avais_b_56",
        "label": "Je m'interroge pour savoir/vérifier si j'avais bien envisagé toutes les options face à un problème.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      },
      {
        "id": "metacognition_je_m_interroge_pour_savoir_verifier_si_j_ai_appr_57",
        "label": "Je m'interroge pour savoir/vérifier si j'ai appris/travaillé autant que j'aurai pu.",
        "type": "boolean",
        "options": [
          "0",
          "1"
        ]
      }
    ]
  }
} ;

export const JESSICA_QUESTIONNAIRE_SLUGS = ["situation-enfant","tdah","pre-diagnostic-dys","stress-academique","metacognition"] as const;

export type JessicaQuestionnaireSlug = (typeof JESSICA_QUESTIONNAIRE_SLUGS)[number];

export function getJessicaQuestionnaire(slug: string): JessicaQuestionnaireDef | null {
  return JESSICA_QUESTIONNAIRES[slug] ?? null;
}
