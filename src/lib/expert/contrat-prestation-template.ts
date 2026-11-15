/**
 * Contrat de prestation / sous-traitance pédagogique uniformisé (Qualiopi ind. 27).
 * Texte type à personnaliser (OF + intervenant) puis à faire signer.
 */

export type ContratPrestationParts = {
  ofLegalName: string;
  ofNda: string | null;
  ofSiret: string | null;
  ofAddress: string | null;
  expertName: string;
  expertEmail: string | null;
  employmentStatusLabel: string;
  signedAt: string | null;
  endsAt: string | null;
};

export function buildContratPrestationMarkdown(p: ContratPrestationParts): string {
  const of = p.ofLegalName.trim() || "[Raison sociale OF]";
  const expert = p.expertName.trim() || "[Nom intervenant]";
  const today = new Date().toLocaleDateString("fr-FR");

  return `# Contrat de prestation de formation — sous-traitance pédagogique

**Organisme de formation (donneur d’ordre)** : ${of}
${p.ofNda ? `**NDA** : ${p.ofNda}` : ""}
${p.ofSiret ? `**SIRET** : ${p.ofSiret}` : ""}
${p.ofAddress ? `**Siège** : ${p.ofAddress}` : ""}

**Intervenant (sous-traitant)** : ${expert}
${p.expertEmail ? `**Email** : ${p.expertEmail}` : ""}
**Statut** : ${p.employmentStatusLabel}

**Date du contrat** : ${p.signedAt ?? today}
${p.endsAt ? `**Fin de validité** : ${p.endsAt}` : "**Fin de validité** : durée indéterminée / par mission"}

---

## 1. Objet

Le présent contrat a pour objet de confier à l’Intervenant, en qualité de sous-traitant pédagogique, la conception et/ou l’animation de prestations de formation professionnelle continue pour le compte de l’Organisme, dans le respect du référentiel national qualité (Qualiopi) et de la réglementation applicable.

## 2. Périmètre des missions

Les missions portent notamment sur :
- l’animation de sessions (présentiel, distanciel ou mixte) ;
- la préparation pédagogique et l’adaptation au public ;
- l’évaluation des acquis et le reporting attendu par l’Organisme ;
- le respect des consignes d’émargement, de confidentialité et d’accessibilité.

Chaque mission concrète peut être précisée par un bon de commande / ordre de mission (dates, lieu, public, tarif).

## 3. Obligations de l’Intervenant

L’Intervenant s’engage à :
1. disposer des compétences, titres et expériences nécessaires à la mission ;
2. respecter le programme, les objectifs pédagogiques et les modalités convenus ;
3. assurer un suivi des stagiaires cohérent avec les outils de l’Organisme (LMS, émargement, évaluations) ;
4. signaler sans délai tout incident, réclamation, risque ou besoin d’aménagement (dont handicap) ;
5. ne pas sous-traiter tout ou partie de la mission sans accord écrit de l’Organisme ;
6. conserver une attitude professionnelle et respecter le règlement intérieur applicable aux actions de formation.

## 4. Engagement qualité (Qualiopi)

L’Intervenant s’engage à respecter le référentiel national qualité applicable à l’Organisme (indicateurs relatifs à la conception, à la mise en œuvre, au suivi et à l’amélioration continue), ainsi que les procédures internes communiquées (réclamations, signalements sensibles, handicap, sous-traitance).

L’Organisme reste responsable de la conformité globale de la prestation ; l’Intervenant coopère à la production des preuves demandées (CV, attestations, supports, bilans).

## 5. Obligations de l’Organisme

L’Organisme s’engage à :
- transmettre les informations nécessaires (public, objectifs, contraintes, accessibilité) ;
- fournir les accès outils / plateformes requis ;
- régler la rémunération selon les conditions convenues ;
- informer l’Intervenant des procédures qualité et des canaux de signalement.

## 6. Rémunération et frais

La rémunération et les frais éventuels sont définis par mission (taux journalier / forfait) dans le bon de commande. Sauf mention contraire, l’Intervenant facture l’Organisme après réalisation, sur présentation d’une facture conforme.

## 7. Confidentialité et données

L’Intervenant traite les données personnelles des stagiaires uniquement pour les besoins de la mission, selon les instructions de l’Organisme, et s’interdit toute réutilisation commerciale. Les supports et listes restent confidentiels.

## 8. Responsabilité et assurance

L’Intervenant déclare disposer d’une assurance responsabilité civile professionnelle adaptée. Il reste responsable de ses actes professionnels dans le cadre de la mission.

## 9. Durée, résiliation

Le contrat prend effet à la date indiquée ci-dessus. Il peut être résilié par écrit avec un préavis raisonnable, ou immédiatement en cas de manquement grave (sécurité, discrimination, non-respect Qualiopi, abandon de mission).

## 10. Loi applicable

Droit français. Litiges : juridiction du siège de l’Organisme, après tentative de règlement amiable.

---

**Signatures**

Pour l’Organisme — Nom / fonction / date / signature :

………………………………………………………………

Pour l’Intervenant — Nom / date / signature :

………………………………………………………………

*Document type Byound — à adapter juridiquement si besoin avant signature définitive.*
`;
}

export function contratPrestationFilename(expertName: string): string {
  const slug = expertName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 40);
  const day = new Date().toISOString().slice(0, 10);
  return `${day}_contrat-prestation-${slug || "intervenant"}.md`;
}
