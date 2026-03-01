import type { Metadata } from "next";
import { ManifestoModal } from "@/components/beyond-connect/manifesto-modal";

export const metadata: Metadata = {
  title: "Beyond Connect - Elite Matching Platform",
  description:
    "Beyond Connect : la première plateforme qui certifie vos soft skills et vous connecte à l'élite.",
};

export default function ConnectPage() {
  return (
    <main className="min-h-screen bg-[#050A18] text-white">
      <style>{`
        .phone-glow {
          box-shadow: 0 0 120px rgba(229, 229, 229, 0.12);
        }
        .mock-card {
          opacity: 0;
          transform: translateY(12px);
          animation: mockIn 0.6s ease forwards;
        }
        @keyframes mockIn {
          to { opacity: 1; transform: translateY(0); }
        }
        .notify {
          animation: notifyPulse 6s infinite;
        }
        .phone-screen {
          background: #0b0f1f;
        }
        @keyframes notifyPulse {
          0% { opacity: 0; transform: translateY(16px); }
          12% { opacity: 1; transform: translateY(0); }
          55% { opacity: 1; transform: translateY(0); }
          70% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .talent-scroll {
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        .talent-snap {
          scroll-snap-align: start;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050A18]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white">BEYOND CONNECT</div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-[#E5E5E5]">By Beyond</div>
          </div>
          <div className="flex items-center gap-6 text-xs tracking-[0.2em] text-[#E5E5E5]">
            <a href="#recruteurs">Recruteurs</a>
            <a href="#talents">Talents</a>
            <a href="#consortium">Consortium</a>
            <a href="#insights">Insights</a>
            <a href="https://beyond-no-school.vercel.app" target="_blank" rel="noreferrer">
              Campus
            </a>
            <a
              href="/login"
              className="rounded-sm border border-white px-4 py-2 text-[11px] font-semibold text-white"
            >
              Connexion
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6" id="recruteurs">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-6xl">
              LE MATCHING DE HAUTE PERFORMANCE.
            </h1>
            <p className="max-w-xl text-base text-[#E5E5E5]">
              La première plateforme qui certifie vos soft skills et vous connecte à l&apos;élite.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/login"
                className="rounded-sm bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#050A18]"
              >
                Connexion
              </a>
              <a
                href="/signup"
                className="rounded-sm border border-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white"
                id="talents"
              >
                S&apos;inscrire
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="phone-glow grid w-full max-w-lg gap-4 sm:grid-cols-2">
              {[
                {
                  name: "Camille R.",
                  score: 92,
                  certified: true,
                  img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
                },
                {
                  name: "Nicolas M.",
                  score: 87,
                  certified: false,
                  img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
                },
                {
                  name: "Sami L.",
                  score: 95,
                  certified: true,
                  img: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
                },
                {
                  name: "Alex P.",
                  score: 83,
                  certified: false,
                  img: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=300&q=80",
                },
              ].map((item, index) => (
                <div
                  key={item.name}
                  className="mock-card rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{item.name}</p>
                        {item.certified && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#050A18]">
                            B
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#E5E5E5]">
                        % de matching avec l&apos;offre
                      </p>
                      <p className="text-xs text-[#E5E5E5]">{item.score}%</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-white" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-10">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tighter sm:text-5xl">
              LE DIPLÔME EST UNE BASE, LE TEMPÉRAMENT EST UNE ARME.
            </h2>
            <ManifestoModal />
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter">L&apos;ACTIF DE CONFIANCE</h2>
            <p className="text-sm leading-relaxed text-[#E5E5E5]">
              Passez de la déclaration à la preuve. Beyond Connect utilise la technologie des{" "}
              <strong>Open Badges</strong> pour certifier vos <strong>soft skills</strong> (aptitudes
              comportementales). Notre plateforme de <strong>matching haute performance</strong> élimine les biais du
              CV classique pour mettre en lumière votre véritable <strong>valeur terrain</strong> auprès d&apos;un
              consortium d&apos;entreprises leaders.
            </p>
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[#E5E5E5]">
              Vérifié par la Blockchain
            </span>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5">
            <video
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/video_header%20(2).mp4"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A18] via-transparent to-transparent" />
          </div>
        </section>

        <section className="space-y-6" id="insights">
          <h2 className="text-3xl font-bold tracking-tighter">INSIGHTS</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#E5E5E5]">98% de réussite au matching</p>
              <div className="mt-6 h-32 w-full">
                <svg className="h-full w-full" viewBox="0 0 200 60" fill="none">
                  <path
                    d="M0 50 L40 32 L80 38 L120 18 L160 26 L200 8"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#E5E5E5]">Top Soft Skill : Résilience</p>
              <div className="mt-6 h-32 w-full">
                <svg className="h-full w-full" viewBox="0 0 200 60" fill="none">
                  <path
                    d="M0 45 L50 30 L100 34 L150 20 L200 12"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6" id="consortium">
          <h2 className="text-3xl font-bold tracking-tighter">LE CONSORTIUM</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Ligue 1", "Pro A", "Entreprises leaders", "Sport & Business"].map((label) => (
              <div
                key={label}
                className="flex items-center justify-center rounded-xl border border-white/10 py-6 text-xs uppercase tracking-[0.3em] text-[#E5E5E5]"
              >
                {label}
              </div>
            ))}
          </div>
        </section>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-xs text-[#E5E5E5]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p>Beyond Connect © 2026. Part of Beyond Ecosystem.</p>
            <div className="flex items-center gap-4 uppercase tracking-[0.3em] text-[#E5E5E5]">
              <a href="/legal">Mentions légales</a>
              <a href="/privacy">Confidentialité</a>
            </div>
          </div>
          <p className="uppercase tracking-[0.3em] text-[#E5E5E5]">
            Certifié par la technologie Open Badge &amp; Sécurisé par la Blockchain
          </p>
          <div className="flex items-center gap-4 text-[#E5E5E5]">
            <span className="rounded-full border border-white/20 px-3 py-1">IG</span>
            <span className="rounded-full border border-white/20 px-3 py-1">TT</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
