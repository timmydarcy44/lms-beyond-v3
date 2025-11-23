import Link from "next/link";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export function JessicaContentinFooter() {
  return (
    <footer className="bg-[#E6D9C6]/30 border-t border-[#E6D9C6]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <h3
              className="text-xl font-semibold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Jessica Contentin
            </h3>
            <p
              className="text-[#2F2A25]/80 mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Psychopédagogue certifiée en neuroéducation
            </p>
            <p
              className="text-sm text-[#2F2A25]/70"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              41 C route d'Harcourt<br />
              14123 FLEURY SUR ORNE
            </p>
            <p
              className="text-sm text-[#2F2A25]/70 mt-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              📞 06 83 47 71 74
            </p>
          </div>

          {/* Navigation - Pages principales */}
          <div>
            <h4
              className="text-sm font-semibold text-[#2F2A25] mb-4 uppercase tracking-wider"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Pages
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-[#2F2A25]/80 hover:text-[#C6A664] transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="text-sm text-[#2F2A25]/80 hover:text-[#C6A664] transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/consultations" className="text-sm text-[#2F2A25]/80 hover:text-[#C6A664] transition-colors">
                  Consultations
                </Link>
              </li>
              <li>
                <Link href="/specialites" className="text-sm text-[#2F2A25]/80 hover:text-[#C6A664] transition-colors">
                  Spécialités
                </Link>
              </li>
              <li>
                <Link href="/orientation" className="text-sm text-[#2F2A25]/80 hover:text-[#C6A664] transition-colors">
                  Orientation
                </Link>
              </li>
              <li>
                <Link href="/ressources" className="text-sm text-[#2F2A25]/80 hover:text-[#C6A664] transition-colors">
                  Ressources
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-[#2F2A25]/80 hover:text-[#C6A664] transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-sm font-semibold text-[#2F2A25] mb-4 uppercase tracking-wider"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Contact
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#C6A664] hover:text-[#B88A44]"
                >
                  Prendre rendez-vous
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E6D9C6]">
          <p
            className="text-center text-sm text-[#2F2A25]/70"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            © {new Date().getFullYear()} Jessica CONTENTIN. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

