"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function AlertsBadge() {
  const [alertCount, setAlertCount] = useState<number | null>(null);

  useEffect(() => {
    // Fetch le nombre d'alertes
    fetch("/api/super-admin/alert-count")
      .then(res => res.json())
      .then(data => setAlertCount(data.count || 0))
      .catch(() => setAlertCount(0));
  }, []);

  if (alertCount === null) {
    return (
      <Link
        href="/super/alertes"
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors relative"
        title="Alertes"
      >
        <Bell className="h-4 w-4 text-gray-700 hover:text-gray-900" />
      </Link>
    );
  }

  if (alertCount === 0) {
    return (
      <Link
        href="/super/alertes"
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors relative"
        title="Alertes"
      >
        <Bell className="h-4 w-4 text-gray-700 hover:text-gray-900" />
      </Link>
    );
  }

  return (
    <Link
      href="/super/alertes"
      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors relative"
      title={`${alertCount} alerte${alertCount > 1 ? "s" : ""}`}
    >
      <Bell className="h-4 w-4 text-gray-700 hover:text-gray-900" />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
        {alertCount > 9 ? "9+" : alertCount}
      </span>
    </Link>
  );
}




