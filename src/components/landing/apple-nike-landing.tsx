import Link from "next/link";

export function AppleNikeLanding() {
  return (
    <div className="bg-white text-black">
      <section className="relative h-screen w-full bg-black text-white">
        <img
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80"
          alt="Route vers la performance"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 flex h-full items-center px-6 sm:px-12 lg:px-24">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl">
              VOTRE CAPITAL HUMAIN. OPTIMISÉ.
            </h1>
            <p className="text-lg text-white/80">
              Plateforme de performance RH et de certification des soft skills pour des décisions
              fiables et mesurables.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] px-8 py-4 text-sm font-bold uppercase text-black shadow-[0_15px_40px_rgba(255,107,0,0.35)]"
            >
              DÉCOUVRIR LA PERFORMANCE
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Valeurs Beyond
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Transparence",
                desc: "Des décisions RH claires, appuyées par des preuves.",
              },
              {
                title: "Performance",
                desc: "Chaque action s'aligne sur un objectif ROI mesurable.",
              },
              {
                title: "Humanité",
                desc: "La data au service des personnes, pas l'inverse.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-black/10 bg-white p-8"
              >
                <h3 className="text-lg font-semibold text-black">{item.title}</h3>
                <p className="mt-3 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Graphique de ROI
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                metric: "+40%",
                label: "Fiabilité des recrutements",
              },
              {
                metric: "x2",
                label: "Rétention en formation",
              },
              {
                metric: "-30%",
                label: "Risque de turnover",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-black/10 bg-white p-8"
              >
                <div className="text-4xl font-black text-black">{item.metric}</div>
                <p className="mt-2 text-sm text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            Témoignages clients
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {[
              {
                quote:
                  "Nous avons transformé nos recrutements en levier de croissance mesurable.",
                name: "DRH, Groupe Retail",
              },
              {
                quote:
                  "Les équipes adhèrent vite parce que les résultats sont visibles en quelques semaines.",
                name: "CEO, Scale-up Tech",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-black/10 bg-white p-8"
              >
                <p className="text-base text-black">“{item.quote}”</p>
                <p className="mt-4 text-sm font-semibold text-black">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 text-sm text-gray-500">
          © Beyond 2026. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
