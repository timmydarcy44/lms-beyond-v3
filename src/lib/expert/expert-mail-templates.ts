export type ExpertMailTemplate = {
  id: string;
  label: string;
  subject: string;
  title: string;
  message: string;
};

export const EXPERT_MAIL_TEMPLATES: ExpertMailTemplate[] = [
  {
    id: "photo",
    label: "Demande de photo",
    subject: "Votre photo pour la page Byound",
    title: "Ajoutez votre photo",
    message:
      "Bonjour {prenom},\n\nVotre fiche est presque complète. Il manque votre photo pour apparaître sur le site.\n\nVous pouvez l'ajouter depuis votre espace : {lien_espace}",
  },
  {
    id: "documents",
    label: "Demande de documents",
    subject: "Vos documents pour Byound",
    title: "Documents à transmettre",
    message:
      "Bonjour {prenom},\n\nNous n'avons pas encore reçu l'ensemble de vos documents : CV, diplômes, attestations, pièces administratives.\n\nVous pouvez les déposer ici : {lien_espace}",
  },
  {
    id: "accord",
    label: "Accord pour apparaître sur le site",
    subject: "Apparaître sur la page d'accueil Byound",
    title: "Votre accord",
    message:
      "Bonjour {prenom},\n\nSouhaitez-vous apparaître sur la page d'accueil de Byound ? Une photo est aussi nécessaire.\n\nVotre espace : {lien_espace}",
  },
  {
    id: "mission",
    label: "Proposition de mission",
    subject: "Une mission avec Byound",
    title: "Proposition",
    message: "Bonjour {prenom},\n\nNous souhaitons vous proposer une mission.\n\nVotre espace : {lien_espace}",
  },
  {
    id: "certified",
    label: "Suite à votre demande Byound Certified",
    subject: "Votre demande Byound Certified",
    title: "Byound Certified",
    message:
      "Bonjour {prenom},\n\nNous revenons vers vous au sujet de votre demande Byound Certified.\n\nVotre espace : {lien_espace}",
  },
];

export function fillExpertMail(text: string, variables: Record<string, string>): string {
  return text.replace(/\{([a-z0-9_]+)\}/gi, (_, key: string) => variables[key] ?? "");
}
