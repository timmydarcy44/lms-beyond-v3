"use client";

export function CandidateConfirmationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="text-center">
        <div className="mb-4 text-6xl">⏳</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Confirmation en cours...
        </h1>
        <p className="text-gray-600">
          Veuillez patienter pendant que nous confirmons votre inscription.
        </p>
      </div>
    </div>
  );
}

