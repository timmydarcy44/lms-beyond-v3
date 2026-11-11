"use client";

export function ExpiredScreen() {
  return (
    <main className="relative flex min-h-screen flex-col px-4 pb-10 pt-6">
      <img
        src="/brand/logo-byound-blanc.png"
        alt="Byound"
        className="h-7 w-auto self-start"
      />
      <div className="mx-auto flex flex-1 flex-col items-center justify-center text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-[28px]"
          style={{ background: "var(--ready-tile)" }}
          aria-hidden
        >
          ⏱
        </div>
        <h1 className="mt-6 text-[32px] font-extrabold tracking-[-0.045em] text-white">
          Ce lien a expiré.
        </h1>
        <p
          className="mt-3 max-w-md text-[15px] leading-relaxed"
          style={{ color: "var(--ready-muted)" }}
        >
          Pour protéger vos stagiaires, la fiche et les informations saisies ont été supprimées de
          nos serveurs.
        </p>
        <a
          href="mailto:contact@byound.fr?subject=Nouveau%20lien%20Byound%20Ready"
          className="mt-8 inline-flex rounded-full bg-white px-6 py-3.5 text-[15px] font-extrabold text-black"
        >
          Demander un nouveau lien
        </a>
        <p className="mt-5 text-[13px]" style={{ color: "var(--ready-muted)" }}>
          Votre devis et votre convention restent disponibles auprès de{" "}
          <a
            href="mailto:contact@byound.fr"
            className="underline underline-offset-2"
            style={{ color: "#FF5A00" }}
          >
            contact@byound.fr
          </a>
          .
        </p>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
        style={{ background: "var(--ready-gradient)" }}
        aria-hidden
      />
    </main>
  );
}
