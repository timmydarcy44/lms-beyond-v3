export const GOOGLE_RATING = "5,0";
export const GOOGLE_REVIEW_COUNT = 22;

/** Lien public vers les avis Google du cabinet. */
export const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/search/?api=1&query=Jessica+Contentin+psychop%C3%A9dagogue+Bretteville-sur-Odon";

export type JessicaGoogleReview = {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
};

/**
 * Avis mis en avant sur l’accueil (ordre = priorité d’affichage).
 * Le premier avis est volontairement le plus récent / le plus convaincant.
 */
export const JESSICA_FEATURED_REVIEWS: JessicaGoogleReview[] = [
  {
    author_name: "Camille",
    rating: 5,
    relative_time_description: "Il y a quelques jours",
    text: "Je suis très contente d'être accompagnée par Jessica. Dès la première séance, je me suis sentie de suite en confiance, écoutée, comprise et épaulée. Son accompagnement m'aide vraiment à avancer et à mieux comprendre mon fonctionnement. Les séances sont bienveillantes et concrètes, et je sens une évolution positive. Je recommande vivement.",
  },
  {
    author_name: "Elisa",
    rating: 5,
    relative_time_description: "Il y a quelques jours",
    text: "Très bon accompagnement, Jessica s'adapte à notre rythme et nous propose plusieurs options afin de voir ce qui pourrait le mieux nous aider. Je recommande fortement !",
  },
  {
    author_name: "Naomi Tasserie",
    rating: 5,
    relative_time_description: "Récemment",
    text: "Personne très à l'écoute et attentive à nos besoins, elle m'aide très régulièrement et je lui en remercie beaucoup pour ça :)",
  },
  {
    author_name: "Sandy Ritz",
    rating: 5,
    relative_time_description: "Il y a 6 mois",
    text: "Nous avons consulté Mme Contentin pour un bilan de suspicion TDAH pour notre enfant, et nous avons été pleinement rassurés et satisfaits par son accompagnement. C'est une professionnelle bienveillante, douce et très à l'écoute, qui a su créer un lien de confiance dès la première séance. Notre enfant s'est senti en sécurité et compris, ce qui a grandement facilité les échanges. Le lieu est chaleureux, apaisant, et contribue à mettre à l'aise. Une très belle rencontre que nous recommandons les yeux fermés.",
  },
  {
    author_name: "Aline Haley",
    rating: 5,
    relative_time_description: "Il y a 11 mois",
    text: "Je recommande fortement Jessica, très à l'écoute et super douce avec les enfants. Mon fils est à sa 4ème séance et cela lui fait déjà un bien incroyable ! Il va à ces séances avec plaisir !",
  },
  {
    author_name: "Cassandra",
    rating: 5,
    relative_time_description: "Il y a 10 mois",
    text: "Jessica est une professionnelle exceptionnelle, bienveillante et à l'écoute. Elle sait créer un espace de confiance où l'on se sent écouté et compris. Ses conseils sont adaptés et efficaces. Grâce à ses séances, j'ai pu mieux comprendre mes émotions, progresser et trouver des solutions concrètes. Je la recommande sans hésitation.",
  },
  {
    author_name: "Jade Letellier",
    rating: 5,
    relative_time_description: "Il y a 5 mois",
    text: "Bon accompagnement. Une personne géniale ! Je la conseille à 100%.",
  },
  {
    author_name: "Clémentine Caindry",
    rating: 5,
    relative_time_description: "Il y a 11 mois",
    text: "Vraiment super ! Très bonne approche psychologique et pédagogique, m'aide beaucoup pour ma scolarité en ligne.",
  },
];
