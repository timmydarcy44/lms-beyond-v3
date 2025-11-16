"use client";

import Link from "next/link";

const footerLinks = {
  produit: [
    { label: "Fonctionnalités", href: "#fonctionnalités" },
    { label: "Philosophie", href: "#philosophie" },
    { label: "Science", href: "#science" },
  ],
  ressources: [
    { label: "Documentation", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Support", href: "/support" },
  ],
  entreprise: [
    { label: "À propos", href: "/about" },
    { label: "Carrières", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  légal: [
    { label: "Mentions légales", href: "/legal" },
    { label: "Confidentialité", href: "/privacy" },
    { label: "CGU", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#F8F9FB] border-t border-[#0B0B0C]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-16">
          {/* Logo and Description */}
          <div className="col-span-2">
            <div className="text-2xl font-medium text-[#0B0B0C] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond
            </div>
            <p className="text-[#0B0B0C]/50 text-sm leading-relaxed mb-6 font-light max-w-xs" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
              Au-delà de la formation, l'intelligence du calme.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-[#0B0B0C] font-medium mb-4 text-sm tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Produit
            </h3>
            <ul className="space-y-3">
              {footerLinks.produit.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#0B0B0C]/50 hover:text-[#0B0B0C] transition-colors font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-[#0B0B0C] font-medium mb-4 text-sm tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Ressources
            </h3>
            <ul className="space-y-3">
              {footerLinks.ressources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#0B0B0C]/50 hover:text-[#0B0B0C] transition-colors font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-[#0B0B0C] font-medium mb-4 text-sm tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Entreprise
            </h3>
            <ul className="space-y-3">
              {footerLinks.entreprise.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#0B0B0C]/50 hover:text-[#0B0B0C] transition-colors font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-[#0B0B0C] font-medium mb-4 text-sm tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Légal
            </h3>
            <ul className="space-y-3">
              {footerLinks.légal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#0B0B0C]/50 hover:text-[#0B0B0C] transition-colors font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#0B0B0C]/5 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-[#0B0B0C]/40 font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
            © {new Date().getFullYear()} Beyond LMS. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-sm text-[#0B0B0C]/40 hover:text-[#0B0B0C] transition-colors font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
            >
              Confidentialité
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[#0B0B0C]/40 hover:text-[#0B0B0C] transition-colors font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
            >
              Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
