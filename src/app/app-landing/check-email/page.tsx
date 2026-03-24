"use client";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-6">
        <img
          src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
          alt="Nevo"
          className="h-14"
        />
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold text-[#0F1117]">
            Bonjour, je suis{" "}
            <span className="bg-gradient-to-r from-[#f97316] to-[#ef4444] bg-clip-text text-transparent">
              Néo
            </span>{" "}
            !
          </h1>
          <p className="mt-4 text-sm text-[#4B5563]">
            Ravi de vous rencontrer. Pour finaliser votre inscription, un lien vient de vous être envoyé sur
            votre boîte mail. Cliquez dessus et on se retrouve juste après !
          </p>
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Surtout, n'oubliez pas de jeter un œil dans vos spams si vous ne voyez rien.
          </p>
        </div>
      </div>
    </div>
  );
}
