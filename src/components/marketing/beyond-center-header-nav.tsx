import Link from "next/link";

const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";

export function BeyondCenterHeaderNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Beyond
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm text-slate-300">
          <a href="#modules" className="hidden hover:text-white sm:inline">
            Plateforme
          </a>
          <a href="#cas-usage" className="hidden hover:text-white md:inline">
            Cas d&apos;usage
          </a>
          <Link href="/beyond-index" className="font-medium hover:text-white">
            Beyond Index
          </Link>
          <a href="#advisory" className="hover:text-white">
            Advisory
          </a>
          <Link href="/prix" className="hidden hover:text-white sm:inline">
            Prix
          </Link>
          <Link href="/login" className="hover:text-white">
            Connexion
          </Link>
          <a
            href={demoMail}
            className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950"
          >
            Demander une démo
          </a>
        </nav>
      </div>
    </header>
  );
}
