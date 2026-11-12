import { CrmEmailsClient } from "./crm-emails-client";

export default async function CrmEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; name?: string; company?: string }>;
}) {
  const params = await searchParams;
  const to = String(params.to ?? "").trim();
  const name = String(params.name ?? "").trim();
  const lockedRecipient =
    to.includes("@")
      ? { email: to, name: name || to.split("@")[0] || to }
      : undefined;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">E-mails</h1>
        <p className="text-sm text-[#9AA3BD]">
          Envoi à un contact, à un groupe ou à tout le monde.
          {params.company ? ` · ${params.company}` : ""}
        </p>
      </div>
      <CrmEmailsClient lockedRecipient={lockedRecipient} />
    </div>
  );
}
