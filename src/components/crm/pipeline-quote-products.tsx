"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PIPELINE_PRODUCT_CATALOG,
  computeQuotedProductsCents,
  formatProductUnitEuros,
  type PipelineQuotedProductId,
  type PipelineQuotedProductLine,
} from "@/lib/crm/pipeline-quoted-products";
import { formatDealAmount } from "@/lib/crm/pipeline-shared";

function upsertLine(
  lines: PipelineQuotedProductLine[],
  id: PipelineQuotedProductId,
  patch: Partial<PipelineQuotedProductLine> & { qty?: number },
): PipelineQuotedProductLine[] {
  const catalog = PIPELINE_PRODUCT_CATALOG.find((p) => p.id === id)!;
  const existing = lines.find((l) => l.id === id);
  const qty = patch.qty ?? existing?.qty ?? 0;
  const unit_cents = patch.unit_cents ?? existing?.unit_cents ?? catalog.defaultUnitCents;
  const without = lines.filter((l) => l.id !== id);
  if (qty <= 0) return without;
  return [...without, { id, qty, unit_cents }];
}

export function PipelineQuoteProducts({
  lines,
  onChange,
  onTotalChange,
  tone = "dark",
}: {
  lines: PipelineQuotedProductLine[];
  onChange: (next: PipelineQuotedProductLine[]) => void;
  onTotalChange?: (cents: number) => void;
  tone?: "dark" | "light";
}) {
  const total = computeQuotedProductsCents(lines);
  const dark = tone === "dark";

  const setLine = (id: PipelineQuotedProductId, patch: Partial<PipelineQuotedProductLine> & { qty?: number }) => {
    const next = upsertLine(lines, id, patch);
    onChange(next);
    onTotalChange?.(computeQuotedProductsCents(next));
  };

  return (
    <div className="space-y-3">
      <p className={cn("text-xs font-medium uppercase tracking-wide", dark ? "text-slate-400" : "text-gray-500")}>
        Produits
      </p>
      {PIPELINE_PRODUCT_CATALOG.map((product) => {
        const line = lines.find((l) => l.id === product.id);
        const qty = line?.qty ?? 0;
        const unit = line?.unit_cents ?? product.defaultUnitCents;
        const enabled = qty > 0;

        return (
          <div
            key={product.id}
            className={cn(
              "rounded-lg border p-3",
              dark ? "border-white/10 bg-slate-900/40" : "border-gray-200 bg-white",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-white/30"
                    checked={enabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLine(product.id, {
                          qty: product.id === "edge_recruit" ? 1 : 1,
                          unit_cents: unit,
                        });
                      } else {
                        setLine(product.id, { qty: 0 });
                      }
                    }}
                  />
                  <span className={cn("text-sm font-medium", dark ? "text-white" : "text-gray-900")}>
                    {product.label}
                  </span>
                </label>
                <p className={cn("mt-0.5 pl-6 text-[11px]", dark ? "text-slate-500" : "text-gray-500")}>
                  {product.hint}
                </p>
              </div>
              {enabled ? (
                <p className={cn("shrink-0 text-xs font-semibold", dark ? "text-emerald-300" : "text-emerald-700")}>
                  {formatDealAmount(qty * unit)}
                </p>
              ) : null}
            </div>

            {enabled ? (
              <div className="mt-3 grid gap-2 pl-6 sm:grid-cols-2">
                {product.priceOptionsCents ? (
                  <div>
                    <Label className={cn("text-[11px]", dark ? "text-slate-400" : "text-gray-500")}>
                      Tarif unitaire
                    </Label>
                    <select
                      className={cn(
                        "mt-1 flex h-8 w-full rounded-md border px-2 text-sm",
                        dark
                          ? "border-white/15 bg-white/10 text-white"
                          : "border-gray-200 bg-white text-gray-900",
                      )}
                      value={unit}
                      onChange={(e) => setLine(product.id, { qty, unit_cents: Number(e.target.value) })}
                    >
                      {product.priceOptionsCents.map((c) => (
                        <option key={c} value={c} className="bg-slate-900 text-white">
                          {formatProductUnitEuros(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <Label className={cn("text-[11px]", dark ? "text-slate-400" : "text-gray-500")}>
                      Prix unitaire
                    </Label>
                    <p className={cn("mt-1 text-sm", dark ? "text-slate-300" : "text-gray-700")}>
                      {formatProductUnitEuros(unit)}
                    </p>
                  </div>
                )}
                {product.allowQty ? (
                  <div>
                    <Label className={cn("text-[11px]", dark ? "text-slate-400" : "text-gray-500")}>
                      Quantité
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      className={cn(
                        "mt-1 h-8",
                        dark
                          ? "border-white/15 bg-white/10 text-white"
                          : "border-gray-200 bg-white",
                      )}
                      value={qty}
                      onChange={(e) => {
                        const n = Math.max(0, Math.round(Number(e.target.value) || 0));
                        setLine(product.id, { qty: n, unit_cents: unit });
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {total > 0 ? (
        <p className={cn("text-xs", dark ? "text-slate-400" : "text-gray-500")}>
          Sous-total produits :{" "}
          <span className={cn("font-semibold", dark ? "text-emerald-300" : "text-emerald-700")}>
            {formatDealAmount(total)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
