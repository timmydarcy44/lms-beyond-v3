import { CrmEmailsClient } from "./crm-emails-client";

export default function CrmEmailsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Resend</p>
        <h1 className="text-3xl font-bold text-gray-900">Emails</h1>
        <p className="text-sm text-gray-600">
          Diffusion ciblée ou globale depuis l’espace super-admin.
        </p>
      </div>
      <CrmEmailsClient />
    </div>
  );
}
