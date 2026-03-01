export type SoftSkillDefinition = {
  id: number;
  titre: string;
  description: string;
  questions: string[];
};

export type SoftSkillQuestion = {
  id: string;
  compId: number;
  skill: string;
  text: string;
};

export const SOFT_SKILLS: SoftSkillDefinition[] = [
  {
    id: 1,
    titre: "Communication interpersonnelle",
    description: "Transmettre ses idées clairement et adapter son discours selon son interlocuteur.",
    questions: [
      "Tu expliques quelque chose de complexe à quelqu'un qui ne connaît pas le sujet. Dans quelle mesure trouves-tu spontanément des exemples simples pour le rendre accessible ?",
      "Un proche te dit qu'il n'a pas compris ce que tu voulais dire. Dans quelle mesure remets-tu en question ta façon d'expliquer plutôt que de répéter la même chose ?",
      "Tu dois annoncer une nouvelle délicate à quelqu'un. Dans quelle mesure adaptes-tu ton ton et tes mots pour que le message soit bien reçu ?",
    ],
  },
  {
    id: 2,
    titre: "Écoute active",
    description: "Se concentrer pleinement sur son interlocuteur et s'assurer de bien comprendre ce qu'il exprime.",
    questions: [
      "Quelqu'un te parle de quelque chose qui l'affecte. Dans quelle mesure te concentres-tu entièrement sur ses paroles sans penser à ta réponse pendant qu'il parle ?",
      "Tu réalises que tu n'as pas bien compris ce que quelqu'un vient de te dire. À quel point poses-tu des questions pour clarifier avant de répondre ?",
      "Après une explication importante, dans quelle mesure reformules-tu ce que tu as compris pour t'assurer que c'est juste ?",
    ],
  },
  {
    id: 3,
    titre: "Empathie",
    description: "Se mettre à la place des autres et adapter son comportement en fonction de ce qu'ils ressentent.",
    questions: [
      "Un proche semble triste mais ne dit rien. Dans quelle mesure perçois-tu ce changement d'humeur et cherches-tu à comprendre ce qu'il ressent ?",
      "Quelqu'un te parle d'une difficulté que tu n'as jamais vécue. À quel point arrives-tu à te mettre sincèrement à sa place pour comprendre ce qu'il traverse ?",
      "Tu remarques qu'une personne est mal à l'aise dans une conversation. Dans quelle mesure ajustes-tu ce que tu dis pour qu'elle se sente mieux ?",
    ],
  },
  {
    id: 4,
    titre: "Gestion des conflits",
    description: "Désamorcer les tensions, écouter toutes les parties et trouver des résolutions constructives.",
    questions: [
      "Deux personnes de ton entourage se disputent et te prennent à témoin. Dans quelle mesure restes-tu calme et cherches-tu à les aider à se réconcilier ?",
      "Quelqu'un t'exprime un désaccord fort. À quel point prends-tu le temps d'écouter son point de vue avant de défendre le tien ?",
      "Tu réalises que tu as eu tort dans une dispute. Dans quelle mesure es-tu capable de le reconnaître ouvertement pour apaiser la situation ?",
    ],
  },
  {
    id: 5,
    titre: "Leadership",
    description: "Inspirer et guider les autres vers un objectif commun, même sans autorité formelle.",
    questions: [
      "Un groupe hésite sur la direction à prendre. Dans quelle mesure prends-tu l'initiative de proposer une voie et d'embarquer les autres ?",
      "Quelqu'un dans ton entourage perd confiance en lui. À quel point cherches-tu activement les bons mots pour le remotiver ?",
      "Une activité collective tourne mal et tu en étais responsable. Dans quelle mesure assumes-tu cette responsabilité clairement face au groupe ?",
    ],
  },
  {
    id: 6,
    titre: "Collaboration et travail en équipe",
    description: "Coopérer efficacement avec des personnes aux profils variés en mettant le collectif avant l'individuel.",
    questions: [
      "Tu travailles avec des personnes qui ont des styles très différents du tien. Dans quelle mesure t'adaptes-tu à ces différences pour avancer ensemble ?",
      "Lors d'une décision collective, ta proposition n'est pas retenue. À quel point joues-tu pleinement le jeu du choix collectif sans te braquer ?",
      "Quelqu'un dans le groupe brille sur un sujet qui t'intéresse aussi. Dans quelle mesure lui laisses-tu l'espace de s'exprimer sans chercher à prendre sa place ?",
    ],
  },
  {
    id: 7,
    titre: "Adaptabilité",
    description: "Ajuster son comportement et ses plans face aux changements et aux imprévus.",
    questions: [
      "Un projet sur lequel tu travailles change complètement de direction. À quel point t'ajustes-tu aux nouvelles attentes sans bloquer sur l'ancienne vision ?",
      "On te montre une nouvelle façon de faire quelque chose que tu faisais à ta manière depuis longtemps. Dans quelle mesure accueilles-tu ce changement avec ouverture ?",
      "Une situation devient chaotique et imprévisible. Dans quelle mesure gardes-tu ton calme et continues-tu à avancer malgré l'incertitude ?",
    ],
  },
  {
    id: 8,
    titre: "Gestion du stress",
    description: "Maintenir son efficacité et son équilibre face à la pression et aux situations incertaines.",
    questions: [
      "Tu as une échéance importante dans très peu de temps. Dans quelle mesure restes-tu concentré(e) et efficace malgré la pression ?",
      "Tu es sous pression depuis plusieurs jours. Dans quelle mesure sais-tu récupérer pour tenir sur la durée sans t'épuiser ?",
      "Quelque chose ne se passe pas comme prévu à un moment crucial. À quel point gardes-tu ton sang-froid pour trouver une solution ?",
    ],
  },
  {
    id: 9,
    titre: "Intelligence émotionnelle",
    description: "Identifier, comprendre et réguler ses propres émotions ainsi que celles des autres.",
    questions: [
      "Tu ressens une émotion forte qui pourrait influencer une décision importante. Dans quelle mesure l'identifies-tu clairement avant d'agir ?",
      "Tu es dans une conversation tendue et tu sens la frustration monter en toi. Dans quelle mesure gères-tu cette émotion pour éviter de dire quelque chose que tu regretterais ?",
      "Après une réaction émotionnelle forte, dans quelle mesure prends-tu du recul pour comprendre ce qui s'est passé en toi ?",
    ],
  },
  {
    id: 10,
    titre: "Confiance en soi",
    description: "Croire en ses propres compétences et agir avec assurance même dans l'incertitude.",
    questions: [
      "Tu dois prendre la parole devant un groupe que tu ne connais pas bien. Dans quelle mesure te sens-tu à l'aise pour t'exprimer sans te déstabiliser ?",
      "Quelqu'un remet en question ton idée ou ta compétence devant d'autres. À quel point défends-tu ton point de vue avec calme et assurance ?",
      "Tu dois prendre une décision importante sans pouvoir consulter quelqu'un. Dans quelle mesure fais-tu confiance à ton propre jugement ?",
    ],
  },
  {
    id: 11,
    titre: "Résolution des problèmes",
    description: "Analyser une situation complexe, identifier des solutions et agir efficacement même sous pression.",
    questions: [
      "Tu fais face à un problème que tu n'as jamais rencontré. Dans quelle mesure décomposes-tu la situation en étapes pour mieux l'appréhender ?",
      "Tu es en train de faire quelque chose et il te manque une ressource clé. À quel point trouves-tu une alternative sans abandonner la tâche ?",
      "Plusieurs problèmes arrivent en même temps. Dans quelle mesure sais-tu les prioriser et les traiter un par un sans te paralyser ?",
    ],
  },
  {
    id: 12,
    titre: "Prise de décision",
    description: "Analyser les options disponibles, gérer l'incertitude et trancher avec discernement.",
    questions: [
      "Tu dois choisir entre plusieurs options et chacune a des avantages. Dans quelle mesure arrives-tu à trancher sans t'éterniser ?",
      "Une décision comporte des risques et l'issue est incertaine. Dans quelle mesure es-tu capable d'assumer cette incertitude et d'avancer quand même ?",
      "Une décision urgente s'impose et tu n'as pas le temps de tout analyser. Dans quelle mesure fais-tu confiance à ton intuition dans ces moments-là ?",
    ],
  },
  {
    id: 13,
    titre: "Gestion du temps",
    description: "Organiser ses activités, prioriser efficacement et maintenir sa productivité face aux imprévus.",
    questions: [
      "Tu sais que la semaine prochaine sera chargée. Dans quelle mesure planifies-tu à l'avance pour éviter d'être débordé(e) ?",
      "Tu travailles sur quelque chose d'important et les distractions s'accumulent. Dans quelle mesure maintiens-tu ta concentration ?",
      "Ta journée est organisée mais une urgence surgit. Dans quelle mesure réorganises-tu tes priorités rapidement sans te déstabiliser ?",
    ],
  },
  {
    id: 14,
    titre: "Persévérance",
    description: "Maintenir ses efforts dans le temps face aux obstacles, aux échecs et aux moments de découragement.",
    questions: [
      "Tu rates quelque chose que tu voulais vraiment réussir. Dans quelle mesure réessaies-tu en tirant des leçons de cet échec ?",
      "Tu travailles sur un objectif qui demande du temps et peu de résultats visibles à court terme. À quel point maintiens-tu ta motivation sur la durée ?",
      "Quelqu'un te décourage de poursuivre quelque chose en quoi tu crois. Dans quelle mesure gardes-tu le cap malgré les avis négatifs ?",
    ],
  },
  {
    id: 15,
    titre: "Esprit critique",
    description: "Analyser l'information de manière rigoureuse, identifier les biais et former des jugements fondés.",
    questions: [
      "Tu lis une information surprenante en ligne. Dans quelle mesure vérifies-tu la source et cherches-tu d'autres points de vue avant de la croire ?",
      "Lors d'une discussion, quelqu'un fait une affirmation tranchée. À quel point demandes-tu des preuves ou des précisions avant de te forger un avis ?",
      "Tu dois prendre une décision importante. Dans quelle mesure compares-tu objectivement les options plutôt que de te fier à ta première impression ?",
    ],
  },
  {
    id: 16,
    titre: "Créativité",
    description: "Générer des idées originales, trouver des approches inédites et voir les problèmes sous un angle nouveau.",
    questions: [
      "Tu dois résoudre un problème pratique avec des ressources limitées. Dans quelle mesure inventes-tu une solution originale plutôt que de chercher la réponse classique ?",
      "Tu es face à un obstacle que tu ne peux pas contourner de façon habituelle. À quel point explores-tu des approches alternatives ?",
      "On te demande d'améliorer quelque chose qui fonctionne déjà. Dans quelle mesure cherches-tu quand même à l'optimiser ou à le réinventer ?",
    ],
  },
  {
    id: 17,
    titre: "Proactivité",
    description: "Anticiper les besoins, agir sans attendre et saisir les opportunités avant qu'elles ne s'imposent.",
    questions: [
      "Tu identifies un problème avant que quelqu'un d'autre ne le remarque. Dans quelle mesure proposes-tu une solution sans attendre qu'on te le demande ?",
      "Tu travailles sur un projet et tu vois une façon de l'améliorer qui ne t'a pas été demandée. Dans quelle mesure prends-tu l'initiative de la proposer ?",
      "Tu anticipes qu'une situation va devenir problématique. Dans quelle mesure agis-tu en amont pour éviter que le problème ne se concrétise ?",
    ],
  },
  {
    id: 18,
    titre: "Sens de l'organisation",
    description: "Structurer ses activités, gérer ses ressources et créer un environnement propice à l'efficacité.",
    questions: [
      "Tu as plusieurs tâches à accomplir dans un délai serré. Dans quelle mesure planifies-tu leur ordre pour maximiser ton efficacité ?",
      "Tu dois coordonner plusieurs personnes sur une tâche commune. Dans quelle mesure définis-tu clairement qui fait quoi et quand ?",
      "Une journée bien planifiée est perturbée par des imprévus. Dans quelle mesure retrouves-tu rapidement une structure pour terminer ce qui était prévu ?",
    ],
  },
  {
    id: 19,
    titre: "Ouverture d'esprit",
    description: "Accueillir de nouvelles idées, remettre en question ses certitudes et considérer des points de vue différents.",
    questions: [
      "Quelqu'un te présente une idée qui va à l'encontre de ce que tu penses. Dans quelle mesure l'explores-tu sincèrement avant de la rejeter ?",
      "On te propose un feedback sur quelque chose que tu fais depuis longtemps. À quel point l'accueilles-tu sans te braquer ?",
      "Une croyance que tu avais est remise en question par des faits nouveaux. Dans quelle mesure es-tu prêt(e) à réviser ta position ?",
    ],
  },
  {
    id: 20,
    titre: "Sens des responsabilités",
    description: "S'engager sur ses promesses, assumer ses erreurs et se montrer fiable pour les autres.",
    questions: [
      "Tu t'es engagé(e) à faire quelque chose mais tu réalises que tu ne pourras pas le faire dans les temps. Dans quelle mesure le signales-tu à temps plutôt que d'attendre ?",
      "Tu commets une erreur qui a un impact sur quelqu'un d'autre. À quel point l'assumes-tu clairement sans minimiser ou reporter la faute ?",
      "Quelqu'un compte sur toi pour quelque chose d'important. Dans quelle mesure cette confiance t'engage-t-elle à donner le meilleur de toi-même ?",
    ],
  },
];

export const SOFT_SKILLS_QUESTIONS: SoftSkillQuestion[] = SOFT_SKILLS.flatMap((skill) =>
  skill.questions.map((text, index) => ({
    id: `${skill.id}_${index + 1}`,
    compId: skill.id,
    skill: skill.titre,
    text,
  })),
);
