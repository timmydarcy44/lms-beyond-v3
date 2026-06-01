"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type OnboardingRow = {
  id: string;
  name: string;
  onboarding_step: string | null;
  estimated_users: number | null;
  created_from_deal: string | null;
  employee_count: number;
  drh_email: string | null;
};

function stepDots(step: string | null) {
  const order = ["invite_sent", "account_activated", "teams_created", "employees_invited", "active"];
  const idx = step ? order.indexOf(step) : 0;
  const active = idx < 0 ? 0 : idx;
  return [0, 1, 2].map((i) => i <= Math.min(active, 2));
}

export default function SuperOnboardingDashboardPage() {
  const [rows, setRows] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/super-admin/onboarding/clients");
        const json = (await res.json()) as { clients?: OnboardingRow[] };
        setRows(json.clients ?? []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Onboarding clients</h1>
        <p className="text-sm text-gray-500 mt-1">
          Progression : compte activé → équipes → collaborateurs invités
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3">Organisation</th>
                <th className="p-3">DRH</th>
                <th className="p-3">Étape</th>
                <th className="p-3">Salariés</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Aucun client en onboarding
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const dots = stepDots(r.onboarding_step);
                  return (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="p-3 font-medium">
                        <Link href={`/onboarding/${r.id}`} className="text-indigo-600 hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-600">{r.drh_email ?? "À inviter"}</td>
                      <td className="p-3">
                        <span className="inline-flex gap-1" title={r.onboarding_step ?? ""}>
                          {dots.map((on, i) => (
                            <span
                              key={i}
                              className={cn(
                                "h-2.5 w-2.5 rounded-full",
                                on ? "bg-indigo-600" : "bg-gray-200",
                              )}
                            />
                          ))}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.employee_count}
                        {r.estimated_users ? ` / ${r.estimated_users}` : ""}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
