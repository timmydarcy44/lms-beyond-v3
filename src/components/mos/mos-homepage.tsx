import { MosHeader } from "@/components/mos/mos-header";
import { MosHero } from "@/components/mos/mos-hero";
import { MosCalendar } from "@/components/mos/mos-calendar";
import { MosNews } from "@/components/mos/mos-news";
import { MosClub100 } from "@/components/mos/mos-club-100";
import { MosAdn } from "@/components/mos/mos-adn";
import { MosStats } from "@/components/mos/mos-stats";
import { MosBoutique } from "@/components/mos/mos-boutique";
import { MosLifestyle } from "@/components/mos/mos-lifestyle";
import { MosFooter } from "@/components/mos/mos-footer";

export function MosHomepage() {
  return (
    <>
      <MosHeader />
      <main>
        <MosHero />
        <MosCalendar />
        <MosNews />
        <MosClub100 />
        <MosAdn />
        <MosStats />
        <MosBoutique />
        <MosLifestyle />
      </main>
      <MosFooter />
    </>
  );
}
