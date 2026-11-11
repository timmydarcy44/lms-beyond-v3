import { render } from "@react-email/render";
import { BackstageEmail } from "../../../../emails/backstage/BackstageEmail";
import { BackstageReminderEmail } from "../../../../emails/backstage/BackstageReminderEmail";
import { BACKSTAGE_CHECKLIST } from "@/lib/formation-documents/backstage";

export const dynamic = "force-dynamic";

/** Prévisualisation locale — http://localhost:3001/dev/backstage-emails */
export default async function DevBackstageEmailsPage() {
  const sampleDocs = [
    {
      key: "programme",
      title: "Programme",
      subtitle: "Objectifs et déroulé",
      href: "#",
      iconBg: "#6E5BFF",
      iconLabel: "P",
    },
    {
      key: "participants",
      title: "Participants",
      subtitle: "2 inscrits · fonctions",
      href: "#",
      iconBg: "#3B82F6",
      iconLabel: "2",
    },
    {
      key: "infos",
      title: "Infos pratiques",
      subtitle: "Accès, contact sur place",
      href: "#",
      iconBg: "#F59E0B",
      iconLabel: "i",
    },
  ];

  const backstageHtml = await render(
    BackstageEmail({
      preheader:
        "Byound Backstage · votre session de lundi chez Printngo : émargement, checklist et documents.",
      trainerFirstName: "Hugo",
      dateLabel: "Lundi 9 novembre",
      dayPartPill: "Matin",
      courseTitle: "Analyse comportementale appliquée au management",
      locationKindLabel: "Lieu · chez le client",
      locationDetail: "51 Rue des Saules, 14760 Carpiquet",
      clientName: "Printngo",
      participantCount: 2,
      emargerUrl: "https://www.byound.fr/e?slot=demo",
      qrImageUrl:
        "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fwww.byound.fr%2Fe%3Fslot%3Ddemo",
      checklist: BACKSTAGE_CHECKLIST.map((c) => ({ moment: c.moment, text: c.text })),
      docs: sampleDocs,
      formateurUrl: "https://www.byound.fr/dashboard/formateur",
      contactName: "Timmy Darcy",
      contactPhone: "06 00 00 00 00",
      contactInitials: "TD",
    }),
  );

  const reminderHtml = await render(
    BackstageReminderEmail({
      preheader: "Backstage · c'est aujourd'hui, ouvrez l'émargement",
      dateLine: "Lundi 9 novembre · 09:00 · 51 Rue des Saules, 14760 Carpiquet",
      emargerUrl: "https://www.byound.fr/e?slot=demo",
      contactName: "Timmy Darcy",
      contactPhone: "06 00 00 00 00",
    }),
  );

  return (
    <main className="min-h-screen bg-[#111] px-4 py-8 text-white">
      <h1 className="mb-6 text-2xl font-bold">Dev · Backstage emails</h1>
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Backstage (J-2)</h2>
        <iframe
          title="backstage"
          srcDoc={backstageHtml}
          className="h-[900px] w-full max-w-[640px] rounded-xl bg-white"
        />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Rappel jour J</h2>
        <iframe
          title="rappel"
          srcDoc={reminderHtml}
          className="h-[520px] w-full max-w-[640px] rounded-xl bg-white"
        />
      </section>
    </main>
  );
}
