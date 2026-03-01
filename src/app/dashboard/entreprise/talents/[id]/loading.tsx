export default function TalentProfileLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-[#050A18]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[#050A18]" />
        <p className="text-sm text-[#050A18]/70">Chargement du profil...</p>
      </div>
    </main>
  );
}
