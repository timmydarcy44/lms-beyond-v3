"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mockUsers, type MockUser } from "@/lib/mocks/appData";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const getDysConcentration = (executive?: number | null) => {
  if (!executive) return "jamais";
  if (executive >= 5) return "toujours";
  if (executive >= 4) return "souvent";
  if (executive >= 3) return "parfois";
  return "jamais";
};

const computeStressScoreGlobal = (stress?: { physical?: number; management?: number } | null) => {
  if (!stress) return 0;
  const physical = stress.physical ?? 0;
  const management = stress.management ?? 0;
  return Math.round((physical + Math.max(0, 5 - management)) * 5);
};

const futureAppointments = new Set<string>(["mock-10"]);

type LocalStudent = MockUser & {
  is_temp?: boolean;
  has_future_rdv?: boolean;
  test_results?: {
    stress_score_global?: number;
    dys_concentration?: string;
  };
};

export default function HandicapPage() {
  const [students, setStudents] = useState<LocalStudent[]>(() =>
    mockUsers.map((student) => ({ ...student }))
  );
  const [newStudentName, setNewStudentName] = useState("");
  const [newIsDys, setNewIsDys] = useState(false);
  const [newIsStressHigh, setNewIsStressHigh] = useState(false);

  const handleAddStudent = () => {
    const trimmed = newStudentName.trim();
    if (!trimmed) return;
    const [firstName, ...rest] = trimmed.split(" ");
    const lastName = rest.join(" ") || "Test";
    const newStudent: LocalStudent = {
      id: `temp-${Date.now()}`,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@beyond-demo.fr`,
      phone: "06 00 00 00 00",
      school_class: "BTS MCO",
      contract_type: "Alternance",
      avatar_url:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      disc_profile: "Stable",
      disc_scores: { D: 40, I: 50, S: 70, C: 60 },
      soft_skills_scores: {
        Empathie: 70,
        Resilience: 70,
        Leadership: 60,
        Negotiation: 55,
        Rigueur: 65,
      },
      open_badges: [],
      tutor_feedback: "Profil ajouté pour test.",
      cognitive_tests: {
        mai: {
          global: 0,
          declarative: 0,
          procedures: 0,
          conditional: 0,
          error_management: 0,
        },
        stress: {
          restricted: false,
          physical: newIsStressHigh ? 4 : 0,
          management: newIsStressHigh ? 1 : 0,
        },
        dys: {
          restricted: false,
          oral_language: 0,
          executive: newIsDys ? 4 : 0,
          motor: 0,
        },
      },
      test_results: {
        stress_score_global: newIsStressHigh ? 18 : 0,
        dys_concentration: newIsDys ? "souvent" : "jamais",
      },
      is_temp: true,
    };
    setStudents((prev) => [newStudent, ...prev]);
    setNewStudentName("");
    setNewIsDys(false);
    setNewIsStressHigh(false);
  };

  const handlePassTests = (id: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== id) return student;
        const safeMai =
          student.cognitive_tests?.mai ?? {
            global: 0,
            declarative: 0,
            procedures: 0,
            conditional: 0,
            error_management: 0,
          };
        return {
          ...student,
          cognitive_tests: {
            ...student.cognitive_tests,
            mai: safeMai,
            stress: {
              restricted: false,
              physical: 4,
              management: 1,
            },
            dys: {
              restricted: false,
              oral_language: 2,
              executive: 4,
              motor: 2,
            },
          },
        };
      })
    );
  };

  const filteredStudents = useMemo(() => {
    return students
      .map((student) => {
        const stressScoreGlobal =
          student.test_results?.stress_score_global ?? computeStressScoreGlobal(student.cognitive_tests?.stress || null);
        const dysConcentration =
          student.test_results?.dys_concentration?.toLowerCase() ??
          getDysConcentration(student.cognitive_tests?.dys?.executive);
        const hasFutureAppointment = futureAppointments.has(student.id) || !!student.has_future_rdv;
        const needsFollowUp =
          stressScoreGlobal > 15 || ["souvent", "toujours"].includes(dysConcentration) || hasFutureAppointment;

        return {
          student,
          stressScoreGlobal,
          dysConcentration,
          needsFollowUp,
        };
      })
      .filter((row) => row.needsFollowUp);
  }, [students]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#1D1D1F] md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Galerie de centralisation</h1>
          <p className="mt-2 text-sm text-slate-500">Accès rapide aux pilotages individuels.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">+ Ajouter un apprenant</p>
              <p className="text-xs text-slate-500">Ajoutez un profil puis simulez un passage de tests.</p>
            </div>
            <div className="flex flex-1 gap-2 md:max-w-md">
              <input
                value={newStudentName}
                onChange={(event) => setNewStudentName(event.target.value)}
                placeholder="Ex: Test User"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              <button
                type="button"
                onClick={handleAddStudent}
                className="rounded-xl bg-[#D65151] px-4 py-2 text-xs font-semibold text-white"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newIsDys}
                  onChange={(event) => setNewIsDys(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#D65151]"
                />
                Profil DYS
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newIsStressHigh}
                  onChange={(event) => setNewIsStressHigh(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#D65151]"
                />
                Stress Élevé
              </label>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map(({ student, dysConcentration, stressScoreGlobal }) => {
              const fullName = `${student.first_name} ${student.last_name}`;
              const slug = slugify(fullName);
              const isValentin = fullName.toLowerCase().includes("valentin");
              const isDys = ["souvent", "toujours"].includes(dysConcentration);
              const statusLabel = isDys ? "Suivi DYS" : "Suivi Méthodo";
              const statusStyle = isValentin
                ? "bg-[#FCECEC] text-[#D65151] border border-[#F2C7C7]"
                : isDys
                  ? "bg-[#FCECEC] text-[#D65151]"
                  : "bg-slate-100 text-slate-700";

              return (
                <div key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        student.avatar_url ||
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={fullName}
                      className="h-12 w-12 rounded-2xl border border-[#E5E5EA] object-cover"
                    />
                    <div>
                      <p className="text-lg font-semibold">{fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">{student.school_class}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className={`inline-flex rounded-full px-3 py-1 font-semibold ${statusStyle}`}>
                      {statusLabel}
                    </span>
                    {stressScoreGlobal > 15 ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                        Stress élevé
                      </span>
                    ) : null}
                    {student.is_temp ? (
                      <span className="rounded-full border border-[#D65151] px-3 py-1 font-semibold text-[#D65151]">
                        0% Complet
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/dashboard/ecole/handicap/pilotage/${student.id}`}
                      className="inline-flex rounded-full bg-[#D65151] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Ouvrir le Pilotage
                    </Link>
                    {student.is_temp ? (
                      <button
                        type="button"
                        onClick={() => handlePassTests(student.id)}
                        className="ml-2 inline-flex rounded-full border border-[#D65151] px-3 py-2 text-xs font-semibold text-[#D65151]"
                      >
                        Passer les tests
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
        </section>
      </div>
    </div>
  );
}
