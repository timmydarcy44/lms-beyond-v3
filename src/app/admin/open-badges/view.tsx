"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AuthContext = {
  userId: string;
  orgId: string;
  role: string;
} | null;

type AssessmentItem = {
  assessmentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  earner: { id: string; displayName?: string | null };
  badgeClass: { id: string; name: string; imageUrl?: string | null };
  evidenceCount: number;
  issued?: { assertionId?: string | null };
};

type FilterOptions = {
  badgeClasses: Array<{ id: string; name: string }>;
  earners: Array<{ id: string; displayName?: string | null }>;
};

const statusLabel = (status: string) => {
  switch (status) {
    case "ISSUED":
      return "Émis";
    case "NEEDS_INFO":
      return "Infos requises";
    case "REJECTED":
      return "Refusé";
    case "APPROVED":
      return "Validé";
    case "SUBMITTED":
    default:
      return "Soumis";
  }
};

export default function OpenBadgesInboxView({ auth }: { auth: AuthContext }) {
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [badgeClassId, setBadgeClassId] = useState<string>("ALL");
  const [earnerId, setEarnerId] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");
  const [options, setOptions] = useState<FilterOptions>({ badgeClasses: [], earners: [] });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const filtersReady = useMemo(() => auth !== null, [auth]);

  useEffect(() => {
    const loadFilters = async () => {
      if (!auth) return;
      const res = await fetch(`/api/admin/open-badges/filters`, {
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
          "x-user-role": auth.role,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      setOptions({
        badgeClasses: json.badgeClasses ?? [],
        earners: json.earners ?? [],
      });
    };
    loadFilters();
  }, [auth]);

  const fetchItems = async (cursor?: string | null, append = false) => {
    if (!auth) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (badgeClassId !== "ALL") params.set("badgeClassId", badgeClassId);
    if (earnerId !== "ALL") params.set("earnerId", earnerId);
    if (query.trim().length > 0) params.set("q", query.trim());
    if (cursor) params.set("cursor", cursor);
    if (!cursor) params.set("includeTotal", "true");
    const res = await fetch(`/api/admin/open-badges/assessments?${params.toString()}`, {
      headers: {
        "x-user-id": auth.userId,
        "x-org-id": auth.orgId,
        "x-user-role": auth.role,
      },
    });
    setLoading(false);
    if (!res.ok) return;
    const json = await res.json();
    setNextCursor(json.nextCursor ?? null);
    if (!cursor) {
      setTotalCount(typeof json.totalCount === "number" ? json.totalCount : null);
      setHasLoadedOnce(true);
    }
    setItems((prev) => (append ? [...prev, ...(json.items ?? [])] : json.items ?? []));
  };

  useEffect(() => {
    if (!filtersReady) return;
    const timeout = setTimeout(() => {
      fetchItems(null, false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [filtersReady, status, badgeClassId, earnerId, query]);

  const isDefaultFilters =
    status === "ALL" && badgeClassId === "ALL" && earnerId === "ALL" && query.trim().length === 0;

  const resetFilters = () => {
    setStatus("ALL");
    setBadgeClassId("ALL");
    setEarnerId("ALL");
    setQuery("");
    setItems([]);
    setNextCursor(null);
    setTotalCount(null);
    setHasLoadedOnce(false);
  };

  if (!auth) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Organisation introuvable pour cet admin.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-slate-600">
          {hasLoadedOnce ? (
            <>
              <span>{totalCount ?? 0} résultats</span>
              <span className="ml-3">{items.length} affichés</span>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          )}
        </div>
        <Input
          className="w-64"
          placeholder="Rechercher..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            <SelectItem value="SUBMITTED">Soumis</SelectItem>
            <SelectItem value="NEEDS_INFO">Infos requises</SelectItem>
            <SelectItem value="REJECTED">Refusé</SelectItem>
            <SelectItem value="ISSUED">Émis</SelectItem>
          </SelectContent>
        </Select>
        <Select value={badgeClassId} onValueChange={setBadgeClassId}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Badge" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les badges</SelectItem>
            {options.badgeClasses.map((badge) => (
              <SelectItem key={badge.id} value={badge.id}>
                {badge.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={earnerId} onValueChange={setEarnerId}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Apprenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les apprenants</SelectItem>
            {options.earners.map((earner) => (
              <SelectItem key={earner.id} value={earner.id}>
                {earner.displayName ?? "Apprenant"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={resetFilters} disabled={isDefaultFilters}>
          Réinitialiser
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Badge</TableHead>
              <TableHead>Apprenant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Maj</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  Aucune demande.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.assessmentId}>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900">{item.badgeClass.name}</div>
                    <div className="text-xs text-slate-500">Preuves: {item.evidenceCount}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {item.earner.displayName ?? "Apprenant"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{statusLabel(item.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className="text-xs font-semibold text-blue-600 hover:underline"
                      href={`/admin/open-badges/${item.assessmentId}`}
                    >
                      Ouvrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchItems(nextCursor, true)}
            disabled={loading}
          >
            Charger plus
          </Button>
        </div>
      ) : null}
    </div>
  );
}
