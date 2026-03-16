"use client";

const sections = [
  {
    title: "Neo répond à vos questions",
    text: "Pose une question et obtiens une réponse claire, concise et utile.",
  },
  {
    title: "Neo retrouve vos cours",
    text: "Il retrouve le bon document, même si tu n'as qu'un bout de phrase.",
  },
  {
    title: "Neo lance vos transformations",
    text: "Fiches, quiz, schémas et audio en une demande.",
  },
  {
    title: "Neo parle, vous écoutez",
    text: "Synthèse vocale naturelle pour réviser en déplacement.",
  },
];

export default function DecouvrezNeoPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      <section className="px-6 pt-28 pb-20 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] uppercase text-white/50 mb-4">
          Découvrez Neo
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Rencontrez Neo, votre assistant IA</h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Neo comprend vos cours, répond à vos questions et déclenche les transformations en un clic.
        </p>
      </section>

      <section className="flex flex-col items-center justify-center py-8">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          />
          <div
            className="absolute inset-4 rounded-full animate-pulse opacity-40"
            style={{ background: "linear-gradient(135deg, #F97316, #be1354)" }}
          />
          <div
            className="absolute inset-8 rounded-full"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          />
          <div className="absolute inset-12 rounded-full bg-white/80" />
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
              <p className="text-white/70">{section.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20 text-center">
        <a
          href="/app-landing/signup"
          className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-[#be1354] font-semibold"
        >
          Essayer Neo gratuitement
        </a>
      </section>
    </div>
  );
}
