"use client";

import { useEffect, useId, useRef, useState } from "react";

export type BanAddressValue = {
  addressLine: string;
  addressZip: string;
  addressCity: string;
  label: string;
};

type BanFeature = {
  properties?: {
    label?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
  };
};

type Props = {
  value: string;
  onChange: (line: string) => void;
  onSelect: (value: BanAddressValue) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Si true, cherche aussi les lieux (pas seulement housenumber). */
  type?: "housenumber" | undefined;
};

function titleCaseCity(city: string): string {
  return city
    .toLowerCase()
    .split(/([\s-]+)/)
    .map((part) => {
      if (/^[\s-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function BanAddressAutocomplete({
  value,
  onChange,
  onSelect,
  className,
  placeholder = "N° et rue",
  disabled,
  type = "housenumber",
}: Props) {
  const listId = useId();
  const [hits, setHits] = useState<BanAddressValue[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 3) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(() => {
      const params = new URLSearchParams({ q, limit: "5" });
      if (type) params.set("type", type);
      void fetch(`https://api-adresse.data.gouv.fr/search/?${params.toString()}`)
        .then((r) => r.json())
        .then((json: { features?: BanFeature[] }) => {
          const next = (json.features ?? [])
            .map((f) => {
              const p = f.properties ?? {};
              const line =
                [p.housenumber, p.street || p.name].filter(Boolean).join(" ").trim() ||
                String(p.name || "").trim();
              const zip = String(p.postcode || "").trim();
              const city = titleCaseCity(String(p.city || "").trim());
              if (!line || !zip || !city) return null;
              return {
                addressLine: line,
                addressZip: zip,
                addressCity: city,
                label: String(p.label || `${line}, ${zip} ${city}`),
              } satisfies BanAddressValue;
            })
            .filter((x): x is BanAddressValue => Boolean(x));
          setHits(next);
          setOpen(next.length > 0);
        })
        .catch(() => {
          setHits([]);
        });
    }, 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, type]);

  return (
    <div ref={rootRef} className="relative">
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        autoComplete="street-address"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (hits.length) setOpen(true);
        }}
      />
      {open && hits.length ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-[#26304F] bg-[#111831] shadow-lg"
        >
          {hits.map((hit) => (
            <li key={hit.label} role="option">
              <button
                type="button"
                className="block w-full px-3 py-2.5 text-left text-sm text-[#F3F4FA] hover:bg-[#0B1122]"
                onClick={() => {
                  onSelect(hit);
                  setHits([]);
                  setOpen(false);
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
