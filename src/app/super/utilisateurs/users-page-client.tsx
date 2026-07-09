"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CRM_ROLE_LABELS,
  formatCrmRoleLabel,
  type CrmUserListItem,
} from "@/lib/crm/crm-shared";

type UsersPageClientProps = {
  initialUsers: CrmUserListItem[];
  initialRole?: string;
};

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Tous les labels" },
  ...Object.entries(CRM_ROLE_LABELS).map(([value, label]) => ({ value, label })),
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: "bg-violet-100 text-violet-800 border-violet-200",
  instructor: "bg-sky-100 text-sky-800 border-sky-200",
  learner: "bg-emerald-100 text-emerald-800 border-emerald-200",
  student: "bg-emerald-100 text-emerald-800 border-emerald-200",
  tutor: "bg-amber-100 text-amber-800 border-amber-200",
  btoc: "bg-rose-100 text-rose-800 border-rose-200",
  demo: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function UsersPageClient({ initialUsers, initialRole = "all" }: UsersPageClientProps) {
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialUsers.filter((user) => {
      const roleOk = selectedRole === "all" || user.role === selectedRole;
      if (!roleOk) return false;
      if (!q) return true;
      const orgNames = user.organizations.map((o) => o.name).join(" ");
      const haystack = [
        user.firstName,
        user.lastName,
        user.email,
        orgNames,
        formatCrmRoleLabel(user.role),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [initialUsers, selectedRole, search]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialUsers.length };
    for (const user of initialUsers) {
      counts[user.role] = (counts[user.role] ?? 0) + 1;
    }
    return counts;
  }, [initialUsers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher un contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-300"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px] border-gray-300">
              <SelectValue placeholder="Filtrer par label" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.value !== "all" && roleCounts[opt.value] != null
                    ? ` (${roleCounts[opt.value]})`
                    : opt.value === "all"
                      ? ` (${roleCounts.all})`
                      : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/super/utilisateurs/new">
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau contact
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filteredUsers.length} contact{filteredUsers.length > 1 ? "s" : ""}
        {selectedRole !== "all" ? ` · label ${formatCrmRoleLabel(selectedRole)}` : ""}
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Nom</TableHead>
              <TableHead className="font-semibold text-gray-700">Prénom</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Organization</TableHead>
              <TableHead className="font-semibold text-gray-700">Label</TableHead>
              <TableHead className="font-semibold text-gray-700">Dernière connexion</TableHead>
              <TableHead className="font-semibold text-gray-700">Création compte</TableHead>
              <TableHead className="font-semibold text-gray-700 text-center">Quiz / tests</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Chiffre d&apos;affaires</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-gray-500">
                  Aucun contact trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const roleStyle =
                  ROLE_BADGE_STYLES[user.role] ?? "bg-gray-100 text-gray-700 border-gray-200";
                const orgLabel =
                  user.organizations.length > 0
                    ? user.organizations.map((o) => o.name).join(", ")
                    : "—";

                return (
                  <TableRow key={user.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">{user.lastName}</TableCell>
                    <TableCell className="text-gray-800">{user.firstName}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[160px] truncate" title={orgLabel}>
                      {orgLabel}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs font-medium border ${roleStyle}`}>
                        {formatCrmRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(user.lastSignInAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 text-center tabular-nums">
                      {user.testCount}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 text-right font-medium tabular-nums">
                      {formatCurrency(user.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild className="text-xs">
                        <Link href={`/super/utilisateurs/${user.id}`}>Voir le profil</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
