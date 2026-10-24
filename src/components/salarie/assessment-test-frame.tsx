import type { ReactNode } from "react";

type Props = {
  stepLabel: string;
  progress: number;
  kicker?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AssessmentTestFrame({ stepLabel, progress, kicker, title, children, footer }: Props) {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#E8E6E1]">
            <div
              className="h-full rounded-full bg-[#111111] transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <p className="mt-3 text-[13px] text-[#8A8F98]">{stepLabel}</p>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          {kicker ? <p className="text-[15px] leading-snug text-[#5C6370]">{kicker}</p> : null}
          <h1 className="mt-3 text-[28px] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#111111] sm:text-[34px]">
            {title}
          </h1>
          <div className="mt-8">{children}</div>
        </div>

        {footer ? <div className="flex items-center justify-between gap-4 pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AssessmentChoice({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        selected
          ? "w-full rounded-2xl bg-[#111111] px-5 py-4 text-left text-[16px] font-semibold text-white"
          : "w-full rounded-2xl border border-[#E3E0D8] bg-white px-5 py-4 text-left text-[16px] font-semibold text-[#111111] transition hover:bg-[#F4F4F6] disabled:opacity-50"
      }
    >
      {label}
    </button>
  );
}
