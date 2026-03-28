import Link from "next/link";

const solutions = [
  {
    title: "INGÉNIERIE PÉDAGOGIQUE",
    items: [
      {
        label: "LMS Neuro-adapté",
        description: "Interface prédictive ajustée au profil cognitif.",
      },
      {
        label: "Transformation de contenus",
        description: "Conversion auto en formats neuro-efficients.",
      },
      {
        label: "Adaptation dynamique",
        description: "Changez de format (audio, visuel, texte) selon vos besoins.",
      },
    ],
  },
  {
    title: "INTELLIGENCE COMPORTEMENTALE",
    items: [
      {
        label: "Tests de Soft Skills",
        description: "Évaluation chirurgicale du potentiel humain.",
      },
      {
        label: "Analyse des signaux faibles",
        description: "Anticipez le désengagement via le suivi en temps réel.",
      },
      {
        label: "Matching Prédictif",
        description: "Algorithme d'alignement culture et talent.",
      },
    ],
  },
  {
    title: "ÉCOSYSTÈME DE RÉUSSITE",
    items: [
      {
        label: "Certification de compétences",
        description: "Validez et badgez les acquis comportementaux.",
      },
      {
        label: "Performance RH",
        description: "Pilotez le ROI de votre capital humain par la data.",
      },
      {
        label: "Matching IA",
        description: "Trouvez le candidat parfait.",
      },
    ],
  },
];

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-white px-6 pb-20 pt-24 text-black sm:px-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-black">Solutions Beyond</p>
          <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
            Une architecture produit au service de la performance humaine.
          </h1>
          <p className="max-w-2xl text-base text-black">
            Chaque hub répond à un enjeu précis : formation, data comportementale et performance RH.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white"
            >
              Demander une démo
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-black px-6 py-3 text-sm font-semibold text-black"
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {solutions.map((column) => (
            <div key={column.title} className="space-y-4">
              <h2 className="text-xs font-bold text-black">{column.title}</h2>
              <div className="space-y-4">
                {column.items.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-black/10 p-4">
                    <div className="text-sm font-bold text-black">{item.label}</div>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
