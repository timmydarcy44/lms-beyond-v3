import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PdfViewer } from "@/components/formateur/drive/pdf-viewer";
import { getFormateurDriveDocumentById } from "@/lib/queries/formateur";

type PageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DriveDocumentPreviewPage({ params }: PageProps) {
  const { documentId } = await params;
  const document = await getFormateurDriveDocumentById(documentId);

  if (!document) {
    return (
      <DashboardShell
        title="Document introuvable"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/formateur" },
          { label: "Formateur", href: "/dashboard/formateur" },
          { label: "Drive", href: "/dashboard/formateur/drive" },
          { label: "Introuvable" },
        ]}
      >
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="py-12 text-center text-sm text-white/70">
            Ce document n'existe plus ou a été archivé.
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={document.title}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Drive", href: "/dashboard/formateur/drive" },
        { label: document.title },
      ]}
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Prévisualisation PDF</CardTitle>
          </CardHeader>
          <CardContent className="h-[70vh] overflow-hidden rounded-3xl bg-black/50 p-4">
            <PdfViewer
              fileUrl={document.fileUrl}
              documentTitle={document.title}
              documentId={document.id}
              className="h-full"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-4 p-6 text-sm text-white/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Auteur</p>
                  <p className="text-base font-semibold text-white">{document.author}</p>
                  <p className="text-xs text-white/60">{document.authorRole}</p>
                </div>
                <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                  Déposé {document.depositedAt}
                </Badge>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Résumé</p>
                <p>{document.summary || "Résumé à venir."}</p>
              </div>
              {document.wordCount ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Volume</p>
                  <p>{document.wordCount.toLocaleString("fr-FR")}&nbsp;mots</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Usage IA</p>
                <UsageScore value={document.aiUsageScore} />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                {document.fileUrl && document.fileUrl.trim() ? (
                  <Button asChild className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-white/20">
                    <Link href={document.fileUrl} target="_blank" rel="noreferrer">
                      Télécharger
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/40 cursor-not-allowed">
                    Télécharger
                  </Button>
                )}
                <button
                  type="button"
                  className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] bg-clip-text text-transparent hover:opacity-80"
                >
                  Commenter
                </button>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 hover:border-white/30 hover:text-white"
                >
                  <Link href="/dashboard/formateur/drive">Revenir au drive</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function UsageScore({ value }: { value: number }) {
  const tone =
    value >= 75
      ? "bg-rose-500/10 text-rose-200"
      : value >= 50
        ? "bg-orange-500/10 text-orange-200"
        : value >= 25
          ? "bg-amber-500/10 text-amber-200"
          : "bg-emerald-500/10 text-emerald-200";

  return (
    <Badge className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${tone}`}>
      {value.toFixed(0)}% d'utilisation IA
    </Badge>
  );
}





