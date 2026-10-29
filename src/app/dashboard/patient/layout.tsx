import { Inter, Manrope } from "next/font/google";
import { redirect } from "next/navigation";
import { CarePatientShell, type PatientSearchItem } from "@/components/care/care-patient-shell";
import { parisDateLine, parisGreeting } from "@/app/dashboard/patient/_ui/format";
import { getSession } from "@/lib/auth/session";
import { isCarePlaceholderText } from "@/lib/care/profile-format";
import { loadPatientCareHome } from "@/lib/care/patient-home";
import { formatPersonName, personInitials } from "@/lib/care/person-name";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { formatCareDateLong } from "@/lib/care/working-days";
import "../../care/care.css";
import "./patient.css";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-care-logo",
});

export const dynamic = "force-dynamic";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.id) redirect("/login?next=/dashboard/patient");
  const db = getServiceRoleClient();
  const { data: profile } = db
    ? await db.from("profiles").select("first_name, last_name, full_name").eq("id", session.id).maybeSingle()
    : { data: null };
  const full = formatPersonName(String(profile?.full_name || session.fullName || ""));
  const [fullFirst, ...fullRest] = full.split(" ").filter(Boolean);
  const firstName = formatPersonName(String(profile?.first_name || "")) || fullFirst || "";
  const lastName = formatPersonName(String(profile?.last_name || "")) || fullRest.join(" ");
  const home = await loadPatientCareHome();
  const searchItems: PatientSearchItem[] = [...home.upcoming, ...home.past].slice(0, 12).map((item) => {
    const who = formatPersonName(item.practitioner_name) || "Rendez-vous";
    const service = isCarePlaceholderText(item.service_name) ? "" : item.service_name.trim();
    return {
      id: item.id,
      href: "/dashboard/patient/rendez-vous",
      title: service ? `${who} · ${service}` : who,
      meta: formatCareDateLong(item.starts_at),
    };
  });

  return (
    <div className={`${manrope.className} ${inter.variable}`}>
      <CarePatientShell
        account={{
          firstName,
          lastName,
          initials: personInitials(firstName, lastName),
          greeting: parisGreeting(firstName),
          dateLabel: parisDateLine(),
        }}
        searchItems={searchItems}
      >
        {children}
      </CarePatientShell>
    </div>
  );
}
