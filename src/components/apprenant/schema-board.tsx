"use client";

import { TimelineTube, type TimelineSchema } from "@/components/apprenant/timeline-tube";

type Step = {
  id?: string;
  title?: string;
  description?: string;
  takeaway?: string;
};

type CompareSide = { title?: string; points?: string[] };

export type SchemaData = TimelineSchema & {
  kind?: string;
  left?: CompareSide;
  right?: CompareSide;
};

function stepsOf(data: SchemaData | null | undefined): Step[] {
  return Array.isArray(data?.steps) ? data.steps.filter((step) => step && (step.title || step.description)) : [];
}

function Heading({ title, subtitle }: { title?: string; subtitle?: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className="mb-4 space-y-1">
      {title ? <h3 className="text-lg font-extrabold text-[#07080B]">{title}</h3> : null}
      {subtitle ? <p className="text-sm text-[#3A3D45]">{subtitle}</p> : null}
    </div>
  );
}

function FlowBoard({ data, loop }: { data: SchemaData; loop?: boolean }) {
  const steps = stepsOf(data);
  return (
    <div className="rounded-3xl bg-white p-5 text-[#07080B]">
      <Heading title={data.title} subtitle={data.subtitle} />
      <ol className="flex gap-3 overflow-x-auto pb-1">
        {steps.map((step, index) => (
          <li key={step.id ?? index} className="flex min-w-[180px] flex-1 items-stretch gap-3">
            <div className="flex-1 rounded-2xl bg-[#F4F4F1] p-4">
              <p className="text-xs font-extrabold text-[#6E5BFF]">{index + 1}</p>
              <p className="mt-1 font-bold">{step.title}</p>
              {step.description ? <p className="mt-1 text-sm text-[#3A3D45]">{step.description}</p> : null}
            </div>
            {index < steps.length - 1 || loop ? (
              <span className="self-center text-lg text-[#6E5BFF]" aria-hidden>
                {index === steps.length - 1 ? "↩" : "→"}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {data.cta ? <p className="mt-4 text-sm font-semibold">{data.cta}</p> : null}
    </div>
  );
}

function PyramidBoard({ data }: { data: SchemaData }) {
  const steps = stepsOf(data);
  return (
    <div className="rounded-3xl bg-white p-5 text-[#07080B]">
      <Heading title={data.title} subtitle={data.subtitle} />
      <div className="mx-auto flex max-w-md flex-col items-center gap-2">
        {[...steps].reverse().map((step, index) => {
          const width = 42 + (index / Math.max(steps.length - 1, 1)) * 58;
          return (
            <div key={step.id ?? index} className="rounded-2xl bg-[#EEEBFF] px-4 py-3 text-center" style={{ width: `${width}%` }}>
              <p className="font-bold text-[#4B3BD1]">{step.title}</p>
              {step.description ? <p className="mt-1 text-xs text-[#3A3D45]">{step.description}</p> : null}
            </div>
          );
        })}
      </div>
      {data.cta ? <p className="mt-4 text-sm font-semibold">{data.cta}</p> : null}
    </div>
  );
}

function CompareBoard({ data }: { data: SchemaData }) {
  const columns = [data.left, data.right].filter(Boolean) as CompareSide[];
  return (
    <div className="rounded-3xl bg-white p-5 text-[#07080B]">
      <Heading title={data.title} subtitle={data.subtitle} />
      <div className="grid gap-3 sm:grid-cols-2">
        {columns.map((column, index) => (
          <div key={column.title ?? index} className="rounded-2xl bg-[#F4F4F1] p-4">
            <p className="font-extrabold">{column.title}</p>
            <ul className="mt-2 space-y-1 text-sm text-[#3A3D45]">
              {(column.points ?? []).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {data.cta ? <p className="mt-4 text-sm font-semibold">{data.cta}</p> : null}
    </div>
  );
}

export function SchemaBoard({ data }: { data?: SchemaData | null }) {
  const kind = data?.kind;
  if (kind === "flow") return <FlowBoard data={data ?? {}} />;
  if (kind === "cycle") return <FlowBoard data={data ?? {}} loop />;
  if (kind === "pyramid") return <PyramidBoard data={data ?? {}} />;
  if (kind === "compare") return <CompareBoard data={data ?? {}} />;
  return <TimelineTube data={data} />;
}
