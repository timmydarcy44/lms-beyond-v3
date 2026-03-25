import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">404 - Page non trouvée</h1>
        <a href="/" className="mt-4 text-blue-500 underline">
          Retour à l&apos;accueil
        </a>
      </div>
    </Suspense>
  );
}
