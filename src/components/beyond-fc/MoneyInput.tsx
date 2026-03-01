"use client";

import { useEffect, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MoneyInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function formatValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const hasDecimals = Math.abs(value - Math.trunc(value)) > 1e-6;
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: hasDecimals ? 1 : 0,
    maximumFractionDigits: 2,
  });
}

export function MoneyInput({
  label,
  value,
  onChange,
  min: _min,
  max: _max,
  step = 1,
  helperText,
  placeholder,
  disabled,
  className,
}: MoneyInputProps) {
  const inputId = useId();
  const [rawValue, setRawValue] = useState<string>(() => formatValue(value));

  useEffect(() => {
    setRawValue(formatValue(value));
  }, [value]);

  const parseAndEmit = (nextValue: string) => {
    setRawValue(nextValue);
    const normalised = nextValue.replace(/\s/g, "").replace(",", ".");
    if (normalised.trim() === "") {
      return;
    }
    const parsed = Number(normalised);
    if (Number.isNaN(parsed)) {
      return;
    }
    let normalisedValue = parsed;
    if (step > 0) {
      const scaled = Math.round(normalisedValue / step) * step;
      normalisedValue = Number.isFinite(scaled) ? scaled : normalisedValue;
    }
    onChange(Number(normalisedValue.toFixed(2)));
  };

  const helper = helperText ?? "Prix libre — débrief au prochain tour.";

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId} className="text-sm text-white">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={inputId}
          inputMode="decimal"
          value={rawValue}
          onChange={(event) => parseAndEmit(event.target.value)}
          onBlur={() => setRawValue(formatValue(value))}
          placeholder={placeholder ?? "0,0"}
          disabled={disabled}
          className="pr-16 text-right text-base font-semibold text-white"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-sm text-white/60">
          € HT
        </span>
      </div>
      {helper ? <p className="text-xs text-white/50">{helper}</p> : null}
    </div>
  );
}

