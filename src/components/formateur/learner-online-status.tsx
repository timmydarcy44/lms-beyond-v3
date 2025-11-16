"use client";

import { useState, useEffect } from "react";
import { Circle } from "lucide-react";

type LearnerOnlineStatusProps = {
  learnerId: string;
  className?: string;
};

export function LearnerOnlineStatus({ learnerId, className = "" }: LearnerOnlineStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchOnlineStatus = async () => {
      try {
        const response = await fetch(`/api/learners/online-status?learnerIds=${learnerId}`);
        if (response.ok) {
          const data = await response.json();
          setIsOnline(data.onlineStatus?.[learnerId] || false);
        }
      } catch (error) {
        console.error("[learner-online-status] Error fetching online status:", error);
      }
    };

    fetchOnlineStatus();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchOnlineStatus, 10000);
    return () => clearInterval(interval);
  }, [learnerId]);

  if (isOnline === null) {
    return null; // Ne rien afficher pendant le chargement
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      {isOnline ? (
        <>
          <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
          <span className="text-emerald-400">En ligne</span>
        </>
      ) : (
        <>
          <Circle className="h-2 w-2 fill-white/40 text-white/40" />
          <span className="text-white/40">Hors ligne</span>
        </>
      )}
    </div>
  );
}

