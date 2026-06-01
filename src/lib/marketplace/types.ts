export type PraticienBct = {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  prenom: string;
  nom: string;
  photo_url: string | null;
  titre: string | null;
  biographie: string | null;
  specialites: string[] | null;
  langues: string[] | null;
  diplomes: string[] | null;
  tarif_session: number;
  duree_session: number;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  bct_certified: boolean;
  timezone: string;
  status: string;
  visible_marketplace: boolean;
  note_moyenne: number | null;
  nombre_avis: number;
};

export type PraticienCreneau = {
  id: string;
  praticien_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  disponible: boolean;
};

export type SessionBct = {
  id: string;
  praticien_id: string;
  collaborateur_id: string;
  organization_id: string | null;
  creneau_id: string;
  date_session: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  motif: string | null;
  consentement_donnees: boolean;
  montant_total: number;
  commission_beyond: number;
  montant_praticien: number;
  payment_status: string;
  status: string;
};
