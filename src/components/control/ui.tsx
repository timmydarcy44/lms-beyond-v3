"use client";

import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.4px] text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#9AA3BD]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({
  color,
  icon,
  title,
  subtitle,
  action,
}: {
  color: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-white">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] text-[#9AA3BD]">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionCard({
  color,
  icon,
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  color: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[22px] border border-[#1A2340] bg-[#111831] ${className}`} style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <div className="border-b border-[#1A2340] px-5 py-4">
        <SectionHeader color={color} icon={icon} title={title} subtitle={subtitle} action={action} />
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
  const styles = {
    success: { background: "rgba(47,208,138,0.16)", color: "#2FD08A" },
    warning: { background: "rgba(244,196,80,0.16)", color: "#F4C450" },
    danger: { background: "rgba(255,92,122,0.16)", color: "#FF8AA0" },
    info: { background: "rgba(141,184,255,0.16)", color: "#8DB8FF" },
    neutral: { background: "#1A2340", color: "#9AA3BD" },
  }[tone];
  return (
    <span className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold" style={styles}>
      {label}
    </span>
  );
}

export function RolePill({ role }: { role: "business" | "cfa" | "expert" | "formateur" }) {
  const map = {
    business: { label: "Business", background: "rgba(139,123,255,0.18)", color: "#C4BAFF" },
    cfa: { label: "CFA", background: "rgba(94,220,195,0.16)", color: "#5EDCC3" },
    expert: { label: "Expert", background: "rgba(141,184,255,0.16)", color: "#8DB8FF" },
    formateur: { label: "Formateur", background: "rgba(110,91,255,0.18)", color: "#D2CBFF" },
  }[role];
  return (
    <span className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold" style={{ background: map.background, color: map.color }}>
      {map.label}
    </span>
  );
}

export type DataColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRow,
  empty,
  loading = false,
  page = 1,
  pageCount = 1,
  onPage,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRow?: (row: T) => void;
  empty?: ReactNode;
  loading?: boolean;
  page?: number;
  pageCount?: number;
  onPage?: (page: number) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-xl bg-[#0B1122]" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="px-3 py-2 text-[13px] font-medium text-[#6C7593]">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRow ? () => onRow(row) : undefined}
                className={onRow ? "cursor-pointer border-t border-[#1A2340] hover:bg-[#0B1122]" : "border-t border-[#1A2340]"}
              >
                {columns.map((column) => (
                  <td key={column.id} className={`px-3 py-3 text-sm text-white ${column.className ?? ""}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && onPage ? (
        <div className="mt-3 flex items-center justify-end gap-2 text-[13px] text-[#9AA3BD]">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-full border border-[#26304F] px-3 py-1 disabled:opacity-40">
            Précédent
          </button>
          <span>
            {page} / {pageCount}
          </span>
          <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)} className="rounded-full border border-[#26304F] px-3 py-1 disabled:opacity-40">
            Suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}
