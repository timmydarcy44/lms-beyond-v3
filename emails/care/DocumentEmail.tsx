import { CareMessage } from "./CareMessage";

export type DocumentEmailProps = {
  preheader: string;
  firstName: string;
  intro: string;
  spaceUrl: string;
};

export function DocumentEmail(props: DocumentEmailProps) {
  return (
    <CareMessage
      preheader={props.preheader}
      badge="document"
      firstName={props.firstName}
      title="Un document vous attend"
      intro={props.intro}
      buttons={[{ href: props.spaceUrl, label: "Ouvrir mon espace", tone: "primary" }]}
    />
  );
}

DocumentEmail.PreviewProps = {
  preheader: "Timmy Darcy a ajouté un document dans votre espace Byound Care.",
  firstName: "Jennifer",
  intro: "Timmy Darcy a ajouté un document dans votre espace Byound Care.",
  spaceUrl: "https://byoundcare.fr/dashboard/patient/documents",
} satisfies DocumentEmailProps;

export default DocumentEmail;
