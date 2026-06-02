"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { EmptyState } from "@/components/enterprise/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Employee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  diagnostic_done: boolean;
  idmc_score: number | null;
  formation_active: boolean;
};

export default function SalariesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<string>("ALL");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/entreprise/overview", { credentials: "include" });
        const json = await res.json();
        if (res.ok && json.employees) setEmployees(json.employees);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      if (e.department) set.add(e.department);
    }
    return Array.from(set).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => department === "ALL" || e.department === department);
  }, [employees, department]);

  return (
    <div className="flex min-h-screen bg-[#fafaf8] text-gray-900">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-8 py-10 lg:pl-[280px]">
        <header className="mb-6">
          <h1 className="text-2xl font-black tracking-tight">Gestion des salariés</h1>
          <p className="mt-1 text-sm text-gray-400">Suivi RH · diagnostics · formations</p>
        </header>

        {departments.length > 0 ? (
          <div className="mb-4 max-w-xs">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="border-gray-200 bg-white">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les départements</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : employees.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Aucun salarié"
            description="Importez vos collaborateurs depuis le dashboard principal."
            action={{ label: "Retour au dashboard →", href: "/dashboard/entreprise" }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salarié</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Diagnostic</TableHead>
                  <TableHead>Formation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const name = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/entreprise/salaries/${employee.id}`}
                          className="font-semibold text-violet-600 hover:text-violet-500"
                        >
                          {name}
                        </Link>
                        <p className="text-xs text-gray-400">{employee.email}</p>
                      </TableCell>
                      <TableCell>{employee.job_title ?? "—"}</TableCell>
                      <TableCell>{employee.department ?? "—"}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            employee.diagnostic_done
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {employee.diagnostic_done ? "Complété" : "En attente"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            employee.formation_active
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {employee.formation_active ? "En cours" : "Aucune"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredEmployees.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-400">
                      Aucun salarié ne correspond au filtre.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
