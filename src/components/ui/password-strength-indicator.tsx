"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type PasswordStrength = {
  score: number; // 0-100
  level: "weak" | "fair" | "good" | "strong";
  feedback: string[];
  meetsRequirements: {
    minLength: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
};

export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  let score = 0;
  const feedback: string[] = [];

  // Longueur minimale (30 points)
  if (requirements.minLength) {
    score += 30;
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
  } else {
    feedback.push("Au moins 6 caractères requis");
  }

  // Chiffres (20 points)
  if (requirements.hasNumber) {
    score += 20;
  } else {
    feedback.push("Au moins un chiffre requis");
  }

  // Caractères spéciaux (20 points)
  if (requirements.hasSpecialChar) {
    score += 20;
  } else {
    feedback.push("Au moins un caractère spécial requis (!@#$%^&*...)");
  }

  // Diversité (majuscules, minuscules) (20 points)
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 20;
  } else if (password.length > 0) {
    feedback.push("Mélangez majuscules et minuscules pour plus de sécurité");
  }

  // Longueur supplémentaire (bonus)
  if (password.length >= 16) {
    score += 10;
  }

  // Déterminer le niveau
  let level: "weak" | "fair" | "good" | "strong";
  if (score < 40) {
    level = "weak";
  } else if (score < 60) {
    level = "fair";
  } else if (score < 80) {
    level = "good";
  } else {
    level = "strong";
  }

  return {
    score: Math.min(100, score),
    level,
    feedback,
    meetsRequirements: requirements,
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  
  const strength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  if (!password) {
    return null;
  }

  const colors = {
    weak: "bg-red-500",
    fair: "bg-orange-500",
    good: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const labels = {
    weak: "Faible",
    fair: "Moyen",
    good: "Bon",
    strong: "Fort",
  };

  const textColors = {
    weak: isLight ? "text-red-600" : "text-red-400",
    fair: isLight ? "text-orange-600" : "text-orange-400",
    good: isLight ? "text-yellow-600" : "text-yellow-400",
    strong: isLight ? "text-green-600" : "text-green-400",
  };

  const checkColor = isLight ? "text-green-600" : "text-green-400";
  const xColor = isLight ? "text-red-600" : "text-red-400";

  const textLabelClass = isLight ? "text-slate-600" : "text-white/60";
  const textRequirementClass = (met: boolean) =>
    met
      ? isLight
        ? "text-slate-700"
        : "text-white/70"
      : isLight
        ? "text-slate-500"
        : "text-white/50";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={textLabelClass}>Force du mot de passe</span>
          <span className={cn("font-semibold", textColors[strength.level])}>
            {labels[strength.level]}
          </span>
        </div>
        <Progress
          value={strength.score}
          className="h-2"
          indicatorClassName={colors[strength.level]}
        />
      </div>

      {/* Exigences */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          {strength.meetsRequirements.minLength ? (
            <Check className={cn("h-3.5 w-3.5", checkColor)} />
          ) : (
            <X className={cn("h-3.5 w-3.5", xColor)} />
          )}
          <span className={textRequirementClass(strength.meetsRequirements.minLength)}>
            Au moins 6 caractères
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {strength.meetsRequirements.hasNumber ? (
            <Check className={cn("h-3.5 w-3.5", checkColor)} />
          ) : (
            <X className={cn("h-3.5 w-3.5", xColor)} />
          )}
          <span className={textRequirementClass(strength.meetsRequirements.hasNumber)}>
            Au moins un chiffre
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {strength.meetsRequirements.hasSpecialChar ? (
            <Check className={cn("h-3.5 w-3.5", checkColor)} />
          ) : (
            <X className={cn("h-3.5 w-3.5", xColor)} />
          )}
          <span className={textRequirementClass(strength.meetsRequirements.hasSpecialChar)}>
            Au moins un caractère spécial
          </span>
        </div>
      </div>
    </div>
  );
}

