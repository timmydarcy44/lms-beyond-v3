import Link from "next/link";
import { redirect } from "next/navigation";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { SchoolStudentProfile } from "@/components/beyond-connect/school-student-profile";
import { fetchLearnerWalletBadges } from "@/lib/dashboard/ecole-learner-wallet";
import { SchoolAdminDocumentsModal } from "@/components/beyond-connect/school-admin-documents-modal";
import { EcoleApprenantBoard } from "@/components/beyond-connect/ecole-apprenant-board";
import { type CompanyOption } from "@/components/beyond-connect/school-student-alternance-panel";
import {
  fetchEcoleLearnerPedagogy,
  type EcoleLearnerPedagogySnapshot,
} from "@/lib/dashboard/ecole-learner-pedagogy";
import { deriveEcolePlacementDisplay } from "@/lib/dashboard/ecole-learner-placement-display";
import { SchoolStudentAdminFieldsPanel } from "@/components/beyond-connect/school-student-admin-fields-panel";
import { mockOffers, mockUsers } from "@/lib/mocks/appData";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const EMPTY_PEDAGOGY: EcoleLearnerPedagogySnapshot = { courses: [], quizzes: [], transformations: [] };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ id?: string }>;
};

export default async function SchoolStudentByIdPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const isDemo = session.role === "demo";
  const gate = await fetchSchoolGateProfile(session.id, session.email, supabase);
  const requestPath = await getMiddlewarePathname();
  const allowedEcole = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: requestPath || undefined,
  });

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const profileId =
    isUuid(id) ? id : resolvedSearchParams?.id && isUuid(resolvedSearchParams.id) ? resolvedSearchParams.id : id;

  const mockProfile = mockUsers.find((user) => user.id === profileId);

  let profile: Record<string, unknown> | null = null;

  const viewingSelf = isUuid(String(profileId)) && session.id === profileId;

  if (!allowedEcole && !viewingSelf) {
    redirect("/dashboard/apprenant");
  }

  let resolvedSchoolId: string | null = null;
  let companies: CompanyOption[] = [];
  let listClientForSchool = supabase;

  if (allowedEcole) {
    resolvedSchoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
    try {
      listClientForSchool = await getServiceSupabase();
    } catch {
      listClientForSchool = supabase;
    }
    if (resolvedSchoolId) {
      const { data: compRows } = await listClientForSchool
        .from("crm_prospects")
        .select(
          "id, company_name, name, city, address, contact_email, contact_phone, opco_name, siret, contact_firstname, contact_lastname",
        )
        .eq("school_id", resolvedSchoolId)
        .order("company_name", { ascending: true })
        .limit(500);
      companies = (compRows ?? []) as CompanyOption[];
    }
  }

  let walletEarnedBadges: Awaited<ReturnType<typeof fetchLearnerWalletBadges>> = [];

  if (allowedEcole && isUuid(String(profileId))) {
    if (resolvedSchoolId) {
      const { data: p } = await listClientForSchool.from("profiles").select("*").eq("id", profileId).maybeSingle();
      if (p) {
        const prof = p as { school_id?: string | null; id?: string };
        const sameSchool = prof.school_id != null && String(prof.school_id) === resolvedSchoolId;
        const { data: pivot } = await listClientForSchool
          .from("school_students")
          .select("student_id")
          .eq("school_id", resolvedSchoolId)
          .eq("student_id", profileId)
          .maybeSingle();
        const inPivot = Boolean(pivot?.student_id);
        if (sameSchool || inPivot) {
          profile = p as Record<string, unknown>;
          walletEarnedBadges = await fetchLearnerWalletBadges(listClientForSchool, String(profileId));
        }
      }
    }
  } else if (viewingSelf) {
    const { data: selfRow } = await supabase.from("profiles").select("*").eq("id", session.id).maybeSingle();
    profile = (selfRow as Record<string, unknown> | null) ?? null;
  }

  if (!profile && !mockProfile) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] px-6 py-10 text-[#1D1D1F]">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
          Profil introuvable.
        </div>
      </div>
    );
  }

  const resolvedProfile = profile || mockProfile;
  const schoolFk =
    resolvedProfile && typeof resolvedProfile === "object" && "school_id" in resolvedProfile
      ? (resolvedProfile as { school_id?: string | null }).school_id
      : null;

  let offersQuery = supabase.from("job_offers").select("id, title, city, salary, description, school_id");
  if (schoolFk) {
    offersQuery = offersQuery.eq("school_id", schoolFk);
  }
  const { data: offers } = await offersQuery.order("created_at", { ascending: false }).limit(12);

  const learnerIdForPanels =
    resolvedProfile && typeof resolvedProfile === "object" && "id" in resolvedProfile && resolvedProfile.id
      ? String(resolvedProfile.id)
      : String(profileId);

  const rp = resolvedProfile as Record<string, unknown>;
  const initialPlacement =
    typeof rp.placement_status === "string" && rp.placement_status.trim() ? rp.placement_status.trim() : null;
  const initialDob =
    rp.date_of_birth != null && String(rp.date_of_birth).trim() ? String(rp.date_of_birth).slice(0, 10) : null;
  const initialPermis = typeof rp.has_driving_license_b === "boolean" ? rp.has_driving_license_b : null;

  const showStaffAdmin = allowedEcole && isUuid(String(profileId)) && Boolean(resolvedSchoolId);

  const learnerIdForAlternance = learnerIdForPanels;

  const initialHost =
    rp.host_company_prospect_id != null && String(rp.host_company_prospect_id).trim()
      ? String(rp.host_company_prospect_id)
      : null;
  const initialTutorName =
    rp.enterprise_tutor_name != null && String(rp.enterprise_tutor_name).trim()
      ? String(rp.enterprise_tutor_name)
      : null;
  const initialTutorEmail =
    rp.enterprise_tutor_email != null && String(rp.enterprise_tutor_email).trim()
      ? String(rp.enterprise_tutor_email)
      : null;

  const showEcoleAlternanceTabs = allowedEcole && isUuid(String(profileId)) && Boolean(resolvedSchoolId);

  let pedagogy = EMPTY_PEDAGOGY;
  if (showEcoleAlternanceTabs && listClientForSchool) {
    try {
      pedagogy = await fetchEcoleLearnerPedagogy(listClientForSchool, String(profileId));
    } catch (e) {
      console.error("[ecole/apprenants] pedagogy", e);
    }
  }

  const placementDisplay = deriveEcolePlacementDisplay(initialHost, initialPlacement);

  const profileBlock = (
    <SchoolStudentProfile
      profile={resolvedProfile}
      offers={offers?.length ? offers : mockOffers}
      walletEarnedBadges={walletEarnedBadges}
      ecoleStaffSimplified={false}
    />
  );

  return showEcoleAlternanceTabs ? (
    <EcoleApprenantBoard
      profile={resolvedProfile as Record<string, unknown>}
      learnerId={learnerIdForAlternance}
      schoolId={resolvedSchoolId}
      companies={companies}
      walletEarnedBadges={walletEarnedBadges}
      offers={(offers?.length ? offers : mockOffers) as { id: string; title?: string | null; city?: string | null; salary?: string | null }[]}
      initialPlacement={initialPlacement}
      initialDob={initialDob}
      initialPermis={initialPermis}
      initialHost={initialHost}
      initialTutorName={initialTutorName}
      initialTutorEmail={initialTutorEmail}
      placementDisplayLabel={placementDisplay.label}
      pedagogy={pedagogy}
    />
  ) : (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link
          href="/dashboard/ecole/apprenants"
          className="text-sm font-medium text-[#86868B] transition hover:text-[#1D1D1F]"
        >
          ← Mes apprenants
        </Link>
        <SchoolAdminDocumentsModal profile={resolvedProfile} />
        <>
          {showStaffAdmin ? (
            <SchoolStudentAdminFieldsPanel
              schoolId={resolvedSchoolId}
              learnerId={learnerIdForPanels}
              initialPlacementStatus={initialPlacement}
              initialDateOfBirth={initialDob}
              initialHasDrivingLicenseB={initialPermis}
            />
          ) : null}
          {profileBlock}
        </>
      </div>
    </div>
  );
}
