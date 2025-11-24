"use client";

import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SEOIndicatorProps {
  score: number; // 0-100
}

export function SEOIndicator({ score }: SEOIndicatorProps) {
  const getIcon = () => {
    if (score >= 90) {
      return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    } else if (score >= 50) {
      return <AlertTriangle className="h-6 w-6 text-orange-500" />;
    } else {
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getColor = () => {
    if (score >= 90) return "text-green-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <span className={cn("text-sm font-semibold", getColor())}>
        SEO: {score}%
      </span>
    </div>
  );
}

