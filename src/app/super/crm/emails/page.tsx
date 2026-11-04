import { CrmEmailsClient } from "./crm-emails-client";

export default function CrmEmailsPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">E-mails</h1>
        <p className="text-sm text-[#9AA3BD]">
          Envoi à un contact, à un groupe ou à tout le monde.
        </p>
      </div>
      <CrmEmailsClient />
    </div>
  );
}
