import Link from "next/link";

export default function LivretStubPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-[#F2F4FA]">
      <h1 className="text-3xl font-extrabold">Livret et absences</h1>
      <p className="mt-3 text-[#9AA3BD]">
        Cette page arrive au Lot 5. Tu peux déjà signaler une absence ici :
      </p>
      <Link
        href="/dashboard/apprenant/planning/absences"
        className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0A0F1E]"
      >
        Mes absences →
      </Link>
    </div>
  );
}
