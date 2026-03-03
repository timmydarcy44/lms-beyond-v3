import Link from "next/link";

export function PaywallLMS() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/15 bg-white/5 p-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Accès réservé aux membres de la formation</h1>
        <p className="mt-3 text-sm text-white/70">
          Votre compte n a pas encore l accès LMS actif.
        </p>
        <Link
          href="/produits/lms"
          className="mt-6 inline-flex rounded-full bg-[#FF6B00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55f00]"
        >
          S'abonner
        </Link>
      </div>
    </div>
  );
}

