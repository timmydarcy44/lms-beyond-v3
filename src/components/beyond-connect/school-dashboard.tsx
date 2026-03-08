"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, KanbanSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_type: string | null;
  phone?: string | null;
  class_name?: string | null;
  class?: string | null;
  promo?: string | null;
  soft_skills_scores?: Record<string, number> | null;
};

type SchoolDashboardProps = {
  apprenants: ProfileRow[] | null;
  entreprises: ProfileRow[] | null;
  effectifTotal: number;
  alternancesSignees: number;
  apprenantsEnRecherche: number;
  offersCount: number;
  latestOffers: Array<{
    id: string;
    title?: string | null;
    created_at?: string | null;
    status?: string | null;
    city?: string | null;
  }>;
  latestConnected: Array<{
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    updated_at?: string | null;
    role_type?: string | null;
  }>;
  recentActivities: Array<{
    id: string;
    job_id?: string | null;
    talent_id?: string | null;
    created_at?: string | null;
    status?: string | null;
  }>;
  fullName: string;
};

const getTopSkills = (s?: string[] | null) => s?.slice(0, 5) || [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const mockCursus = [
  {
    id: "1",
    nom: "BTS NDRC",
    apprenants: 8,
    missions: [
      { titre: "Prospection clients", statut: "EN_ATTENTE" },
      { titre: "Audit commercial", statut: "EN_ATTENTE" },
      { titre: "Rapport de stage", statut: "EN_ATTENTE" },
    ],
  },
  {
    id: "2",
    nom: "Bachelor RH",
    apprenants: 3,
    missions: [
      { titre: "Prospection clients", statut: "EN_ATTENTE" },
      { titre: "Audit commercial", statut: "EN_ATTENTE" },
      { titre: "Rapport de stage", statut: "EN_ATTENTE" },
    ],
  },
  {
    id: "3",
    nom: "BTS MCO",
    apprenants: 5,
    missions: [
      { titre: "Prospection clients", statut: "EN_ATTENTE" },
      { titre: "Audit commercial", statut: "EN_ATTENTE" },
      { titre: "Rapport de stage", statut: "EN_ATTENTE" },
    ],
  },
];

const mockClasses = [
  {
    id: "1",
    nom: "BTS NDRC",
    apprenants: [
      {
        nom: "Anaïs Dupont",
        email: "anais@gmail.com",
        entreprise: "Beyond Group",
        tuteur: "Paul Martin",
      },
      {
        nom: "Lucas Bernard",
        email: "lucas@gmail.com",
        entreprise: "NeoTech",
        tuteur: "Claire Dubois",
      },
    ],
  },
  {
    id: "2",
    nom: "Bachelor RH",
    apprenants: [
      {
        nom: "Emma Petit",
        email: "emma@gmail.com",
        entreprise: "RH Solutions",
        tuteur: "Marc Leroy",
      },
    ],
  },
  {
    id: "3",
    nom: "BTS MCO",
    apprenants: [],
  },
];

const mockTuteurs = [
  { id: "t1", name: "Camille Durand" },
  { id: "t2", name: "Mehdi Benali" },
  { id: "t3", name: "Sophie Leblanc" },
];

const mockAssignments = [
  {
    id: "a1",
    student: "Anaïs Dupont",
    cursus: "BTS NDRC",
    entreprise: "Beyond Group",
    tuteur: "Camille Durand",
  },
];

const mockStudents = [
  {
    id: "mock-1",
    first_name: "Anaïs",
    last_name: "Dupont",
    email: "anais.dupont@email.com",
    ecole: "BTS NDRC",
    entreprise: "Beyond Group",
    tuteur: "Paul Martin",
    disc: { D: 7, I: 8, S: 5, C: 4 },
    completion: 85,
  },
  {
    id: "mock-2",
    first_name: "Lucas",
    last_name: "Bernard",
    email: "lucas.bernard@email.com",
    ecole: "Bachelor RH",
    entreprise: "NeoTech",
    tuteur: "Claire Dubois",
    disc: { D: 4, I: 6, S: 8, C: 7 },
    completion: 62,
  },
  {
    id: "mock-3",
    first_name: "Emma",
    last_name: "Petit",
    email: "emma.petit@email.com",
    ecole: "BTS MCO",
    entreprise: "RH Solutions",
    tuteur: "Marc Leroy",
    disc: { D: 6, I: 5, S: 6, C: 8 },
    completion: 74,
  },
];

type MissionDraft = {
  titre: string;
  description: string;
  exemple?: string;
  duree_estimee: string;
  niveau: "debutant" | "intermediaire" | "avance";
};

type ActiveTabKey =
  | "overview"
  | "classes"
  | "students"
  | "companies"
  | "prospection"
  | "cursus"
  | "assignments";

export function SchoolDashboard({
  apprenants,
  entreprises,
  effectifTotal,
  alternancesSignees,
  apprenantsEnRecherche,
  offersCount,
  latestOffers,
  latestConnected,
  recentActivities,
  fullName,
}: SchoolDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ActiveTabKey>("overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [studentsRows, setStudentsRows] = useState<ProfileRow[] | null>(apprenants);
  const [companiesRows, setCompaniesRows] = useState<ProfileRow[] | null>(entreprises);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ProfileRow | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [cursusRows, setCursusRows] = useState(mockCursus);
  const [assignmentsRows, setAssignmentsRows] = useState(mockAssignments);
  const [cursusDialogOpen, setCursusDialogOpen] = useState(false);
  const [editCursusOpen, setEditCursusOpen] = useState(false);
  const [editCursusId, setEditCursusId] = useState<string | null>(null);
  const [editCursusName, setEditCursusName] = useState("");
  const [editMissions, setEditMissions] = useState<Array<{ titre: string; statut: string }>>([]);
  const [cursusName, setCursusName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [missionDrafts, setMissionDrafts] = useState<MissionDraft[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCursusId, setSelectedCursusId] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [expandedCursusId, setExpandedCursusId] = useState<string | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const normalizeTab = (value: string | null): ActiveTabKey => {
    switch (value) {
      case "apprenants":
      case "students":
        return "students";
      case "classes":
        return "classes";
      case "entreprises":
      case "companies":
        return "companies";
      case "prospection":
        return "prospection";
      case "cursus":
        return "cursus";
      case "assignments":
      case "alternants":
        return "assignments";
      default:
        return "overview";
    }
  };

  const tabToQuery = (tab: ActiveTabKey) => {
    if (tab === "students") return "apprenants";
    if (tab === "companies") return "entreprises";
    if (tab === "classes") return "classes";
    return tab;
  };

  const handleTabClick = (tab: ActiveTabKey) => {
    setActiveTab(tab);
    if (tab === "overview") {
      router.replace(pathname);
      return;
    }
    const queryValue = tabToQuery(tab);
    router.replace(`${pathname}?tab=${queryValue}`);
  };

  const discColors: Record<string, string> = {
    Rouge: "bg-red-500",
    Jaune: "bg-yellow-400",
    Vert: "bg-[#8E8E93]",
    Bleu: "bg-blue-600",
  };

  const normalizeScore = (value: number) => (value <= 10 ? value * 10 : value);

  const getDominantDisc = (scores?: Record<string, number> | null) => {
    if (!scores) return null;
    const options = [
      { key: "Rouge", value: scores.Rouge ?? scores.red ?? scores.rouge ?? 0 },
      { key: "Jaune", value: scores.Jaune ?? scores.yellow ?? scores.jaune ?? 0 },
      { key: "Vert", value: scores.Vert ?? scores.green ?? scores.vert ?? 0 },
      { key: "Bleu", value: scores.Bleu ?? scores.blue ?? scores.bleu ?? 0 },
    ].map((item) => ({ ...item, value: normalizeScore(item.value) }));
    const top = options.sort((a, b) => b.value - a.value)[0];
    if (!top || top.value < 60) return null;
    return top.key;
  };

  const getMatchingScore = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) % 1000;
    }
    return 70 + (hash % 26);
  };

  const getProfileClass = (row: ProfileRow) =>
    row.class_name || row.class || row.promo || "-";

  const encodeFileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
      reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
      reader.readAsDataURL(file);
    });

  const handleAnalyzeReferentiel = async () => {
    if (!pdfFile || !cursusName.trim()) {
      toast.error("Nom du cursus et PDF requis.");
      return;
    }
    setIsAnalyzing(true);
    type AnalyzedMission = {
      titre?: string;
      description?: string;
      exemple?: string;
      duree_estimee?: string;
      niveau?: string;
    };
    const normalizeNiveau = (value?: string): MissionDraft["niveau"] => {
      const normalized = String(value ?? "").toLowerCase();
      if (normalized === "intermediaire" || normalized === "intermédiaire") return "intermediaire";
      if (normalized === "avance" || normalized === "avancé") return "avance";
      return "debutant";
    };
    try {
      const pdfBase64 = await encodeFileToBase64(pdfFile);
      const response = await fetch("/api/ecole/referentiel/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_base64: pdfBase64, cursus_nom: cursusName.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Analyse impossible");
      }
      const missions: AnalyzedMission[] = Array.isArray(payload?.missions) ? payload.missions : [];
      setMissionDrafts(
        missions.map((mission) => ({
          titre: mission.titre || "Mission",
          description: mission.description || "",
          exemple: mission.exemple || "",
          duree_estimee: mission.duree_estimee || "",
          niveau: normalizeNiveau(mission.niveau),
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'analyse du référentiel.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateCursus = () => {
    if (!cursusName.trim()) {
      toast.error("Nom du cursus requis.");
      return;
    }
    const nextId = `${Date.now()}`;
    setCursusRows((prev) => [
      ...prev,
      {
        id: nextId,
        nom: cursusName.trim(),
        missions:
          missionDrafts.length > 0
            ? missionDrafts.map((mission) => ({
                titre: mission.titre,
                statut: "EN_ATTENTE",
              }))
            : [
                { titre: "Prospection clients", statut: "EN_ATTENTE" },
                { titre: "Audit commercial", statut: "EN_ATTENTE" },
                { titre: "Rapport de stage", statut: "EN_ATTENTE" },
              ],
        apprenants: 0,
      },
    ]);
    setCursusDialogOpen(false);
    setCursusName("");
    setPdfFile(null);
    setMissionDrafts([]);
    toast.success("Cursus créé.");
  };

  const handleAddEditMission = () => {
    setEditMissions((prev) => [
      ...prev,
      { titre: "Nouvelle mission", statut: "EN_ATTENTE" },
    ]);
  };

  const handleSaveEditCursus = () => {
    if (!editCursusId || !editCursusName.trim()) {
      toast.error("Nom du cursus requis.");
      return;
    }
    setCursusRows((prev) =>
      prev.map((row) =>
        row.id === editCursusId
          ? {
              ...row,
              nom: editCursusName.trim(),
              missions: editMissions.map((mission) => ({
                ...mission,
                titre: mission.titre.trim() || "Mission",
              })),
            }
          : row
      )
    );
    setEditCursusOpen(false);
    toast.success("Cursus mis à jour.");
  };

  const handleAssign = () => {
    if (!selectedStudentId || !selectedCursusId || !selectedCompanyId || !selectedTutorId) {
      toast.error("Tous les champs sont requis.");
      return;
    }
    const student = studentsRows?.find((row) => row.id === selectedStudentId);
    const company = companiesRows?.find((row) => row.id === selectedCompanyId);
    const cursus = cursusRows.find((row) => row.id === selectedCursusId);
    const tutor = mockTuteurs.find((row) => row.id === selectedTutorId);
    if (!student || !company || !cursus || !tutor) {
      toast.error("Sélection invalide.");
      return;
    }
    setAssignmentsRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        student: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
        cursus: cursus.nom,
        entreprise: `${company.first_name || ""} ${company.last_name || ""}`.trim() || "Entreprise",
        tuteur: tutor.name,
      },
    ]);
    setSelectedStudentId("");
    setSelectedCursusId("");
    setSelectedCompanyId("");
    setSelectedTutorId("");
    toast.success("Assignation créée.");
  };

  useEffect(() => {
    setStudentsRows(apprenants);
  }, [apprenants]);

  useEffect(() => {
    setActiveTab(normalizeTab(tabParam));
  }, [tabParam]);

  useEffect(() => {
    setCompaniesRows(entreprises);
  }, [entreprises]);

  const renderCompaniesTable = (rows: ProfileRow[] | null, emptyLabel: string, basePath: string) => {
    if (!rows || rows.length === 0) {
      return <p className="text-sm text-black/60">{emptyLabel}</p>;
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-black/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Score de Matching</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dominantDisc = getDominantDisc(row.soft_skills_scores);
              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-black">
                    <div className="flex items-center gap-2">
                      <span>{(row.first_name || "") + " " + (row.last_name || "")}</span>
                      {dominantDisc ? (
                        <span className={`h-2 w-2 rounded-full ${discColors[dominantDisc]}`} />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-xs font-semibold text-[#1D1D1F]">
                      {getMatchingScore(row.id)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black/70">{row.email || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      En recherche
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black/40">{row.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`${basePath}/${slugify(`${row.first_name || "entreprise"}-${row.last_name || "profil"}`)}`}
                      onClick={() =>
                        setLoadingSlug(`${row.first_name || "entreprise"}-${row.last_name || "profil"}`)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-slate-50"
                    >
                      <BarChart3 className="h-3 w-3" />
                      Voir Profil Complet
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const firstName = (fullName || "").split(" ")[0] || "votre";

  return (
    <div className="space-y-8">
      {loadingSlug ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 text-sm text-white">
          Chargement du profil...
        </div>
      ) : null}
      <header className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-black">
              Bienvenue{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {firstName}
              </span>{" "}
              dans votre interface de gestion
            </h1>
            <p className="mt-2 text-sm text-black/60">Pilotez vos apprenants et entreprises associées.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "overview", label: "Vue d'ensemble" },
          { key: "students", label: "Liste des apprenants" },
          { key: "classes", label: "Mes classes" },
          { key: "companies", label: "Entreprises partenaires" },
          { key: "prospection", label: "Prospection" },
          { key: "cursus", label: "Cursus & Référentiels" },
          { key: "assignments", label: "Alternants & Entreprises" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key as ActiveTabKey)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              activeTab === tab.key ? "bg-black text-white" : "border border-slate-200 text-black/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3" id="overview">
            <div className="rounded-2xl border border-white/20 bg-white/40 p-5 shadow-xl shadow-black/5 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">Effectif Total</p>
              <p className="mt-3 text-3xl font-semibold text-black">{effectifTotal || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/40 p-5 shadow-xl shadow-black/5 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">Alternances Signées</p>
              <p className="mt-3 text-3xl font-semibold text-black">{alternancesSignees || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/40 p-5 shadow-xl shadow-black/5 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">Apprenants en Recherche</p>
              <p className="mt-3 text-3xl font-semibold text-black">{apprenantsEnRecherche || 0}</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3" id="offres">
            <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-xl shadow-black/5 backdrop-blur-md">
              <h3 className="text-sm font-semibold">Dernières Offres</h3>
              <div className="mt-4 space-y-3 text-sm text-black/70">
                {latestOffers.length ? (
                  latestOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between">
                      <span>{offer.title || "Offre"}</span>
                      <span className="text-xs text-black/40">{offer.city || "-"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black/40">Aucune offre récente.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-xl shadow-black/5 backdrop-blur-md">
              <h3 className="text-sm font-semibold">Derniers Connectés</h3>
              <div className="mt-4 space-y-3 text-sm text-black/70">
                {latestConnected.length ? (
                  latestConnected.map((row) => (
                    <div key={row.id} className="flex items-center justify-between">
                      <span>
                        {(row.first_name || "") + " " + (row.last_name || "")}
                      </span>
                      <span className="text-xs text-black/40">{row.role_type || "-"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black/40">Aucune activité récente.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-xl shadow-black/5 backdrop-blur-md">
              <h3 className="text-sm font-semibold">Activités Récentes</h3>
              <div className="mt-4 space-y-3 text-sm text-black/70">
                {recentActivities.length ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <span>Nouvelle candidature</span>
                      <span className="text-xs text-black/40">
                        {activity.status || "pending"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black/40">Aucune activité récente.</p>
                )}
              </div>
            </div>
          </section>
          <section
            className="rounded-3xl border border-slate-200 p-6 shadow-sm"
            style={{
              background: "linear-gradient(90deg, #4F46E5, #7C3AED)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
              backgroundImage:
                "linear-gradient(90deg, #4F46E5, #7C3AED), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Crect width=%221%22 height=%221%22 fill=%22rgba(255,255,255,0.08)%22/%3E%3C/svg%3E')",
              boxShadow: "0 20px 40px rgba(79,70,229,0.35)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Conformite & Audit</h3>
                <p className="mt-2 text-sm text-white/80">
                  Centralisez vos preuves Qualiopi et securisez votre audit en un seul espace clair.
                </p>
              </div>
              <Link
                href="/dashboard/ecole/qualiopi"
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_18px_rgba(124,58,237,0.6)]"
              >
                Gerer l'audit
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "students" ? (
        <section className="space-y-4" id="apprenants">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Apprenants</h2>
          </div>
          {!studentsRows || studentsRows.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mockStudents.map((student) => {
                const initials = `${student.first_name[0] ?? ""}${student.last_name[0] ?? ""}`.toUpperCase();
                return (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        {initials || "A"}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-black">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-black/60">{student.ecole}</p>
                        <p className="text-sm text-black/60">{student.entreprise}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-black/50">
                        <span>Progression</span>
                        <span>{student.completion}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-black"
                          style={{ width: `${student.completion}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/ecole/apprenant/${student.id}`}
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-black/70 hover:bg-slate-50"
                      >
                        Voir le profil
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-xl shadow-black/5 backdrop-blur-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/40 text-xs uppercase tracking-[0.2em] text-black/50 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Prenom</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Telephone</th>
                    <th className="px-4 py-3">Profil Dominant</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {studentsRows.map((row) => {
                    const dominantDisc = getDominantDisc(row.soft_skills_scores);
                    const badgeColor = dominantDisc ? discColors[dominantDisc] : "bg-slate-300";
                    return (
                      <tr key={row.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-semibold text-black">{row.last_name || "-"}</td>
                        <td className="px-4 py-3 text-black/70">{row.first_name || "-"}</td>
                        <td className="px-4 py-3 text-black/70">{getProfileClass(row)}</td>
                        <td className="px-4 py-3 text-black/70">{row.email || "-"}</td>
                        <td className="px-4 py-3 text-black/70">{row.phone || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${badgeColor}`}>
                            {dominantDisc || "Non defini"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudent(row);
                                setSelectedOffers([]);
                                setOfferDialogOpen(true);
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-slate-50"
                            >
                              Envoyer une offre
                            </button>
                            <Link
                              href={`/dashboard/ecole/apprenants/${slugify(
                                `${row.first_name || "profil"}-${row.last_name || ""}`
                              )}?id=${row.id}`}
                              onClick={() => setLoadingSlug(row.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-slate-50"
                            >
                              <BarChart3 className="h-3 w-3" />
                              Voir Profil
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "classes" ? (
        <section className="space-y-4" id="classes">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Mes classes</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {mockClasses.map((classe) => {
              const isExpanded = expandedClassId === classe.id;
              return (
                <div key={classe.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-black">{classe.nom}</p>
                      <p className="text-sm text-black/60">
                        {classe.apprenants.length} apprenant{classe.apprenants.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedClassId(isExpanded ? null : classe.id)}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-900"
                    >
                      Voir les apprenants
                    </button>
                  </div>
                  {isExpanded ? (
                    <div className="mt-4 space-y-3 text-sm text-black/70">
                      {classe.apprenants.length === 0 ? (
                        <p className="text-sm text-black/50">Aucun apprenant associé.</p>
                      ) : (
                        classe.apprenants.map((apprenant) => (
                          <div
                            key={apprenant.email}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                          >
                            <div>
                              <p className="font-semibold text-black">{apprenant.nom}</p>
                              <p className="text-xs text-black/50">{apprenant.email}</p>
                            </div>
                            <div className="text-xs text-black/60">
                              {apprenant.entreprise} • {apprenant.tuteur}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {activeTab === "companies" ? (
        <section className="space-y-4" id="entreprises">
          <h2 className="text-lg font-semibold">Entreprises partenaires</h2>
          {renderCompaniesTable(
            companiesRows,
            "Aucune entreprise associée pour le moment.",
            "/dashboard/ecole/entreprises"
          )}
        </section>
      ) : null}

      {activeTab === "prospection" ? (
        <section className="space-y-4" id="prospection">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-4 w-4 text-black/60" />
            <h2 className="text-lg font-semibold">Prospection</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Prospects",
                items: [
                  { name: "Nordic Sports", hot: true },
                  { name: "Vente Plus", hot: false },
                ],
              },
              {
                title: "En negociation",
                items: [
                  { name: "Excellence Retail", hot: true },
                  { name: "Impact B2B", hot: false },
                ],
              },
              {
                title: "Partenaires actifs",
                items: [
                  { name: "Beyond Group", hot: false },
                  { name: "Rive Droite Conseil", hot: true },
                ],
              },
            ].map((column) => (
              <div key={column.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">{column.title}</p>
                <div className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-2xl border border-white/10 bg-white/70 p-3 shadow-sm backdrop-blur"
                    >
                      <p className="text-sm font-semibold text-black/70">
                        {item.name} {item.hot ? "🔥" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "cursus" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Cursus & Référentiels</h2>
              <p className="text-sm text-black/60">Gérez les référentiels de formation.</p>
            </div>
            <button
              type="button"
              onClick={() => setCursusDialogOpen(true)}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              + Créer un cursus
            </button>
          </div>
          <div className="space-y-3">
            {cursusRows.map((cursus) => (
              <div key={cursus.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-black">{cursus.nom}</p>
                    <p className="text-sm text-black/60">
                      {cursus.missions.length} missions • {cursus.apprenants} apprenants
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCursusId(expandedCursusId === cursus.id ? null : cursus.id)
                      }
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-900"
                    >
                      Voir les missions
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditCursusId(cursus.id);
                        setEditCursusName(cursus.nom);
                        setEditMissions(cursus.missions.map((m) => ({ ...m })));
                        setEditCursusOpen(true);
                      }}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-900"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
                {expandedCursusId === cursus.id ? (
                  <div className="mt-4 space-y-2 text-sm text-black/70">
                    {cursus.missions.map((mission, index) => (
                      <div
                        key={`${mission.titre}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <span className="font-medium text-black">{mission.titre}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {mission.statut}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "assignments" ? (
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Alternants & Entreprises</h2>
            <p className="text-sm text-black/60">
              Assignez vos alternants à un cursus, une entreprise et un tuteur.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-black">Assigner un apprenant</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs text-black/60">Apprenant</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {(studentsRows || []).map((row) => (
                      <option key={row.id} value={row.id}>
                        {(row.first_name || "") + " " + (row.last_name || "")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-black/60">Cursus</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={selectedCursusId}
                    onChange={(event) => setSelectedCursusId(event.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {cursusRows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-black/60">Entreprise partenaire</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={selectedCompanyId}
                    onChange={(event) => setSelectedCompanyId(event.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {(companiesRows || []).map((row) => (
                      <option key={row.id} value={row.id}>
                        {(row.first_name || "") + " " + (row.last_name || "")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-black/60">Tuteur</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={selectedTutorId}
                    onChange={(event) => setSelectedTutorId(event.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {mockTuteurs.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAssign}
                  className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
                >
                  Assigner
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-black">Vue des assignations</h3>
              <div className="space-y-3 text-sm text-black/70">
                {assignmentsRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3"
                  >
                    <div>
                      <p className="font-semibold text-black">{row.student}</p>
                      <p className="text-xs text-black/50">
                        {row.cursus} • {row.entreprise} • {row.tuteur}
                      </p>
                    </div>
                    <button className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-900">
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "overview" ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="todo">
            <h3 className="text-sm font-semibold">Ma To-Do</h3>
            <ul className="mt-4 space-y-2 text-sm text-black/70">
              {["Relancer l'entreprise Beyond", "Planifier entretien Jean", "Valider contrat alternance"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-black/50" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            {[
              {
                title: "Créer un apprenant",
                category: "Apprenants",
                description: "Ajoutez un nouvel apprenant à votre école.",
                image:
                  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80",
              },
              {
                title: "Inviter une entreprise",
                category: "Partenaires",
                description: "Invitez une entreprise à rejoindre votre réseau.",
                image:
                  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80",
              },
              {
                title: "Cursus & Référentiels",
                category: "Cursus",
                description: "Gérez vos référentiels et missions.",
                image:
                  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80",
              },
              {
                title: "Lancer un test DISC",
                category: "Évaluations",
                description: "Évaluez les soft skills des alternants.",
                image:
                  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
              },
            ].map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => setInviteOpen(true)}
                className="group relative h-[400px] overflow-hidden rounded-2xl shadow-sm"
              >
                <img
                  src={card.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/20" />
                <div className="absolute bottom-0 left-0 right-0 z-10 p-5 text-left text-white">
                  <p className="text-xs uppercase tracking-widest text-white/70">{card.category}</p>
                  <p className="mt-2 text-lg font-semibold">{card.title}</p>
                  <p className="mt-2 text-sm text-white/80">{card.description}</p>
                </div>
                <span className="absolute bottom-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur">
                  +
                </span>
              </button>
            ))}
          </section>
        </>
      ) : null}

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Inviter un étudiant</h3>
            <p className="mt-2 text-sm text-black/70">
              Fonctionnalité d&apos;invitation par mail bientôt disponible.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-black/70"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={cursusDialogOpen} onOpenChange={setCursusDialogOpen}>
        <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un cursus</DialogTitle>
            <DialogDescription>
              Ajoutez un référentiel pour générer automatiquement les missions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-black/60">Nom du cursus</label>
              <input
                value={cursusName}
                onChange={(event) => setCursusName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="BTS NDRC"
              />
            </div>
            <div>
              <label className="text-xs text-black/60">Référentiel PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleAnalyzeReferentiel}
                disabled={isAnalyzing}
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Analyser avec l'IA
              </button>
              {isAnalyzing ? (
                <p className="mt-2 text-xs text-black/60">L&apos;IA analyse votre référentiel...</p>
              ) : null}
            </div>
            {missionDrafts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-black">Missions extraites</p>
                <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                  {missionDrafts.map((mission, index) => (
                    <div key={`${mission.titre}-${index}`} className="rounded-xl border border-slate-200 p-3">
                      <input
                        value={mission.titre}
                        onChange={(event) =>
                          setMissionDrafts((prev) =>
                            prev.map((row, idx) => (idx === index ? { ...row, titre: event.target.value } : row))
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        placeholder="Titre"
                      />
                      <textarea
                        value={mission.description}
                        onChange={(event) =>
                          setMissionDrafts((prev) =>
                            prev.map((row, idx) =>
                              idx === index ? { ...row, description: event.target.value } : row
                            )
                          )
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-gray-600"
                        rows={2}
                        placeholder="Description"
                      />
                      {mission.exemple ? (
                        <p className="mt-1 text-xs text-gray-400 italic">
                          Ex : {mission.exemple}
                        </p>
                      ) : null}
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <input
                          value={mission.duree_estimee}
                          onChange={(event) =>
                            setMissionDrafts((prev) =>
                              prev.map((row, idx) =>
                                idx === index ? { ...row, duree_estimee: event.target.value } : row
                              )
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          placeholder="Durée estimée"
                        />
                        <select
                          value={mission.niveau}
                          onChange={(event) =>
                            setMissionDrafts((prev) =>
                              prev.map((row, idx) =>
                                idx === index
                                  ? { ...row, niveau: event.target.value as MissionDraft["niveau"] }
                                  : row
                              )
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        >
                          <option value="debutant">Débutant</option>
                          <option value="intermediaire">Intermédiaire</option>
                          <option value="avance">Avancé</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={handleCreateCursus}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Valider et créer le cursus
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editCursusOpen} onOpenChange={setEditCursusOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le cursus</DialogTitle>
            <DialogDescription>Mettre à jour le nom et les missions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-black/60">Nom du cursus</label>
              <input
                value={editCursusName}
                onChange={(event) => setEditCursusName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-black">Missions</p>
              {editMissions.map((mission, index) => (
                <div key={`${mission.titre}-${index}`} className="rounded-xl border border-slate-200 p-3">
                  <input
                    value={mission.titre}
                    onChange={(event) =>
                      setEditMissions((prev) =>
                        prev.map((row, idx) =>
                          idx === index ? { ...row, titre: event.target.value } : row
                        )
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    placeholder="Titre"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddEditMission}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-900"
              >
                + Ajouter une mission
              </button>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={handleSaveEditCursus}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Sauvegarder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="sr-only">Envoyer des offres</DialogTitle>
          <DialogDescription className="sr-only">
            Sélection des offres à envoyer à un apprenant
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>
              Envoyer des offres a {selectedStudent?.first_name || "l'apprenant"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {latestOffers.length ? (
              latestOffers.map((offer) => {
                const matchScore = getMatchingScore(`${selectedStudent?.id || ""}-${offer.id}`);
                const isChecked = selectedOffers.includes(offer.id);
                return (
                  <label
                    key={offer.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedOffers((prev) => [...prev, offer.id]);
                          } else {
                            setSelectedOffers((prev) => prev.filter((id) => id !== offer.id));
                          }
                        }}
                      />
                      <span className="text-black/80">{offer.title || "Offre"}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0071E3]">{matchScore}%</span>
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-black/50">Aucune offre disponible.</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOfferDialogOpen(false)}
              className="rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Envoyer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
