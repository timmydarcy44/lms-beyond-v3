"use client";

const features = [
  { id: "fiches", title: "Fiches de révision", desc: "Génère une fiche structurée en 1 clic." },
  { id: "reformulation", title: "Reformulation IA", desc: "4 styles adaptés à ton niveau." },
  { id: "traduction", title: "Traduction", desc: "Traduis ton cours instantanément." },
  { id: "schemas", title: "Schémas visuels", desc: "Transforme le texte en schéma." },
  { id: "flashcards", title: "Flashcards", desc: "Révision espacée intelligente." },
  { id: "quiz", title: "Quiz adaptatif", desc: "QCM, Vrai/Faux, textes à trou." },
  { id: "audio", title: "Audio du cours", desc: "Écoute ton cours en déplacement." },
  { id: "notes", title: "Notes enrichies", desc: "Prends des notes et transforme-les." },
  { id: "focus", title: "Mode Focus", desc: "Lecture sans distraction." },
  { id: "pomodoro", title: "Pomodoro", desc: "Sessions de travail optimisées." },
  { id: "neuro", title: "Neuro adapté", desc: "Interface DYS/TDAH friendly." },
  { id: "neo", title: "Neo IA", desc: "Ton assistant personnel 24h/24." },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F1117]">
      <section className="px-6 pt-28 pb-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#be1354] mb-3">
          Solutions
        </p>
        <h1 className="text-4xl font-bold mb-4">Toutes les fonctionnalités Nevo.</h1>
        <p className="text-[#6B7280]">De l'upload à la révision, tout est couvert.</p>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              id={feature.id}
              className="rounded-3xl border border-[#E8E9F0] p-6 bg-white scroll-mt-32"
            >
              <div className="h-40 rounded-2xl bg-[#F8F9FC] border border-[#E8E9F0] flex items-center justify-center mb-4 text-[#be1354] font-semibold">
                Screenshot / Mockup
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-[#6B7280]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
