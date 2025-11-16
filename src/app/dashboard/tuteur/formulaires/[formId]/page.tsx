import { DashboardShell } from '@/components/dashboard/dashboard-shell';

type TutorFormDetailPageProps = {
  params: Promise<{ formId: string }>;
};

export default async function TutorFormDetailPage({ params }: TutorFormDetailPageProps) {
  const { formId } = await params;

  return (
    <DashboardShell
      title="Formulaire de suivi"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tuteur', href: '/dashboard/tuteur' },
        { label: 'Formulaires', href: '/dashboard/tuteur/formulaires' },
        { label: formId },
      ]}
    >
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-white">
        <h1 className="text-2xl font-semibold">Formulaire #{formId}</h1>
        <p className="mt-3 text-sm text-white/70">
          Cette vue accueillera prochainement la restitution du questionnaire et le formulaire de réponse alimenté depuis Supabase.
        </p>
      </div>
    </DashboardShell>
  );
}




