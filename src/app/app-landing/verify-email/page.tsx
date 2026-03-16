"use client";

import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-8"
      />
      <div className="w-full max-w-md rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8 text-center">
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-3">Vérifiez votre boîte mail</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Nous venons d'envoyer un lien de confirmation
          {email ? ` à ${email}` : ""}. Cliquez dessus pour activer votre compte.
        </p>
        <p className="text-xs text-[#9CA3AF]">
          Si vous ne trouvez pas l'email, vérifiez vos spams ou relancez l'inscription.
        </p>
      </div>
    </div>
  );
}
