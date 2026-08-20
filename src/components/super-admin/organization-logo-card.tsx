"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  organizationId: string;
  organizationName: string;
  initialLogoUrl: string | null;
};

export function OrganizationLogoCard({ organizationId, organizationName, initialLogoUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [preview, setPreview] = useState<string | null>(initialLogoUrl);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/super-admin/organisations/${organizationId}/logo`, {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "UPLOAD_FAILED");

      const nextUrl = typeof json?.logo_url === "string" ? json.logo_url : null;
      setLogoUrl(nextUrl);
      setPreview(nextUrl);
      toast.success("Logo enregistré", {
        description: "Il apparaîtra en haut de la sidebar des dashboards de cette organisation.",
      });
      router.refresh();
    } catch (e) {
      setPreview(logoUrl);
      toast.error("Échec upload logo", {
        description: e instanceof Error ? e.message : "Impossible d'enregistrer le logo",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("remove", "1");
      const res = await fetch(`/api/super-admin/organisations/${organizationId}/logo`, {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "REMOVE_FAILED");
      setLogoUrl(null);
      setPreview(null);
      toast.success("Logo retiré");
      router.refresh();
    } catch (e) {
      toast.error("Impossible de retirer le logo", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Logo organisation</CardTitle>
        <CardDescription>
          Affiché en haut de la sidebar des dashboards dédiés à {organizationName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {preview ? (
            <div className="relative h-20 w-20">
              <Image src={preview} alt={`Logo ${organizationName}`} fill className="object-contain" unoptimized />
            </div>
          ) : (
            <span className="px-2 text-center text-xs text-slate-400">Aucun logo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-full"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {preview ? "Remplacer" : "Ajouter un logo"}
          </Button>
          {preview ? (
            <Button type="button" variant="outline" disabled={busy} onClick={() => void remove()} className="rounded-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Retirer
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
