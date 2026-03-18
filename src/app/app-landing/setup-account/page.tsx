export default function SetupAccountPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 py-12">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-10"
      />
      <div className="w-full max-w-md rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8 text-center">
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-3">
          Votre inscription est presque terminée !
        </h1>
        <p className="text-sm text-[#6B7280]">
          Un lien de validation vient de vous être envoyé par e-mail. Merci de cliquer sur ce lien
          pour finaliser la création de votre compte Nevo.
        </p>
      </div>
    </div>
  );
}
