export type JadeDemoPage = {
  title: string;
  kicker: string;
  tone: "dark" | "light";
  chrome: "content" | "expert" | "entreprise" | "club" | "partenaire" | "student" | "tuteur";
  stats: Array<{ label: string; value: string }>;
  columns: string[];
  rows: Array<{ href?: string; cells: string[] }>;
};

const EXACT_REAL = new Set([
  "/dashboard/salarie",
  "/dashboard/salarie/profil",
  "/dashboard/salarie/formations",
  "/dashboard/salarie/competences",
  "/dashboard/salarie/accompagnement",
  "/dashboard/salarie/coachings",
  "/dashboard/salarie/partage-entreprise",
  "/dashboard/apprenant",
  "/dashboard/apprenant/profil",
  "/dashboard/apprenant/formations",
  "/dashboard/apprenant/matching",
  "/dashboard/apprenant/partage-entreprise",
  "/dashboard/formateur",
  "/dashboard/ecole",
  "/dashboard/expert",
  "/dashboard/entreprise",
  "/dashboard/entreprise/metiers",
  "/dashboard/entreprise/messages",
  "/dashboard/entreprise/statistiques",
  "/dashboard/entreprise/equipe-insight",
  "/dashboard/club",
  "/dashboard/partenaire",
  "/dashboard/tuteur",
  "/dashboard/tuteur/alternants",
  "/dashboard/tuteur/missions",
  "/dashboard/tuteur/formulaires",
]);

const PREFIX_REAL = [
  "/dashboard/praticien",
  "/dashboard/apprenant/skills",
  "/dashboard/apprenant/planning",
  "/dashboard/entreprise/salaries",
  "/dashboard/entreprise/besoins-competences",
  "/dashboard/entreprise/offres",
  "/dashboard/entreprise/recrutement",
  "/dashboard/entreprise/formations/creer",
  "/dashboard/entreprise/formations/gerer",
  "/dashboard/salarie/formations",
  "/dashboard/tuteur",
];

function keepsRealPage(path: string) {
  if (EXACT_REAL.has(path)) return true;
  if (PREFIX_REAL.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return true;
  return path.split("/").some(
    (part) => part === "new" || part === "creer" || part === "edit" || part === "intro" || part.startsWith("test-"),
  );
}

function spaceOf(path: string) {
  const spaces = ["salarie", "apprenant", "formateur", "ecole", "expert", "entreprise", "student", "club", "partenaire", "tuteur"] as const;
  return spaces.find((space) => path === `/dashboard/${space}` || path.startsWith(`/dashboard/${space}/`)) ?? null;
}

function toneOf(space: string): JadeDemoPage["tone"] {
  return space === "ecole" || space === "student" || space === "tuteur" ? "light" : "dark";
}

function chromeOf(space: string): JadeDemoPage["chrome"] {
  if (space === "expert" || space === "entreprise" || space === "club" || space === "partenaire" || space === "student" || space === "tuteur") return space;
  return "content";
}

function ahead(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

type Row = { href?: string; cells: string[] };

function page(space: string, title: string, kicker: string, stats: Array<[string, string]>, columns: string[], rows: Row[]): JadeDemoPage {
  return {
    title,
    kicker,
    tone: toneOf(space),
    chrome: chromeOf(space),
    stats: stats.map(([label, value]) => ({ label, value })),
    columns,
    rows,
  };
}

const PAGES: Record<string, JadeDemoPage> = {
  "/dashboard/formateur/planning": page("formateur", "Planning", "Espace formateur", [["Séances", "8"], ["Apprenants", "24"], ["Heures", "18 h"]], ["Séance", "Classe", "Horaire", "Statut"], [
    { cells: ["Prospection B2B", "NTC AI Business", "Aujourd'hui · 9 h", "Confirmée"] },
    { cells: ["CRM", "Salle 2", "Demain · 14 h", "Confirmée"] },
    { cells: ["Plan d'actions", "NTC Business Sport", "Dans 3 jours · 9 h", "À préparer"] },
  ]),
  "/dashboard/formateur/formations": page("formateur", "Mes cours", "Espace formateur", [["Cours", "4"], ["Publiés", "3"], ["Brouillons", "1"]], ["Cours", "Classe", "Avancement", "Statut"], [
    { href: "/dashboard/formateur/formations/ccp1", cells: ["CCP1 — Stratégie de prospection", "NTC AI Business", "62 %", "Publié"] },
    { href: "/dashboard/formateur/formations/ntc-ai", cells: ["NTC AI Business", "Promo 2026", "40 %", "Publié"] },
    { href: "/dashboard/formateur/formations/nego", cells: ["Négociation commerciale", "NTC Business Sport", "18 %", "Brouillon"] },
  ]),
  "/dashboard/formateur/parcours": page("formateur", "Parcours", "Espace formateur", [["Parcours", "3"], ["Inscrits", "38"], ["Actifs", "2"]], ["Parcours", "Public", "Modules", "Statut"], [
    { cells: ["Prospection → closing", "NTC AI Business", "6", "En cours"] },
    { cells: ["CRM commercial", "Promo 2026", "4", "En cours"] },
  ]),
  "/dashboard/formateur/cahier-de-texte": page("formateur", "Cahier de texte", "Espace formateur", [["Journaux", "3"], ["À valider", "2"], ["Signés", "1"]], ["Apprenant", "Séance", "Date", "Statut"], [
    { cells: ["Léa Bernard", "Prospection B2B", "Aujourd'hui", "À valider"] },
    { cells: ["Hugo Martin", "CRM", "Hier", "À valider"] },
    { cells: ["Inès Morel", "Plan d'actions", "Lundi", "Signé"] },
  ]),
  "/dashboard/formateur/emargement": page("formateur", "Émargement", "Espace formateur", [["Présents", "12"], ["Absents", "1"], ["En attente", "2"]], ["Apprenant", "Séance", "Heure", "Statut"], [
    { cells: ["Léa Bernard", "Prospection B2B", "9 h 02", "Présente"] },
    { cells: ["Hugo Martin", "Prospection B2B", "9 h 05", "Présent"] },
    { cells: ["Noah Petit", "Prospection B2B", "—", "Absent"] },
  ]),
  "/dashboard/formateur/ressources": page("formateur", "Ressources", "Espace formateur", [["Fichiers", "9"], ["Partagés", "6"], ["Récents", "2"]], ["Ressource", "Cours", "Type", "Statut"], [
    { cells: ["Script d'appel", "Prospection B2B", "PDF", "Partagé"] },
    { cells: ["Grille CRM", "CRM", "Tableur", "Partagé"] },
  ]),
  "/dashboard/formateur/drive": page("formateur", "Drive", "Espace formateur", [["Documents", "14"], ["Dossiers", "4"], ["Cette semaine", "3"]], ["Document", "Dossier", "Mis à jour", "Accès"], [
    { cells: ["Convention NTC", "Administratif", "Hier", "École"] },
    { cells: ["Support prospection", "Cours", "Aujourd'hui", "Classe"] },
  ]),
  "/dashboard/formateur/tests": page("formateur", "Tests", "Espace formateur", [["Tests", "3"], ["Réponses", "41"], ["À corriger", "4"]], ["Test", "Cours", "Réponses", "Statut"], [
    { cells: ["Quiz prospection", "CCP1", "22", "Ouvert"] },
    { cells: ["Closing", "Négociation", "4", "À corriger"] },
  ]),
  "/dashboard/formateur/todo": page("formateur", "To-do", "Espace formateur", [["À faire", "5"], ["Aujourd'hui", "2"], ["En retard", "1"]], ["Tâche", "Lié à", "Échéance", "Statut"], [
    { cells: ["Valider le journal de Léa", "Cahier de texte", "Aujourd'hui", "À faire"] },
    { cells: ["Relancer Noah", "Absence", "Hier", "En retard"] },
  ]),
  "/dashboard/formateur/apprenants": page("formateur", "Mes apprenants", "Espace formateur", [["Apprenants", "24"], ["Actifs", "22"], ["À suivre", "2"]], ["Apprenant", "Classe", "Progression", "Statut"], [
    { href: "/dashboard/formateur/apprenants/lea-bernard", cells: ["Léa Bernard", "NTC AI Business", "71 %", "En cours"] },
    { href: "/dashboard/formateur/apprenants/hugo-martin", cells: ["Hugo Martin", "NTC AI Business", "54 %", "En cours"] },
    { href: "/dashboard/formateur/apprenants/noah-petit", cells: ["Noah Petit", "NTC Business Sport", "33 %", "À relancer"] },
  ]),
  "/dashboard/ecole/apprenants": page("ecole", "Apprenants", "CFA Byound", [["Effectif", "86"], ["Alternances", "61"], ["En recherche", "9"]], ["Apprenant", "Formation", "Entreprise", "Statut"], [
    { href: "/dashboard/ecole/apprenants/lea-bernard", cells: ["Léa Bernard", "NTC AI Business", "Byound Business", "En poste"] },
    { href: "/dashboard/ecole/apprenants/hugo-martin", cells: ["Hugo Martin", "NTC AI Business", "NTC Partners", "En poste"] },
    { href: "/dashboard/ecole/apprenants/ines-morel", cells: ["Inès Morel", "NTC Business Sport", "—", "En recherche"] },
  ]),
  "/dashboard/ecole/classes": page("ecole", "Classes", "CFA Byound", [["Classes", "5"], ["Inscrits", "86"], ["Complètes", "3"]], ["Classe", "Formation", "Effectif", "Statut"], [
    { cells: ["NTC AI Business", "Négociation", "22", "Ouverte"] },
    { cells: ["NTC Business Sport", "Développement", "16", "Ouverte"] },
  ]),
  "/dashboard/ecole/entreprises": page("ecole", "Entreprises partenaires", "CFA Byound", [["Entreprises", "18"], ["Actives", "14"], ["Offres", "7"]], ["Entreprise", "Ville", "Alternants", "Statut"], [
    { cells: ["Byound Business", "Le Havre", "6", "Active"] },
    { cells: ["NTC Partners", "Paris", "4", "Active"] },
    { cells: ["Studio Nord", "Rouen", "0", "À relancer"] },
  ]),
  "/dashboard/ecole/offres": page("ecole", "Offres", "CFA Byound", [["Offres", "7"], ["Pourvues", "3"], ["Ouvertes", "4"]], ["Offre", "Entreprise", "Places", "Statut"], [
    { cells: ["Commerciale B2B", "Byound Business", "2", "Ouverte"] },
    { cells: ["Business developer", "NTC Partners", "1", "Ouverte"] },
  ]),
  "/dashboard/ecole/planning": page("ecole", "Planning", "CFA Byound", [["Séances", "12"], ["Salles", "4"], ["Formateurs", "6"]], ["Séance", "Classe", "Salle", "Horaire"], [
    { cells: ["Prospection B2B", "NTC AI Business", "Salle 1", "Aujourd'hui · 9 h"] },
    { cells: ["CRM", "Promo 2026", "Salle 2", "Demain · 14 h"] },
  ]),
  "/dashboard/ecole/formateurs": page("ecole", "Formateurs", "CFA Byound", [["Formateurs", "6"], ["Actifs", "5"], ["Invités", "1"]], ["Formateur", "Spécialité", "Séances", "Statut"], [
    { href: "/dashboard/ecole/formateurs/jade-martin", cells: ["Jade Martin", "Prospection", "8", "Active"] },
    { cells: ["Camille Bernard", "CRM", "5", "Active"] },
  ]),
  "/dashboard/ecole/statistiques": page("ecole", "Statistiques", "CFA Byound", [["Présence", "96 %"], ["Réussite", "88 %"], ["Ruptures", "2"]], ["Indicateur", "Période", "Valeur", "Tendance"], [
    { cells: ["Présence", "Octobre", "96 %", "Stable"] },
    { cells: ["Alternances signées", "Rentrée", "61", "En hausse"] },
  ]),
  "/dashboard/ecole/todo": page("ecole", "Ma todo", "CFA Byound", [["À faire", "6"], ["Conventions", "3"], ["Retard", "1"]], ["Tâche", "Dossier", "Échéance", "Statut"], [
    { cells: ["Signer la convention de Léa", "Byound Business", "Jeudi", "À faire"] },
    { cells: ["Questionnaire qualité", "Promo 2026", "Hier", "En retard"] },
  ]),
  "/dashboard/ecole/qualiopi": page("ecole", "Qualiopi", "CFA Byound", [["Indicateurs", "32"], ["Preuves", "28"], ["À compléter", "4"]], ["Indicateur", "Preuve", "Mis à jour", "Statut"], [
    { cells: ["Information du public", "Plaquette 2026", "Lundi", "Complet"] },
    { cells: ["Amélioration continue", "Comité", "—", "À déposer"] },
  ]),
  "/dashboard/ecole/recrutement/prospects": page("ecole", "Prospects étudiants", "CFA Byound", [["Prospects", "14"], ["Entretiens", "4"], ["Inscrits", "2"]], ["Prospect", "Formation", "Ville", "Statut"], [
    { cells: ["Camille Bernard", "NTC AI Business", "Le Havre", "Entretien"] },
    { cells: ["Noah Petit", "NTC Business Sport", "Rouen", "Dossier"] },
  ]),
  "/dashboard/ecole/recrutement/entreprises": page("ecole", "Entreprises CFA", "CFA Byound", [["Prospects", "8"], ["Rendez-vous", "3"], ["Signées", "2"]], ["Entreprise", "Besoin", "Ville", "Statut"], [
    { cells: ["Studio Nord", "1 alternant commercial", "Rouen", "Rendez-vous"] },
    { cells: ["Byound Business", "2 postes", "Le Havre", "Signée"] },
  ]),
  "/dashboard/ecole/formations/gerer": page("ecole", "Formations", "CFA Byound", [["Formations", "5"], ["Ouvertes", "4"], ["Places", "18"]], ["Formation", "Rythme", "Inscrits", "Statut"], [
    { cells: ["NTC AI Business", "Alternance", "22", "Ouverte"] },
    { cells: ["NTC Business Sport", "Initial", "16", "Ouverte"] },
  ]),
  "/dashboard/ecole/qualite/questionnaires": page("ecole", "Questionnaires qualité", "CFA Byound", [["Campagnes", "3"], ["Réponses", "74"], ["Taux", "68 %"]], ["Questionnaire", "Public", "Réponses", "Statut"], [
    { cells: ["Satisfaction octobre", "Apprenants", "48", "Ouvert"] },
    { cells: ["Fin de module", "Entreprises", "26", "Clos"] },
  ]),
  "/dashboard/ecole/qualite/resultats": page("ecole", "Résultats qualité", "CFA Byound", [["Satisfaction", "4,6/5"], ["Réponses", "74"], ["Alertes", "1"]], ["Thème", "Public", "Note", "Tendance"], [
    { cells: ["Pédagogie", "Apprenants", "4,7/5", "Stable"] },
    { cells: ["Suivi entreprise", "Tuteurs", "4,2/5", "À suivre"] },
  ]),
  "/dashboard/apprenant/badges": page("apprenant", "Wallet", "Espace apprenant", [["Badges", "2"], ["En cours", "1"], ["Critères", "4"]], ["Badge", "Formation", "Critère", "Statut"], [
    { cells: ["Prospection B2B", "CCP1", "Quiz 16/20", "Obtenu"] },
    { cells: ["Prise de parole", "Atelier", "Présence", "Obtenu"] },
    { cells: ["Closing", "Négociation", "Cas pratique", "En cours"] },
  ]),
  "/dashboard/apprenant/results": page("apprenant", "Mes résultats", "Espace apprenant", [["Quiz", "6"], ["Moyenne", "16/20"], ["À faire", "1"]], ["Évaluation", "Cours", "Score", "Date"], [
    { cells: ["Quiz prospection", "CCP1", "16/20", "Il y a 4 jours"] },
    { cells: ["Cas CRM", "NTC AI Business", "14/20", "Il y a 11 jours"] },
    { cells: ["Closing", "Négociation", "—", "À faire"] },
  ]),
  "/dashboard/apprenant/jeux": page("apprenant", "Mes jeux", "Espace apprenant", [["Parties", "3"], ["Terminées", "2"], ["Score moyen", "78"]], ["Jeu", "Compétence", "Score", "Statut"], [
    { cells: ["Premier rendez-vous", "Prospection", "82", "Terminé"] },
    { cells: ["Objection prix", "Négociation", "74", "Terminé"] },
    { cells: ["Relance", "CRM", "—", "À lancer"] },
  ]),
  "/dashboard/apprenant/parcours": page("apprenant", "Parcours", "Espace apprenant", [["Parcours", "2"], ["Avancement", "48 %"], ["Modules", "5"]], ["Parcours", "Prochaine étape", "Avancement", "Statut"], [
    { cells: ["Prospection → closing", "Qualifier un prospect", "62 %", "En cours"] },
    { cells: ["Prise de parole", "Pitch 2 minutes", "20 %", "En cours"] },
  ]),
  "/dashboard/apprenant/missions": page("apprenant", "Mes missions", "Espace apprenant", [["Missions", "3"], ["À rendre", "1"], ["Faites", "2"]], ["Mission", "Demandée par", "Échéance", "Statut"], [
    { cells: ["10 appels qualifiés", "Byound Business", "Vendredi", "À rendre"] },
    { cells: ["Compte-rendu CRM", "Camille Bernard", "Mardi", "Rendue"] },
  ]),
  "/dashboard/apprenant/entreprise": page("apprenant", "Mon entreprise", "Espace apprenant", [["Entreprise", "1"], ["Équipe", "18"], ["Formation", "En cours"]], ["Élément", "Détail", "Visible", "Statut"], [
    { cells: ["Byound Business", "Commerciale B2B", "Oui", "Rattachée"] },
    { cells: ["DISC", "Influent", "Oui", "Partagé"] },
    { cells: ["Soft skills", "Scores détaillés", "Non", "Non partagé"] },
  ]),
  "/dashboard/apprenant/statistiques": page("apprenant", "Statistiques", "Espace apprenant", [["Temps", "6 h 20"], ["Modules", "8/13"], ["Présence", "96 %"]], ["Indicateur", "Période", "Valeur", "Tendance"], [
    { cells: ["Temps de formation", "30 jours", "6 h 20", "En hausse"] },
    { cells: ["Quiz", "Octobre", "16/20", "Stable"] },
  ]),
  "/dashboard/apprenant/care": page("apprenant", "Accueil Care", "Espace apprenant", [["Séances", "2"], ["À venir", "1"], ["Experts", "3"]], ["Séance", "Avec", "Date", "Statut"], [
    { cells: ["Point commercial", "Camille Bernard", ahead(3), "Planifiée"] },
    { cells: ["Bilan de motivation", "Jade Martin", "Il y a 18 jours", "Terminée"] },
  ]),
  "/dashboard/apprenant/recrutement/offres": page("apprenant", "Offres", "Espace apprenant", [["Offres", "3"], ["Match", "91 %"], ["En attente", "1"]], ["Offre", "Ville", "Contrat", "Match"], [
    { cells: ["Chargée de clientèle", "Rouen", "Alternance", "91 %"] },
    { cells: ["Commerciale B2B", "Le Havre", "CDI", "86 %"] },
    { cells: ["Business developer", "Paris", "CDI", "74 %"] },
  ]),
  "/dashboard/apprenant/recrutement/profil": page("apprenant", "Mon profil", "Espace apprenant", [["Complétion", "88 %"], ["Compétences", "6"], ["Preuves", "2"]], ["Champ", "Valeur", "Visibilité", "Statut"], [
    { cells: ["Jade Martin", "Commerciale B2B", "Public", "Complet"] },
    { cells: ["DISC", "Influent", "Partagé", "Complet"] },
    { cells: ["Ville", "Le Havre", "Public", "Complet"] },
  ]),
  "/dashboard/apprenant/recrutement/en-attente": page("apprenant", "En attente", "Espace apprenant", [["Candidatures", "1"], ["Réponses", "0"], ["Match", "86 %"]], ["Offre", "Entreprise", "Envoyée", "Statut"], [
    { cells: ["Commerciale B2B", "Byound Business", "Il y a 3 jours", "Envoyée"] },
  ]),
  "/dashboard/expert/profile": page("expert", "Mon profil", "Espace expert", [["Avis", "4,9"], ["Missions", "7"], ["Statut", "Certifiée"]], ["Champ", "Valeur", "Visibilité", "Statut"], [
    { cells: ["Jade Martin", "Experte commerciale", "Public", "Complet"] },
    { cells: ["Spécialités", "Prospection, Closing, CRM", "Public", "Complet"] },
    { cells: ["Régions", "Normandie, Île-de-France", "Public", "Complet"] },
  ]),
  "/dashboard/expert/interventions": page("expert", "Mes missions", "Espace expert", [["Missions", "7"], ["À venir", "3"], ["Terminées", "4"]], ["Mission", "Client", "Date", "Statut"], [
    { href: "/dashboard/expert/interventions/entretien-jade", cells: ["Entretien Jade", "Byound Business", "Aujourd'hui · 16 h", "Planifié"] },
    { href: "/dashboard/expert/interventions/atelier-closing", cells: ["Atelier closing", "Promo 2026", "Vendredi · 10 h", "Accepté"] },
    { href: "/dashboard/expert/interventions/point-ines", cells: ["Point commercial · Inès", "NTC", "Dans 4 jours", "Nouveau"] },
  ]),
  "/dashboard/expert/agenda": page("expert", "Mon agenda", "Espace expert", [["Créneaux", "6"], ["Occupés", "4"], ["Libres", "2"]], ["Créneau", "Mission", "Lieu", "Statut"], [
    { cells: ["Aujourd'hui · 16 h", "Entretien Jade", "Visio", "Occupé"] },
    { cells: ["Vendredi · 10 h", "Atelier closing", "Le Havre", "Occupé"] },
    { cells: ["Lundi · 9 h", "—", "Visio", "Libre"] },
  ]),
  "/dashboard/expert/revenus": page("expert", "Mes revenus", "Espace expert", [["Mois", "1 840 €"], ["À venir", "620 €"], ["Versé", "1 220 €"]], ["Mission", "Date", "Montant", "Statut"], [
    { cells: ["Atelier closing", "Il y a 7 jours", "480 €", "Versé"] },
    { cells: ["Coaching Léa", "Il y a 18 jours", "180 €", "Versé"] },
    { cells: ["Entretien du jour", "Aujourd'hui", "220 €", "À facturer"] },
  ]),
  "/dashboard/expert/documents": page("expert", "Documents", "Espace expert", [["Fichiers", "4"], ["Contrats", "2"], ["À signer", "1"]], ["Document", "Type", "Date", "Statut"], [
    { cells: ["CV Jade Martin", "CV", "Il y a 30 jours", "Déposé"] },
    { cells: ["Contrat cadre Byound", "Contrat", "Hier", "À signer"] },
  ]),
  "/dashboard/expert/certification": page("expert", "Byound Certified", "Espace expert", [["Niveau", "Certifiée"], ["Badge", "Actif"], ["Renouvellement", "2027"]], ["Étape", "Preuve", "Date", "Statut"], [
    { cells: ["Dossier", "CV et spécialités", "Validé", "Complet"] },
    { cells: ["Badge public", "Profil expert", "Actif", "Publié"] },
  ]),
  "/dashboard/expert/notifications": page("expert", "Notifications", "Espace expert", [["Non lues", "2"], ["Missions", "1"], ["Avis", "1"]], ["Notification", "Source", "Quand", "Statut"], [
    { cells: ["Nouvelle mission · Inès", "Byound Business", "Il y a 1 h", "Non lue"] },
    { cells: ["Avis 5/5", "Léa Bernard", "Hier", "Non lu"] },
  ]),
  "/dashboard/expert/settings": page("expert", "Paramètres", "Espace expert", [["Compte", "Jade"], ["E-mail", "Confirmé"], ["Agenda", "Visio"]], ["Réglage", "Valeur", "Portée", "Statut"], [
    { cells: ["E-mail", "jade@byound.fr", "Compte", "Confirmé"] },
    { cells: ["Notifications", "Missions et avis", "Compte", "Activées"] },
  ]),
  "/dashboard/expert/support": page("expert", "Centre d'aide", "Espace expert", [["Guides", "4"], ["Ouverts", "1"], ["Réponse", "1 jour"]], ["Sujet", "Pour", "Durée", "Statut"], [
    { cells: ["Accepter une mission", "Experts", "2 min", "Guide"] },
    { cells: ["Déclarer un revenu", "Experts", "3 min", "Guide"] },
  ]),
  "/dashboard/entreprise/formations/catalogue": page("entreprise", "Byound Online", "Byound Business", [["Formations", "7"], ["Assignées", "18"], ["Complétion", "71 %"]], ["Formation", "Public", "Inscrits", "Statut"], [
    { cells: ["CCP1 — Stratégie de prospection", "Commerciaux", "12", "Assignée"] },
    { cells: ["NTC AI Business", "Promo interne", "6", "Assignée"] },
    { cells: ["Communication assertive", "Managers", "4", "Disponible"] },
  ]),
  "/dashboard/entreprise/formations/demander": page("entreprise", "Demander une formation", "Byound Business", [["Demandes", "2"], ["En cours", "1"], ["Acceptées", "1"]], ["Demande", "Équipe", "Date", "Statut"], [
    { cells: ["Négociation commerciale", "Ventes", "Il y a 2 jours", "Envoyée"] },
    { cells: ["Prise de parole", "Managers", "Il y a 9 jours", "Acceptée"] },
  ]),
  "/dashboard/entreprise/formations/parcours": page("entreprise", "Parcours", "Byound Business", [["Parcours", "3"], ["Collaborateurs", "18"], ["Complétion", "71 %"]], ["Parcours", "Équipe", "Avancement", "Statut"], [
    { cells: ["Prospection → closing", "Commerciaux", "71 %", "En cours"] },
    { cells: ["Onboarding commercial", "Nouveaux", "40 %", "En cours"] },
  ]),
  "/dashboard/entreprise/badges/delivrer": page("entreprise", "Badges", "Byound Business", [["Délivrés", "14"], ["Ce mois", "3"], ["En attente", "2"]], ["Badge", "Collaborateur", "Critère", "Statut"], [
    { cells: ["Prospection B2B", "Léa Bernard", "Quiz validé", "Délivré"] },
    { cells: ["Closing", "Jade Martin", "Cas pratique", "En attente"] },
  ]),
  "/dashboard/entreprise/abonnement": page("entreprise", "Tarifs", "Byound Business", [["Offre", "Business"], ["Sièges", "32"], ["Renouvellement", "Janvier"]], ["Poste", "Détail", "Période", "Statut"], [
    { cells: ["Byound Business", "32 collaborateurs", "Annuel", "Actif"] },
    { cells: ["Facture octobre", "Réglée", "Mois", "Payée"] },
  ]),
  "/dashboard/entreprise/aide": page("entreprise", "Aide", "Byound Business", [["Guides", "6"], ["Ouverts", "1"], ["Réponse", "1 jour"]], ["Sujet", "Pour", "Durée", "Statut"], [
    { cells: ["Inviter un collaborateur", "RH", "3 min", "Guide"] },
    { cells: ["Assigner une formation", "RH", "2 min", "Guide"] },
  ]),
  "/dashboard/entreprise/parametres": page("entreprise", "Paramètres", "Byound Business", [["Organisation", "1"], ["Admins", "2"], ["Domaines", "1"]], ["Réglage", "Valeur", "Portée", "Statut"], [
    { cells: ["Organisation", "Byound Business", "Compte", "Complet"] },
    { cells: ["Administratrice", "Jade Martin", "Accès", "Active"] },
  ]),
  "/dashboard/entreprise/actions": page("entreprise", "Actions", "Byound Business", [["Demandes", "2"], ["Relances", "1"], ["Faites", "4"]], ["Action", "Collaborateur", "Date", "Statut"], [
    { cells: ["Négociation commerciale", "Jade Martin", "Il y a 2 jours", "Envoyée"] },
    { cells: ["Relance bilan", "Inès Morel", "Aujourd'hui", "À faire"] },
  ]),
  "/dashboard/salarie/missions": page("salarie", "Missions", "Espace salarié", [["Missions", "3"], ["À rendre", "1"], ["Faites", "2"]], ["Mission", "Demandée par", "Échéance", "Statut"], [
    { cells: ["10 appels qualifiés", "Byound Business", "Vendredi", "À rendre"] },
    { cells: ["Compte-rendu CRM", "Camille Bernard", "Mardi", "Rendue"] },
  ]),
  "/dashboard/salarie/coachings": page("salarie", "Accompagnement", "Espace salarié", [["Séances", "2"], ["À venir", "1"], ["Faites", "1"]], ["Séance", "Avec", "Date", "Statut"], [
    { cells: ["Coaching commercial", "Camille Bernard", ahead(3), "Planifié"] },
    { cells: ["Point de démarrage", "Jade Martin", "Il y a 21 jours", "Terminé"] },
  ]),
  "/dashboard/salarie/badges": page("salarie", "Badges", "Espace salarié", [["Badges", "2"], ["En cours", "1"], ["Critères", "4"]], ["Badge", "Formation", "Critère", "Statut"], [
    { cells: ["Prospection B2B", "CCP1", "Quiz 16/20", "Obtenu"] },
    { cells: ["Prise de parole", "Atelier", "Présence", "Obtenu"] },
    { cells: ["Closing", "Négociation", "Cas pratique", "En cours"] },
  ]),
  "/dashboard/salarie/bibliotheque": page("salarie", "Bibliothèque", "Espace salarié", [["Ressources", "5"], ["Lues", "3"], ["Nouvelles", "1"]], ["Ressource", "Formation", "Type", "Statut"], [
    { cells: ["Script d'appel", "CCP1", "PDF", "Lu"] },
    { cells: ["Grille de qualification", "CCP1", "PDF", "Nouveau"] },
  ]),
  "/dashboard/salarie/parcours": page("salarie", "Parcours", "Espace salarié", [["Parcours", "1"], ["Avancement", "62 %"], ["Étape", "8/13"]], ["Parcours", "Prochaine étape", "Avancement", "Statut"], [
    { cells: ["CCP1 — Stratégie de prospection", "Qualifier un prospect", "62 %", "En cours"] },
  ]),
  "/dashboard/student/learning/formations": page("student", "Formations", "Promo NTC 2026", [["Cours", "6"], ["Présence", "96 %"], ["Devoirs", "1"]], ["Cours", "Formateur", "Avancement", "Statut"], [
    { cells: ["Prospection B2B", "Jade Martin", "62 %", "En cours"] },
    { cells: ["CRM", "Camille Bernard", "40 %", "En cours"] },
    { cells: ["Plan d'actions commercial", "Jade Martin", "—", "Devoir à rendre"] },
  ]),
  "/dashboard/student/learning/parcours": page("student", "Parcours", "Promo NTC 2026", [["Parcours", "2"], ["Modules", "6"], ["Avancement", "48 %"]], ["Parcours", "Prochaine séance", "Avancement", "Statut"], [
    { cells: ["Tronc commercial", "Prospection B2B", "62 %", "En cours"] },
    { cells: ["Option sport", "Négociation", "18 %", "Ouvert"] },
  ]),
  "/dashboard/student/learning/exercices": page("student", "Exercices", "Promo NTC 2026", [["À faire", "1"], ["Rendus", "4"], ["Moyenne", "15/20"]], ["Exercice", "Cours", "Échéance", "Statut"], [
    { cells: ["Plan d'actions commercial", "Prospection", "Vendredi", "À rendre"] },
    { cells: ["Pitch 2 minutes", "Prise de parole", "La semaine dernière", "16/20"] },
  ]),
  "/dashboard/student/learning/ressources": page("student", "Ressources", "Promo NTC 2026", [["Fichiers", "8"], ["Nouveaux", "2"], ["Cours", "3"]], ["Ressource", "Cours", "Type", "Statut"], [
    { cells: ["Script d'appel", "Prospection B2B", "PDF", "Nouveau"] },
    { cells: ["Support CRM", "CRM", "PDF", "Disponible"] },
  ]),
  "/dashboard/student/learning/beyond-connect": page("student", "Connect", "Promo NTC 2026", [["Messages", "4"], ["Classe", "22"], ["Non lus", "1"]], ["Fil", "De", "Quand", "Statut"], [
    { cells: ["Classe NTC AI Business", "Jade Martin", "Aujourd'hui", "Non lu"] },
    { cells: ["Devoir de vendredi", "Camille Bernard", "Hier", "Lu"] },
  ]),
  "/dashboard/club/partenaires": page("club", "Partenaires", "Club Byound", [["Partenaires", "12"], ["Actifs", "9"], ["À renouveler", "2"]], ["Partenaire", "Pack", "Ville", "Statut"], [
    { href: "/dashboard/club/partenaires/brasserie-du-port", cells: ["Brasserie du Port", "Argent", "La Rochelle", "Actif"] },
    { href: "/dashboard/club/partenaires/studio-nord", cells: ["Studio Nord", "Or", "Rouen", "Actif"] },
  ]),
  "/dashboard/club/news": page("club", "News Club", "Club Byound", [["Articles", "6"], ["Publiés", "4"], ["Brouillons", "1"]], ["Article", "Auteur", "Date", "Statut"], [
    { cells: ["Afterwork du 22 octobre", "Club", "Aujourd'hui", "Publié"] },
    { cells: ["Nouveau partenaire", "Jade Martin", "Brouillon", "À publier"] },
  ]),
  "/dashboard/club/offres": page("club", "Offres", "Club Byound", [["Offres", "4"], ["Vues", "86"], ["Leads", "6"]], ["Offre", "Partenaire", "Vues", "Statut"], [
    { cells: ["Pack bord terrain", "Brasserie du Port", "32", "En ligne"] },
    { cells: ["Stage commercial", "Byound Business", "18", "En ligne"] },
  ]),
  "/dashboard/club/tunnel": page("club", "Prospection", "Club Byound", [["Pistes", "15"], ["Rendez-vous", "4"], ["Signés", "2"]], ["Piste", "Contact", "Étape", "Statut"], [
    { cells: ["Normandie Auto", "Hugo Martin", "Rendez-vous", "Planifié"] },
    { cells: ["Hôtel de la Plage", "Inès Morel", "Découverte", "Nouveau"] },
  ]),
  "/dashboard/club/evenements": page("club", "Événements", "Club Byound", [["À venir", "3"], ["Inscrits", "48"], ["Complets", "1"]], ["Événement", "Lieu", "Date", "Statut"], [
    { cells: ["Afterwork partenaires", "La Rochelle", "22 octobre", "Ouvert"] },
    { cells: ["Petit-déjeuner RH", "Le Havre", "Jeudi", "Complet"] },
  ]),
  "/dashboard/club/roi": page("club", "ROI & reporting", "Club Byound", [["Retombées", "28 %"], ["Leads", "15"], ["Renouvellements", "2"]], ["Indicateur", "Période", "Valeur", "Tendance"], [
    { cells: ["Leads qualifiés", "Trimestre", "15", "En hausse"] },
    { cells: ["Taux de réponse", "Octobre", "28 %", "Stable"] },
  ]),
  "/dashboard/club/admin": page("club", "Administratif", "Club Byound", [["Pièces", "8"], ["À signer", "1"], ["À jour", "6"]], ["Document", "Dossier", "Date", "Statut"], [
    { cells: ["Assurance", "Saison", "Septembre", "À jour"] },
    { cells: ["Convention Studio Nord", "Partenaires", "Hier", "À signer"] },
  ]),
  "/dashboard/club/aides": page("club", "Aides & formation", "Club Byound", [["Aides", "3"], ["Ouvertes", "2"], ["Formations", "1"]], ["Aide", "Public", "Montant", "Statut"], [
    { cells: ["Aide à l'emploi", "Clubs amateurs", "Selon dossier", "Ouverte"] },
    { cells: ["Formation dirigeants", "Bénévoles", "Prise en charge", "Ouverte"] },
  ]),
  "/dashboard/club/compte": page("club", "Mon compte", "Club Byound", [["Club", "1"], ["Rôle", "Admin"], ["E-mail", "Confirmé"]], ["Champ", "Valeur", "Portée", "Statut"], [
    { cells: ["Club", "Football Club Rochelais", "Compte", "Complet"] },
    { cells: ["E-mail", "jade@byound.fr", "Connexion", "Confirmé"] },
  ]),
  "/dashboard/club/dncg": page("club", "DNCG", "Club Byound", [["Dossiers", "2"], ["Complets", "1"], ["À déposer", "1"]], ["Dossier", "Saison", "Pièces", "Statut"], [
    { cells: ["Dossier financier", "2026", "Bilan et budget", "Complet"] },
    { cells: ["Effectif", "2026", "Licences", "À déposer"] },
  ]),
  "/dashboard/partenaire/contrat": page("partenaire", "Mon contrat", "Partenaire démo", [["Pack", "Argent"], ["Montant", "5 000 €"], ["Prestations", "3"]], ["Prestation", "Catégorie", "Valeur", "Statut"], [
    { cells: ["Panneau bord terrain", "Terrain", "2 500 €", "Actif"] },
    { cells: ["Logo site web", "Digital", "2 000 €", "Actif"] },
    { cells: ["Pack match day", "Social", "3 000 €", "À venir"] },
  ]),
  "/dashboard/partenaire/roi": page("partenaire", "Mon ROI", "Partenaire démo", [["Vues", "86"], ["Mentions", "4"], ["Leads", "6"]], ["Indicateur", "Période", "Valeur", "Tendance"], [
    { cells: ["Vues de l'offre", "Octobre", "86", "En hausse"] },
    { cells: ["Contacts reçus", "Trimestre", "6", "En hausse"] },
  ]),
  "/dashboard/partenaire/news": page("partenaire", "Actualités club", "Partenaire démo", [["Articles", "4"], ["Vous citent", "2"], ["Cette semaine", "1"]], ["Article", "Mention", "Date", "Statut"], [
    { cells: ["Victoire 2-1 face à Caen", "Tribune partenaires", "Il y a 2 jours", "Publié"] },
    { cells: ["Bienvenue Brasserie du Port", "Vous", "Il y a 5 jours", "Publié"] },
  ]),
  "/dashboard/partenaire/avantages": page("partenaire", "Mes avantages", "Partenaire démo", [["Avantages", "4"], ["À venir", "2"], ["Utilisés", "1"]], ["Avantage", "Événement", "Date", "Statut"], [
    { cells: ["Loge match", "FC Caen B", "15 mars", "Réservé"] },
    { cells: ["Afterwork", "La Rochelle", "22 octobre", "Ouvert"] },
  ]),
  "/dashboard/partenaire/annuaire": page("partenaire", "Annuaire", "Partenaire démo", [["Partenaires", "12"], ["Même pack", "4"], ["Ville", "3"]], ["Partenaire", "Pack", "Ville", "Statut"], [
    { href: "/dashboard/partenaire/annuaire/studio-nord", cells: ["Studio Nord", "Or", "Rouen", "Actif"] },
    { cells: ["Brasserie du Port", "Argent", "La Rochelle", "Vous"] },
  ]),
  "/dashboard/tuteur/todo": page("tuteur", "À faire", "Espace tuteur", [["À faire", "4"], ["Visites", "2"], ["Retard", "1"]], ["Tâche", "Alternant", "Échéance", "Statut"], [
    { cells: ["Visite entreprise", "Léa Bernard", "Jeudi", "Planifiée"] },
    { cells: ["Signer le livret", "Léa Bernard", "Vendredi", "À faire"] },
    { cells: ["Point pédagogique", "Inès Morel", "Hier", "En retard"] },
  ]),
  "/dashboard/partenaire/compte": page("partenaire", "Mon compte", "Partenaire démo", [["Pack", "Argent"], ["Contact", "Jade"], ["E-mail", "Confirmé"]], ["Champ", "Valeur", "Portée", "Statut"], [
    { cells: ["Entreprise", "Brasserie du Port", "Compte", "Complet"] },
    { cells: ["E-mail", "jade@byound.fr", "Connexion", "Confirmé"] },
  ]),
};

const PEOPLE = ["Léa Bernard", "Hugo Martin", "Inès Morel", "Noah Petit"];

function titleFromPath(path: string) {
  const last = path.split("/").filter(Boolean).pop() ?? "Page";
  return last.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fallback(path: string, space: string): JadeDemoPage {
  const title = titleFromPath(path);
  return page(space, title, "Compte démo Jade", [["Éléments", "4"], ["À jour", "3"], ["À suivre", "1"]], ["Nom", "Détail", "Date", "Statut"], PEOPLE.map((name, index) => ({
    cells: [name, title, index === 0 ? "Aujourd'hui" : "Cette semaine", index === 3 ? "À suivre" : "À jour"],
  })));
}

export function jadeDemoPage(pathname: string): JadeDemoPage | null {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  const space = spaceOf(path);
  if (!space || keepsRealPage(path)) return null;
  if (PAGES[path]) return PAGES[path];
  const parent = path.split("/").slice(0, -1).join("/");
  const parentPage = PAGES[parent];
  if (parentPage) {
    const row = parentPage.rows.find((item) => item.href === path);
    return page(space, row?.cells[0] ?? titleFromPath(path), parentPage.kicker, parentPage.stats.map((stat) => [stat.label, stat.value]), ["Champ", "Valeur", "Contexte", "Statut"], [
      { cells: ["Nom", row?.cells[0] ?? titleFromPath(path), parentPage.title, "Fiche démo"] },
      { cells: ["Détail", row?.cells[1] ?? "Byound", parentPage.title, "Renseigné"] },
      { cells: ["Suivi", row?.cells[2] ?? "En cours", parentPage.title, row?.cells[3] ?? "À jour"] },
    ]);
  }
  return fallback(path, space);
}
