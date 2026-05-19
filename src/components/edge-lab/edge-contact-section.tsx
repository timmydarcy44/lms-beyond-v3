"use client";

import { motion } from "framer-motion";

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_EDGE_CONTACT_EMAIL ?? "";

export function EdgeContactSection() {
  const mailHref = CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : undefined;

  return (
    <section id="contact" className="scroll-mt-20 border-t border-zinc-200 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-zinc-50 px-8 py-10 text-center shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-400">Contact</p>
          <h2 className="mt-3 text-2xl font-semibold text-zinc-950">Parlons de votre besoin</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Candidature, entreprise ou partenariat — nous vous répondons rapidement.
          </p>
          {mailHref ? (
            <a
              href={mailHref}
              className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              Écrire à EDGE
            </a>
          ) : (
            <p className="mt-8 text-sm text-zinc-500">
              Définissez{" "}
              <code className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-600">
                NEXT_PUBLIC_EDGE_CONTACT_EMAIL
              </code>{" "}
              pour activer le bouton e-mail.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
