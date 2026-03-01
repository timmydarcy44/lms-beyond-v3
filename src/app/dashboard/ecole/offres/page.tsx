"use client";

import { computeDiscMatch, mockOffers, mockUsers } from "@/lib/mocks/appData";

export default function SchoolOffersPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Offres commerciales</h1>
          <p className="mt-2 text-sm text-[#86868B]">
            Liste des offres en cours pour vos entreprises partenaires.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mockOffers.map((offer) => {
            const topMatches = mockUsers
              .map((user) => ({
                user,
                score: computeDiscMatch(user.disc_scores, offer.target_disc),
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 5);

            return (
            <div key={offer.id} className="rounded-2xl border border-[#E5E5EA] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                {offer.logo_url ? (
                  <img
                    src={offer.logo_url}
                    alt={offer.title}
                    className="h-10 w-10 rounded-full border border-[#E5E5EA] object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold">
                    BC
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold">{offer.title}</p>
                  <p className="text-xs text-[#86868B]">{offer.city}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#1D1D1F]/80">{offer.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#86868B]">
                <span className="rounded-full border border-[#E5E5EA] px-3 py-1">
                  Profil idéal: {offer.desired_profile}
                </span>
                {offer.disc_focus ? (
                  <span className="rounded-full border border-[#E5E5EA] px-3 py-1">
                    Focus Test comportemental: {offer.disc_focus}
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868B]">
                  Top 5 Matching
                </p>
                <div className="mt-2 flex flex-nowrap gap-3 overflow-x-auto pb-2">
                  {topMatches.map(({ user, score }) => (
                    <div
                      key={`${offer.id}-${user.id}`}
                      className="flex flex-shrink-0 items-center gap-2 rounded-full border border-[#E5E5EA] bg-white px-2 py-1"
                    >
                      <img
                        src={user.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"}
                        alt={`${user.first_name} ${user.last_name}`}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-[#1D1D1F]">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
          })}
        </section>
      </div>
    </div>
  );
}
