"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { resolveValidatorPhotoUrl } from "@/lib/validators/photo-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ValidatorRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  description?: string | null;
  professionnal_title?: string | null;
  photo_url?: string | null;
};

export function ValidatorsCrmClient() {
  const [rows, setRows] = useState<ValidatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    id: "" as string | undefined,
    first_name: "",
    last_name: "",
    description: "",
    photo_url: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/super-admin/validators");
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Erreur");
      return;
    }
    setRows(json.validators ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Prénom et nom requis");
      return;
    }
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      description: form.description || null,
      photo_url: form.photo_url.trim() || null,
    };
    const res = await fetch(
      form.id ? `/api/super-admin/validators/${form.id}` : "/api/super-admin/validators",
      {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Erreur");
      return;
    }
    setOpen(false);
    await load();
    toast.success("Enregistré");
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce validateur ?")) return;
    const res = await fetch(`/api/super-admin/validators/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Suppression impossible");
      return;
    }
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            setForm({ id: undefined, first_name: "", last_name: "", description: "", photo_url: "" });
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un validateur
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-14">Photo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Description / titre</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Aucun validateur
                </TableCell>
              </TableRow>
            ) : (
              rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.last_name ?? "—"}</TableCell>
                  <TableCell>{v.first_name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {v.professionnal_title ?? v.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setForm({
                            id: v.id,
                            first_name: v.first_name ?? "",
                            last_name: v.last_name ?? "",
                            description: v.description ?? "",
                            photo_url: v.photo_url ?? "",
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => void remove(v.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier" : "Nouveau validateur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Photo (URL publique)</Label>
              <Input
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://… (colonne photo_url)"
              />
              {form.photo_url.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveValidatorPhotoUrl({ photo_url: form.photo_url }) ?? form.photo_url}
                  alt=""
                  className="mt-2 h-16 w-16 rounded-full object-cover"
                />
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void save()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
