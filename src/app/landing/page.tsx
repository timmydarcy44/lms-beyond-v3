import { AppleNikeLanding } from "@/components/landing/apple-nike-landing";
import Navigation from "@/components/landing/navigation";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <div className="fixed top-0 z-[1100] flex h-10 w-full items-center border-b border-gray-200 bg-white px-6 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-end">
          <Link
            href="/particuliers"
            className="text-[12px] font-semibold text-black transition hover:text-black/70"
          >
            Je suis un particulier
          </Link>
        </div>
      </div>
      <Navigation topOffsetClass="top-10" />
      <AppleNikeLanding />
    </>
  );
}
