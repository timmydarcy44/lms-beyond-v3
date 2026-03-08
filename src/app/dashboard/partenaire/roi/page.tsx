"use client";

import { useMemo } from "react";
import jsPDF from "jspdf";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PartenaireLayout } from "@/components/partenaire/partenaire-layout";
import { partenaireClub, partenaireProfile } from "@/lib/mocks/partenaire-data";

const monthlyData = [
  { month: "Sep", visibilite: 680, investissement: 417 },
  { month: "Oct", visibilite: 920, investissement: 417 },
  { month: "Nov", visibilite: 1100, investissement: 417 },
  { month: "Dec", visibilite: 750, investissement: 417 },
  { month: "Jan", visibilite: 1200, investissement: 417 },
  { month: "Fev", visibilite: 1450, investissement: 417 },
  { month: "Mar", visibilite: 1680, investissement: 417 },
];

const valuationRows = [
  {
    label: "Panneau bord terrain 3m x 1m",
    real: "14 matchs × 450 spectateurs avg",
    unit: "0,08€ / spectateur / match",
    total: "504€",
  },
  {
    label: "Logo site web club",
    real: "12 400 visiteurs uniques / mois",
    unit: "0,12€ / vue unique",
    total: "1 488€",
  },
  {
    label: "Pack match day réseaux sociaux",
    real: "3 posts × 2 800 vues avg",
    unit: "0,30€ / vue",
    total: "2 520€",
  },
  {
    label: "Story Instagram match",
    real: "8 stories × 1 200 vues avg",
    unit: "0,25€ / vue",
    total: "2 400€",
  },
  {
    label: "Mentions dans newsletter",
    real: "6 newsletters × 340 abonnés",
    unit: "0,45€ / lecture",
    total: "918€",
  },
  {
    label: "Présence en tribune VIP",
    real: "4 événements × valeur perçue",
    unit: "150€ / personne / événement",
    total: "600€",
  },
];

export default function PartenaireRoiPage() {
  const investissement = 5000;
  const totalVisibilite = 8430;

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFillColor("#C8102E");
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor("#FFFFFF");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Rapport ROI — SU Dives Cabourg", 14, 16);
    doc.setFontSize(10);
    doc.text("Rapport généré par Beyond Network", 14, 23);

    doc.setTextColor("#1B2A4A");
    doc.setFontSize(12);
    doc.text("KPIs principaux", 14, 38);
    doc.setFontSize(10);
    doc.text(`Investissement total : ${investissement.toLocaleString("fr-FR")}€ HT`, 14, 46);
    doc.text(`Valeur visibilité générée : ${totalVisibilite.toLocaleString("fr-FR")}€`, 14, 52);
    doc.text("ROI estimé : ×3.2", 14, 58);

    doc.setFontSize(12);
    doc.text("Détail de votre visibilité", 14, 70);
    let y = 78;
    valuationRows.forEach((row) => {
      doc.setFontSize(9);
      doc.text(`${row.label} — ${row.total}`, 14, y);
      doc.setFontSize(8);
      doc.text(`${row.real} | ${row.unit}`, 14, y + 4);
      y += 10;
    });

    doc.setFontSize(10);
    doc.text("Rapport généré par Beyond Network", 14, 285);
    doc.save("rapport-roi-sudc.pdf");
  };

  const canalTotals = useMemo(
    () => [
      { label: "Stade & Physique", value: 1504, pct: 18 },
      { label: "Réseaux Sociaux", value: 4920, pct: 58, badge: "Canal le plus performant" },
      { label: "Digital", value: 2406, pct: 28 },
    ],
    []
  );

  return (
    <PartenaireLayout
      activeItem="Mon ROI"
      club={{ name: partenaireClub.name, initials: partenaireClub.initials, logoUrl: partenaireClub.logoUrl }}
      partner={{ name: partenaireProfile.name, initials: partenaireProfile.initials }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-black text-white">Mon ROI — Saison 2025/2026</div>
          <div className="text-sm text-white/60">
            Brasserie du Port — Pack {partenaireProfile.pack}
          </div>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
        >
          📄 Télécharger le rapport PDF
        </button>
      </div>

      <section className="mb-8 mt-6 grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <div className="text-sm text-white/60">Investissement total</div>
          <div className="mt-2 text-3xl font-black text-white">5 000€ HT</div>
          <div className="text-xs text-white/50">Pack Argent — annuel</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <div className="text-sm text-white/60">Valeur visibilité générée</div>
          <div className="mt-2 text-3xl font-black text-blue-300">16 240€</div>
          <div className="text-xs text-white/50">Estimation basée sur les données réelles</div>
          <div className="mt-2 text-xs text-green-400">▲ +224% vs investissement</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <div className="text-sm text-white/60">ROI estimé</div>
          <div className="mt-2 text-4xl font-black text-green-400">×3.2</div>
          <div className="text-xs text-white/50">Retour sur investissement</div>
          <div className="mt-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
            Au-dessus de la moyenne
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <div className="text-sm text-white/60">Matchs couverts</div>
          <div className="mt-2 text-3xl font-black text-white">14</div>
          <div className="text-xs text-white/50">sur 17 matchs joués</div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 w-[82%] rounded-full bg-[#C8102E]" />
          </div>
        </div>
      </section>

      <section>
        <div className="text-lg font-semibold text-white">Détail de votre visibilité</div>
        <div className="text-sm text-white/60">Comment on calcule votre ROI</div>
        <div className="mt-4 overflow-hidden rounded-2xl bg-[#111827]">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/5 text-xs uppercase text-white/50">
              <tr>
                <th className="px-4 py-3">Prestation</th>
                <th className="px-4 py-3">Données réelles</th>
                <th className="px-4 py-3">Valeur unitaire</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {valuationRows.map((row) => (
                <tr key={row.label} className="border-t border-white/5">
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3">{row.real}</td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3 text-right">{row.total}</td>
                </tr>
              ))}
              <tr className="border-t border-white/5 bg-white/5">
                <td className="px-4 py-3 font-semibold text-white">TOTAL VISIBILITÉ GÉNÉRÉE</td>
                <td />
                <td />
                <td className="px-4 py-3 text-right font-semibold text-white">8 430€</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-white/50">
          Valorisation calculée selon les référentiels de l'IREP (Institut de Recherche et d'Études Publicitaires)
          adaptés au football amateur N3
        </div>
      </section>

      <section className="mt-8">
        <div className="text-lg font-semibold text-white">Évolution de votre visibilité</div>
        <div className="mt-4 h-[260px] rounded-2xl border border-white/10 bg-[#111827] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#0b1424", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Legend />
              <Bar dataKey="visibilite" name="Visibilité générée" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="investissement" name="Coût mensuel partenariat" fill="#C8102E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-8">
        <div className="text-lg font-semibold text-white">Répartition par canal</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {canalTotals.map((canal) => (
            <div key={canal.label} className="rounded-2xl border border-white/10 bg-[#111827] p-5">
              <div className="text-sm text-white/60">{canal.label}</div>
              <div className="mt-2 text-2xl font-black text-white">{canal.value.toLocaleString("fr-FR")}€</div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-[#C8102E]" style={{ width: `${canal.pct}%` }} />
              </div>
              <div className="mt-2 text-xs text-white/50">
                {canal.label === "Stade & Physique" && "Panneaux, bâches, présence physique"}
                {canal.label === "Réseaux Sociaux" && "Posts, stories, mentions"}
                {canal.label === "Digital" && "Site web, newsletter, SEO local"}
              </div>
              {canal.badge && (
                <div className="mt-2 inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                  {canal.badge}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-[#111827] p-6">
        <div className="text-lg font-semibold text-white">Votre investissement vs le marché</div>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <div className="flex items-center justify-between">
            <div>
              Publicité Google Ads locale — 16 000€ visibilité
              <div className="text-xs text-white/50">Coût marché : 8 000€</div>
              <div className="text-xs text-white/50">Votre coût via SUDC : 5 000€</div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
              Vous économisez 3 000€
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              Publicité Facebook/Instagram locale — 16 000€ visibilité
              <div className="text-xs text-white/50">Coût marché : 6 400€</div>
              <div className="text-xs text-white/50">Votre coût : 5 000€</div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
              Vous économisez 1 400€
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              Affichage panneau 4x3 local (6 mois)
              <div className="text-xs text-white/50">Coût marché : 4 200€ pour visibilité moindre</div>
            </div>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
              Couverture 3x supérieure
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#8B0000] p-8 text-center">
        <div className="text-sm text-white/70">Votre partenariat se termine dans 5 mois</div>
        <div className="mt-2 text-2xl font-black text-white">Renouveler ou upgrader votre pack ?</div>
        <div className="mt-2 text-sm text-white/80">
          Pack Or disponible — Ajoutez le logo maillot et doublez votre visibilité
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#C8102E]">
            Renouveler Pack Argent — 5 000€
          </button>
          <button className="rounded-full border border-white px-5 py-2 text-sm text-white">
            Passer au Pack Or — 10 000€ →
          </button>
        </div>
      </section>
    </PartenaireLayout>
  );
}
