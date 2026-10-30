"use client";

import { useState } from "react";

export function BadgeSearchIndexToggle({
  assertionId,
  indexable,
}: {
  assertionId: string;
  indexable: boolean;
}) {
  const [value, setValue] = useState(indexable);
  const [pending, setPending] = useState(false);

  return (
    <label className="flex items-center gap-2 text-xs text-black/60">
      <input
        type="checkbox"
        checked={value}
        disabled={pending}
        onChange={async (event) => {
          const next = event.target.checked;
          setPending(true);
          setValue(next);
          const response = await fetch(`/api/earner/badges/assertions/${assertionId}/indexable`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ indexable: next }),
          });
          setPending(false);
          if (!response.ok) setValue(!next);
        }}
      />
      Autoriser l'indexation de la page publique
    </label>
  );
}
