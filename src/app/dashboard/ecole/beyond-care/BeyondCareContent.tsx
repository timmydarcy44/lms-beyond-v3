\"use client\";

import { useState } from \"react\";
import {
  Brain,
  CalendarCheck,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Users,
} from \"lucide-react\";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from \"recharts\";

export const dynamic = \"force-dynamic\";

const profileData = {
  fullName: \"Jade Letellier\",
  cursus: \"BTS MCO\",
  referent: \"Mme CONTENTIN\",
  disc: { D: 62, I: 78, S: 70, C: 55 },
  softSkills: [
    { label: \"Empathie\", value: 88 },
    { label: \"Résilience\", value: 82 },
    { label: \"Leadership\", value: 74 },
    { label: \"Rigueur\", value: 68 },
    { label: \"Créativité\", value: 65 },
  ],
  tests: [
    { label: \"MAI (Apprentissage)\", score: 78, insight: \"Bonne autonomie d'apprentissage.\" },
    { label: \"STRESS\", score: 16, insight: \"Stress modéré, pics en période d'examens.\" },
    { label: \"Pré-diagnostic DYS\", score: 42, insight: \"Attention fluctuante, vigilance sur l'organisation.\" },
  ],
  signals: {
    posture: \"Engagé\",
    themes: [\"Confiance en soi\", \"Estime de soi\", \"Gestion du temps\", \"Organisation\"],
  },
  recommendations: [
    \"Structurer les tâches en micro-objectifs hebdomadaires.\",
    \"Prévoir un point hebdo école/entreprise pour aligner la charge.\",
    \"Mettre en place un plan d'apprentissage visuel (mindmap).\",
    \"Limiter les pics de stress avant examens via rituels de récupération.\",
  ],
};

const discPalette = [\"#D65151\", \"#F2B86B\", \"#7CC4A5\", \"#6A8FE6\"];

export default function BeyondCareContent() {
  const [showRecommendations, setShowRecommendations] = useState(false);

  return (
    <div className=\"min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10\">
      <div className=\"mx-auto w-full max-w-[1400px] space-y-6\">
        <header className=\"flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm\">
          <div className=\"flex items-center gap-4\">
            <div className=\"flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F5F7]\">
              <ShieldCheck className=\"h-6 w-6 text-[#D65151]\" />
            </div>
            <div>
              <p className=\"text-xs uppercase tracking-[0.2em] text-[#86868B]\">Beyond Care</p>
              <h1 className=\"text-2xl font-semibold\">{profileData.fullName}</h1>
              <p className=\"text-sm text-[#86868B]\">{profileData.cursus}</p>
            </div>
          </div>
          <div className=\"text-sm text-[#86868B]\">
            Référente : <span className=\"font-semibold text-[#1D1D1F]\">{profileData.referent}</span>
          </div>
        </header>

        <section className=\"rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm\">
          <div className=\"flex items-center gap-2 text-sm font-semibold\">
            <Sparkles className=\"h-4 w-4 text-[#D65151]\" />
            Data 360°
          </div>
          <div className=\"mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3\">
            <div className=\"rounded-2xl border border-[#E5E5EA] bg-white p-4\">
              <p className=\"text-xs uppercase tracking-[0.2em] text-[#86868B]\">Test comportemental</p>
              <div className=\"mt-4 flex items-center gap-4\">
                <div
                  className=\"h-24 w-24 rounded-full\"
                  style={{
                    background: `conic-gradient(${discPalette[0]} 0 25%, ${discPalette[1]} 25% 50%, ${discPalette[2]} 50% 75%, ${discPalette[3]} 75% 100%)`,
                  }}
                />
                <div className=\"space-y-1 text-xs text-[#86868B]\">
                  {[
                    { label: \"Dominant\", value: profileData.disc.D },
                    { label: \"Influent\", value: profileData.disc.I },
                    { label: \"Stable\", value: profileData.disc.S },
                    { label: \"Consciencieux\", value: profileData.disc.C },
                  ].map((item) => (
                    <div key={item.label} className=\"flex items-center justify-between gap-4\">
                      <span>{item.label}</span>
                      <span className=\"font-semibold text-[#1D1D1F]\">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className=\"rounded-2xl border border-[#E5E5EA] bg-white p-4\">
              <p className=\"text-xs uppercase tracking-[0.2em] text-[#86868B]\">Soft Skills</p>
              <div className=\"mt-4 h-44\">
                <ResponsiveContainer width=\"100%\" height=\"100%\">
                  <RadarChart data={profileData.softSkills}>
                    <PolarGrid stroke=\"#E5E5EA\" />
                    <PolarAngleAxis dataKey=\"label\" tick={{ fill: \"#86868B\", fontSize: 10 }} />
                    <Radar dataKey=\"value\" stroke=\"#D65151\" fill=\"rgba(214,81,81,0.25)\" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className=\"rounded-2xl border border-[#E5E5EA] bg-white p-4\">
              <p className=\"text-xs uppercase tracking-[0.2em] text-[#86868B]\">Tests Cognitifs</p>
              <div className=\"mt-4 h-44\">
                <ResponsiveContainer width=\"100%\" height=\"100%\">
                  <BarChart data={profileData.tests}>
                    <XAxis dataKey=\"label\" tick={{ fill: \"#86868B\", fontSize: 9 }} />
                    <YAxis tick={{ fill: \"#86868B\", fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey=\"score\" fill=\"#E86B6B\" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className=\"mt-3 space-y-2 text-xs text-[#86868B]\">
                {profileData.tests.map((test) => (
                  <div key={test.label} className=\"flex items-start gap-2\">
                    <Brain className=\"mt-0.5 h-3 w-3 text-[#D65151]\" />
                    <span>{test.insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className=\"rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm\">
          <div className=\"flex items-center gap-2 text-sm font-semibold\">
            <Users className=\"h-4 w-4 text-[#D65151]\" />
            Signaux de l'accompagnement
          </div>
          <div className=\"mt-4 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] p-4\">
            <p className=\"text-sm font-semibold\">
              Posture actuelle : <span className=\"text-[#D65151]\">{profileData.signals.posture}</span>
            </p>
            <div className=\"mt-3 flex flex-wrap gap-2 text-xs text-[#86868B]\">
              {profileData.signals.themes.map((theme) => (
                <span key={theme} className=\"rounded-full bg-white px-3 py-1 text-[#1D1D1F]\">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className=\"grid gap-3 md:grid-cols-[1.5fr_1fr]\">
          <button
            type=\"button\"
            onClick={() => setShowRecommendations((prev) => !prev)}
            className=\"flex items-center justify-between rounded-2xl border border-[#E5E5EA] bg-[#1D1D1F] px-6 py-4 text-left text-white\"
          >
            <span className=\"text-sm font-semibold\">
              Comment améliorer la scolarité et l'alternance de ce jeune ?
            </span>
            <HeartPulse className=\"h-5 w-5\" />
          </button>
          <button
            type=\"button\"
            className=\"flex items-center justify-between rounded-2xl border border-[#E5E5EA] bg-white px-6 py-4 text-left text-[#1D1D1F]\"
          >
            <span className=\"text-sm font-semibold\">Prendre rendez-vous avec la psychopédagogue</span>
            <CalendarCheck className=\"h-5 w-5 text-[#D65151]\" />
          </button>
        </section>

        {showRecommendations ? (
          <section className=\"rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm\">
            <p className=\"text-xs uppercase tracking-[0.2em] text-[#86868B]\">Préconisations</p>
            <ul className=\"mt-4 space-y-3 text-sm text-[#1D1D1F]\">
              {profileData.recommendations.map((item) => (
                <li key={item} className=\"flex items-start gap-2\">
                  <Sparkles className=\"mt-0.5 h-4 w-4 text-[#D65151]\" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
