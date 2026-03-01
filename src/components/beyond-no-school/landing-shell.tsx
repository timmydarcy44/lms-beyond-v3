import type { ReactNode } from "react";

const landingStyles = `
  :root {
    --bg: #000000;
    --text: #ffffff;
    --accent: #ff6b00;
    --silver: rgba(255, 255, 255, 0.2);
    --glass: rgba(255, 255, 255, 0.05);
    --layout-padding: 48px;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: "Inter", system-ui, sans-serif;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--layout-padding);
  }
  .page-root {
    overflow-x: hidden;
  }
  .centered {
    margin: 0 auto;
    text-align: center;
  }
  .centered .section-title::after {
    left: 50%;
    transform: translateX(-50%);
  }
  .accent-gradient {
    background: linear-gradient(135deg, #ffffff 0%, #ff6b00 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  header {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: 50;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(16px);
  }
  .topbar {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
  }
  .topbar .container {
    display: flex;
    justify-content: space-between;
    padding: 8px 24px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    gap: 16px;
  }
  .logo {
    font-weight: 700;
    letter-spacing: -0.02em;
    font-size: 20px;
  }
  .menu {
    display: flex;
    align-items: center;
    gap: 28px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
  .menu a:hover {
    color: #e0e0e0;
  }
  .cta {
    background: var(--accent);
    color: #000000;
    border: none;
    padding: 10px 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.3em;
    border-radius: 999px;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 40px -18px rgba(255, 107, 0, 0.7);
  }
  .cta-outline {
    background: transparent;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: none;
  }
  .cta-outline:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }
  .cta-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(0, 0, 0, 0.2);
    font-weight: 800;
    letter-spacing: 0;
  }
  .hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
    padding-top: 120px;
  }
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2200&q=80")
      center/cover no-repeat;
  }
  .hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
  }
  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 860px;
    text-align: left;
  }
  .hero-media {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .enterprise-hero {
    height: 90vh;
    background: #000000;
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: hidden;
  }
  .enterprise-hero::before,
  .enterprise-hero::after {
    display: none;
  }
  .enterprise-hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .enterprise-hero-text {
    display: flex;
    align-items: center;
    padding: 0 var(--layout-padding);
  }
  .enterprise-hero-text-inner {
    max-width: 620px;
  }
  .enterprise-hero-media {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .enterprise-hero-media::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.7) 35%,
      rgba(0, 0, 0, 0.4) 55%,
      rgba(0, 0, 0, 0.15) 70%,
      rgba(0, 0, 0, 0) 90%
    );
  }
  .enterprise-hero-glow {
    position: relative;
  }
  .enterprise-hero-glow::before {
    content: "";
    position: absolute;
    inset: -20% -10% -20% -10%;
    background: radial-gradient(circle at left center, rgba(255, 255, 255, 0.18), rgba(0, 0, 0, 0));
    z-index: -1;
  }
  .premium-scope .section-title {
    letter-spacing: 0.08em;
  }
  .premium-scope .section-title::after {
    background: #f2f2f2;
  }
  .premium-scope .process-step {
    color: #f2f2f2;
  }
  .premium-scope .cta {
    background: #f2f2f2;
    color: #0a0a0a;
    box-shadow: none;
  }
  .premium-scope .cta:hover {
    background: transparent;
    color: #f2f2f2;
    border: 1px solid #f2f2f2;
  }
  .premium-scope .cta-outline {
    background: transparent;
    color: #f2f2f2;
    border: 1px solid #f2f2f2;
  }
  .premium-scope .cta-outline:hover {
    background: rgba(242, 242, 242, 0.12);
    color: #f2f2f2;
  }
  .enterprise-hero-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    min-height: 100%;
  }
  .enterprise-hero-text {
    display: flex;
    align-items: center;
    padding: 64px var(--layout-padding);
  }
  .enterprise-hero-text-inner {
    max-width: 560px;
  }
  .enterprise-hero-media {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .enterprise-hero-media img {
    width: 100%;
    height: 100%;
    max-height: 100%;
    object-fit: cover;
    display: block;
  }
  .hero-tag {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 18px;
    border-radius: 999px;
    font-size: 12px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
  }
  .hero-title {
    margin: 24px 0;
    font-size: clamp(30px, 3.6vw, 52px);
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.1;
  }
  .hero-subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.85);
    max-width: 720px;
  }
  .section {
    padding: 96px 0;
  }
  .section-title {
    font-size: 32px;
    font-weight: 300;
    margin-bottom: 18px;
    position: relative;
    display: inline-block;
  }
  .section-title::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -10px;
    width: 48px;
    height: 2px;
    background: var(--accent);
  }
  .slider {
    display: flex;
    gap: 24px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding: 0 var(--layout-padding) 18px;
  }
  .slider-section {
    overflow-x: hidden;
  }
  .slider-outer {
    overflow: hidden;
  }
  .slider-card {
    min-width: min(90vw, 980px);
    min-height: min(70vh, 520px);
    scroll-snap-align: start;
    background: var(--glass);
    border: 1px solid var(--silver);
    border-radius: 32px;
    padding: 48px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
    overflow: hidden;
  }
  .slider-image {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: saturate(0.9);
  }
  .slider-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.85) 0%,
      rgba(0, 0, 0, 0.45) 45%,
      rgba(0, 0, 0, 0.1) 100%
    );
  }
  .slider-content {
    position: relative;
    z-index: 2;
  }
  .slider-card h3 {
    font-size: 28px;
    margin-top: 12px;
    max-width: 620px;
  }
  .comparison {
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  .process {
    position: relative;
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
  .process::before {
    content: "";
    position: absolute;
    inset: 32px 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 12%, rgba(255, 255, 255, 0.2) 88%, rgba(255, 255, 255, 0) 100%);
  }
  .process-card {
    position: relative;
    border-radius: 24px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #101010;
  }
  .process-step {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--accent);
  }
  .comparison-card {
    border-radius: 28px;
    padding: 32px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .comparison-classic {
    background: #141414;
    color: rgba(255, 255, 255, 0.7);
  }
  .comparison-beyond {
    background: #f2f2f2;
    color: #0a0a0a;
    border-color: rgba(0, 0, 0, 0.12);
  }
  .comparison-row {
    display: grid;
    grid-template-columns: 16px 1fr;
    gap: 12px;
    align-items: start;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .comparison-beyond .comparison-row {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  .comparison-row:last-child {
    border-bottom: none;
  }
  .check-icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    font-weight: 700;
  }
  .psycho {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    min-height: 520px;
  }
  .psycho-section {
    padding: 0;
  }
  .psycho-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .psycho-content {
    display: flex;
    align-items: center;
    padding: 80px var(--layout-padding);
  }
  .psycho-content-inner {
    max-width: 560px;
  }
  .badge-grid {
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .badge {
    background: var(--glass);
    border: 1px solid var(--silver);
    border-radius: 22px;
    padding: 28px;
    transition: box-shadow 0.3s ease, border 0.3s ease;
  }
  .badge:hover {
    box-shadow: 0 22px 60px -25px rgba(255, 107, 0, 0.6);
    border-color: rgba(255, 107, 0, 0.6);
  }
  .badge-icon {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    border: 1px solid var(--silver);
    transition: background 0.3s ease, border 0.3s ease;
  }
  .badge:hover .badge-icon {
    background: rgba(255, 107, 0, 0.2);
    border-color: rgba(255, 107, 0, 0.8);
  }
  .section-note {
    color: rgba(255, 255, 255, 0.7);
  }
  .financement-bar {
    height: 2px;
    width: 120px;
    background: var(--accent);
    margin: 12px 0 24px;
  }
  .financement-grid {
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  .financement-card {
    border-radius: 26px;
    padding: 28px;
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .financement-card.alt {
    background: #f2f2f2;
    color: #0a0a0a;
    border-color: rgba(0, 0, 0, 0.12);
  }
  .recruteur-banner {
    border-radius: 28px;
    padding: 32px;
    background: #121212;
    border: 1px solid rgba(255, 107, 0, 0.35);
    box-shadow: 0 28px 80px -60px rgba(255, 107, 0, 0.4);
  }
  footer {
    padding: 48px 0 64px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    text-align: center;
  }
  @media (max-width: 900px) {
    .menu {
      display: none;
    }
    .topbar {
      display: none;
    }
  }
`;

const navLinks = [
  { label: "École", href: "/beyond-no-school/ecole" },
  { label: "Formation", href: "/beyond-no-school/formation" },
  { label: "Open Badge", href: "/beyond-no-school/open-badge" },
  { label: "Alternance", href: "/beyond-no-school/alternance" },
  { label: "Entreprises", href: "/beyond-no-school/entreprises" },
  { label: "Financement", href: "/beyond-no-school/financement" },
  { label: "Connexion", href: "/beyond-no-school/connexion" },
];

export function LandingStyles() {
  return <style>{landingStyles}</style>;
}

export function LandingHeader() {
  return (
    <header>
      <div className="topbar">
        <div className="container">
          <span>Campus Beyond · Rouen (ProAgora)</span>
          <span>Rentrée · Septembre 2026</span>
        </div>
      </div>
      <div className="container nav centered" style={{ textAlign: "left" }}>
        <a href="/beyond-no-school" className="logo">
          Beyond
        </a>
        <nav className="menu">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a href="/beyond-no-school/checkout" className="cta">
          CANDIDATER
        </a>
      </div>
    </header>
  );
}

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-black text-white page-root">
      <LandingStyles />
      <LandingHeader />
      {children}
    </main>
  );
}
