"use client";

const useCases = [
  { title: "Formation interne", desc: "Transformez vos contenus internes en formats adaptés." },
  { title: "Onboarding", desc: "Accélérez la prise en main des nouveaux collaborateurs." },
  { title: "Upskilling", desc: "Développez les compétences clés de vos équipes." },
];

const stats = [
  { label: "Temps gagné", value: "–35%" },
  { label: "Satisfaction apprenants", value: "4,8/5" },
  { label: "Taux d'adoption", value: "92%" },
];

export default function EntreprisePage() {
  return (
    <div className="min-h-screen bg-white text-[#0F1117]">
      <section className="px-6 pt-28 pb-16 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] uppercase text-[#be1354] mb-4">
          Nevo. pour les entreprises
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Boostez la montée en compétences de vos équipes
        </h1>
        <p className="text-[#6B7280] max-w-2xl mx-auto">
          Centralisez vos contenus et transformez-les en expériences d'apprentissage modernes.
        </p>
      </section>

      <section className="px-6 py-14 bg-[#F8F9FC]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-3xl border border-[#E8E9F0] bg-white p-6">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[#6B7280]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-[#E8E9F0] p-6">
              <p className="text-3xl font-bold text-[#be1354]">{stat.value}</p>
              <p className="text-xs uppercase tracking-widest text-[#6B7280] mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto rounded-3xl border border-[#E8E9F0] p-8 bg-white">
          <h2 className="text-2xl font-semibold mb-4">Demander une démo</h2>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Nom"
              className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            />
            <input
              type="text"
              placeholder="Société"
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
              Demander une démo
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
