"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, FileText, Target, User } from "lucide-react";
import { motion } from "framer-motion";

type EmployeeInfo = {
  name: string;
  role: string;
  contract: string;
};

const objectivesList = [
  "Renforcer la résolution de problèmes complexes",
  "Améliorer l'autonomie sur des missions critiques",
  "Structurer les méthodes de travail",
  "Optimiser la prise de décision",
];

const opcos = ["Atlas", "Akto", "Opco EP", "Opco 2i", "Opco Santé", "Afdas"];

export default function AfestModal({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  employee: EmployeeInfo;
}) {
  const [step, setStep] = useState(1);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [situation, setSituation] = useState("");
  const [referentName, setReferentName] = useState("");
  const [referentRole, setReferentRole] = useState("");
  const [opco, setOpco] = useState<string>("");

  const steps = useMemo(
    () => [
      { id: 1, label: "Contexte", icon: FileText },
      { id: 2, label: "Objectifs", icon: Target },
      { id: 3, label: "Situation", icon: FileText },
      { id: 4, label: "Référent", icon: User },
      { id: 5, label: "Financement", icon: CreditCard },
    ],
    [],
  );

  const toggleObjective = (value: string) => {
    setSelectedObjectives((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-6xl min-h-[72vh] gap-10 border border-[#007BFF]/40 bg-[#050505] p-12 text-white shadow-[0_0_50px_rgba(0,123,255,0.2)]">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }}>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-extrabold">Demande d’AFEST</DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-wrap items-center gap-8">
            {steps.map((item) => {
              const Icon = item.icon;
              const active = item.id === step;
              return (
                <div key={item.id} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] ${
                      active
                        ? "border-[#007BFF] bg-[#007BFF]/20 text-[#7FB7FF]"
                        : "border-white/10 text-white/40"
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <span className={`text-[11px] ${active ? "text-[#7FB7FF]" : "text-white/40"}`}>
                    {item.id}. {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            {step === 1 && (
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={employee.name} readOnly className="border-white/10 bg-[#0B0B0B] text-white/80" />
                <Input value={employee.role} readOnly className="border-white/10 bg-[#0B0B0B] text-white/80" />
                <Input value={employee.contract} readOnly className="border-white/10 bg-[#0B0B0B] text-white/80" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="rounded-[12px] border border-[#007BFF]/30 bg-[#007BFF]/10 px-3 py-2 text-[12px] text-[#7FB7FF]">
                  Analyse Beyond : L&apos;axe &quot;Résolution de problèmes&quot; est identifié comme priorité n°1.
                </div>
                <div className="space-y-3">
                  {objectivesList.map((objective) => (
                    <label key={objective} className="flex items-center gap-3 text-[13px] text-white/80">
                      <Checkbox
                        checked={selectedObjectives.includes(objective)}
                        onCheckedChange={() => toggleObjective(objective)}
                      />
                      {objective}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <Textarea
                value={situation}
                onChange={(event) => setSituation(event.target.value)}
                className="min-h-[120px] border-white/10 bg-[#0B0B0B] text-white/80"
                placeholder="Ex: Gestion d'un litige client complexe en autonomie"
              />
            )}

            {step === 4 && (
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={referentName}
                  onChange={(event) => setReferentName(event.target.value)}
                  className="border-white/10 bg-[#0B0B0B] text-white/80"
                  placeholder="Nom du référent"
                />
                <Input
                  value={referentRole}
                  onChange={(event) => setReferentRole(event.target.value)}
                  className="border-white/10 bg-[#0B0B0B] text-white/80"
                  placeholder="Fonction"
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <Select value={opco} onValueChange={setOpco}>
                <SelectTrigger className="border-white/10 bg-[#0B0B0B] text-white/80">
                    <SelectValue placeholder="Choisir un OPCO" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcos.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[12px] text-white/60">
                  Action éligible au financement. Beyond prépare votre dossier Cerfa.
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/70 hover:text-white"
              disabled={step === 1}
            >
              Précédent
            </button>
            <button
              onClick={() => setStep((prev) => Math.min(5, prev + 1))}
              className="rounded-full border border-[#007BFF]/40 px-4 py-2 text-[12px] text-[#7FB7FF] hover:border-[#007BFF]"
              disabled={step === 5}
            >
              Suivant
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
            <button className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/70 hover:text-white">
              Sauvegarder le brouillon
            </button>
            <button className="rounded-full bg-[#007BFF] px-5 py-2 text-[12px] font-semibold text-black shadow-[0_0_24px_rgba(0,123,255,0.6)]">
              Générer le dossier AFEST PDF
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
