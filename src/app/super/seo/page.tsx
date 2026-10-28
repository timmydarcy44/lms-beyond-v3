import { SeoConsole } from "@/components/super-admin/seo-console";

export default function SuperSeoPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">SEO & indexation IA</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Titles, meta descriptions, H1/H2, FAQ et résumés pour Google, ChatGPT, Perplexity et les crawlers IA.
          Les pages indexables alimentent aussi /sitemap.xml, /robots.txt et /llms.txt.
        </p>
        <div className="mt-8">
          <SeoConsole />
        </div>
      </div>
    </div>
  );
}
