import Image from "next/image";
import { HOME_LOGOS } from "@/content/home";

export function HomeSocialProof() {
  if (HOME_LOGOS.length === 0) return null;
  return (
    <section className="bg-white px-6 py-10">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-8">
        <p className="text-[15px] font-bold text-[#3A3D45]">Ils nous font confiance</p>
        <ul className="flex flex-wrap items-center gap-8">
          {HOME_LOGOS.map((logo) => (
            <li key={logo.name}>
              <Image src={logo.src} alt={logo.name} width={120} height={32} className="h-8 w-auto opacity-70 grayscale transition hover:opacity-100" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
