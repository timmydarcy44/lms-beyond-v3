"use client";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-center">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-6"
      />
      <div className="w-full max-w-lg rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-3">Lien envoyé !</h1>
        <p className="text-sm text-[#6B7280]">
          Cliquez sur le bouton dans votre boîte mail pour accéder à Nevo.
        </p>
      </div>
    </div>
  );
}
