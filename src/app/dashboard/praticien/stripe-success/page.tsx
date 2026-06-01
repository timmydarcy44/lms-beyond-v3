import Link from "next/link";

export default function StripeSuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <p className="text-4xl">✅</p>
      <h1 className="mt-4 text-xl font-bold">Stripe Connect configuré</h1>
      <p className="mt-2 max-w-md text-slate-400 text-sm">
        Votre compte sera activé sur la marketplace dès validation BCT et synchronisation Stripe.
      </p>
      <Link href="/dashboard/praticien" className="mt-8 text-violet-400">
        Retour au tableau de bord →
      </Link>
    </main>
  );
}
