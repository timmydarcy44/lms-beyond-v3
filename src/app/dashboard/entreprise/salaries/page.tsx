"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { enterpriseEmployees } from "@/lib/mocks/enterpriseEmployees";
import { Lock } from "lucide-react";
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

const formatEuro = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const uniqueDepartments = Array.from(new Set(enterpriseEmployees.map((e) => e.department)));

export default function SalariesPage() {
  const [department, setDepartment] = useState<string>("ALL");
  const [rqth, setRqth] = useState<string>("ALL");
  const [care, setCare] = useState<string>("ALL");

  const filteredEmployees = useMemo(() => {
    return enterpriseEmployees.filter((employee) => {
      const departmentOk = department === "ALL" || employee.department === department;
      const rqthOk =
        rqth === "ALL" || (rqth === "YES" && employee.rqth) || (rqth === "NO" && !employee.rqth);
      const careOk =
        care === "ALL" || (care === "YES" && employee.careAlert) || (care === "NO" && !employee.careAlert);
      return departmentOk && rqthOk && careOk;
    });
  }, [department, rqth, care]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen px-8 py-10 pl-[260px]">
        <div className="space-y-6">
          <header>
            <h1 className="text-[26px] font-extrabold tracking-[-0.5px]">Gestion des salariés</h1>
            <p className="mt-1 text-[12px] text-white/60">Suivi RH · RQTH · Engagement</p>
          </header>

          <div className="flex flex-wrap gap-3 rounded-[18px] border border-blue-500/20 bg-white/5 p-4">
            <div className="min-w-[180px]">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="border-blue-500/20 bg-[#0B0B0B]/70 text-white">
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Département</SelectItem>
                  {uniqueDepartments.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <Select value={rqth} onValueChange={setRqth}>
                <SelectTrigger className="border-blue-500/20 bg-[#0B0B0B]/70 text-white">
                  <SelectValue placeholder="Statut RQTH" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Statut RQTH</SelectItem>
                  <SelectItem value="YES">RQTH</SelectItem>
                  <SelectItem value="NO">Non RQTH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <Select value={care} onValueChange={setCare}>
                <SelectTrigger className="border-blue-500/20 bg-[#0B0B0B]/70 text-white">
                  <SelectValue placeholder="Alerte Care" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alerte Care</SelectItem>
                  <SelectItem value="YES">Alerte active</SelectItem>
                  <SelectItem value="NO">Aucune alerte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-[20px] border border-blue-500/20 bg-white/5 p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead>Salarié</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Contrat</TableHead>
                  <TableHead>Rémunération</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="border-white/5">
                    <TableCell>
                      <Link href={`/dashboard/entreprise/salaries/${employee.id}`} className="flex items-center gap-3">
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="h-10 w-10 rounded-full border border-blue-500/20 object-cover"
                        />
                        <div>
                          <div className="text-[14px] font-semibold text-white">{employee.name}</div>
                          <div className="text-[11px] text-white/50">{employee.department}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-white/80">{employee.role}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          employee.contract === "CDI"
                            ? "bg-[#0B0B0B] text-white/80 border border-white/10"
                            : employee.contract === "CDD"
                              ? "bg-[#007BFF]/15 text-[#7FB7FF] border border-[#007BFF]/30"
                              : employee.contract === "Alternance"
                                ? "bg-[#007BFF]/15 text-[#7FB7FF] border border-[#007BFF]/30"
                                : "bg-[#007BFF]/10 text-[#7FB7FF] border border-[#007BFF]/20"
                        }`}
                      >
                        {employee.contract}
                      </span>
                    </TableCell>
                    <TableCell className="text-white/80">
                      <div
                        className="inline-flex items-center gap-2"
                        title="Donnée à accès restreint (Admin RH uniquement) - Conforme RGPD."
                      >
                        {formatEuro(employee.salary)}
                        <Lock size={12} className="text-white/40" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.rqth ? (
                        <div
                          className="inline-flex items-center gap-2"
                          title="Donnée à accès restreint (Admin RH uniquement) - Conforme RGPD."
                        >
                          <Badge className="bg-[#007BFF]/20 text-[#5DA6FF]" variant="secondary">
                            RQTH
                          </Badge>
                          <Lock size={12} className="text-white/40" />
                        </div>
                      ) : (
                        <span className="text-[12px] text-white/40">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="relative h-10 w-10">
                        <svg viewBox="0 0 48 48" className="h-10 w-10">
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            stroke="#007BFF"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 18}
                            strokeDashoffset={(1 - employee.engagement / 100) * 2 * Math.PI * 18}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold">
                          {employee.engagement}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredEmployees.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-white/50">
                      Aucun salarié ne correspond aux filtres.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
