"use client";

const benefits = [
  { title: "Suivi des apprenants", desc: "Vision claire des progrès et des besoins." },
  { title: "Engagement renforcé", desc: "Des contenus adaptés qui motivent." },
  { title: "Meilleurs résultats", desc: "Révisions plus efficaces et durables." },
];

export default function CFApage() {
  return (
    <div className="min-h-screen bg-white text-[#0F1117]">
      <section className="px-6 pt-28 pb-16 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] uppercase text-[#be1354] mb-4">
          Nevo. pour les CFA
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          L'outil qui accompagne vos apprenants au quotidien
        </h1>
        <p className="text-[#6B7280] max-w-2xl mx-auto">
          Neo et les transformations IA pour soutenir vos parcours pédagogiques.
        </p>
      </section>

      <section className="px-6 py-14 bg-[#F8F9FC]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-3xl border border-[#E8E9F0] bg-white p-6">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[#6B7280]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="max-w-3xl mx-auto rounded-3xl border border-[#E8E9F0] p-8 bg-white">
          <h2 className="text-2xl font-semibold mb-4">Intégration avec vos outils</h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Nevo s'intègre facilement à vos plateformes pédagogiques et LMS existants.
          </p>
          <ul className="space-y-2 text-sm text-[#6B7280]">
            <li>• Import de contenus simplifié</li>
            <li>• Support multi-formats</li>
            <li>• Compatibilité mobile</li>
          </ul>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto rounded-3xl border border-[#E8E9F0] p-8 bg-white">
          <h2 className="text-2xl font-semibold mb-4">Demander un pilote gratuit</h2>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Nom"
              className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            />
            <input
              type="text"
              placeholder="CFA"
              className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            />
            <textarea
              placeholder="Message"
              rows={4}
              className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            />
            <button
              type="submit"
              className="w-full rounded-full px-6 py-3 text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
            >
              Demander un pilote gratuit
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
