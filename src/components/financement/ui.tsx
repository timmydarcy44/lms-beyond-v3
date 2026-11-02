import { cn } from "@/lib/utils";

export function Band({
  id,
  dark = false,
  children,
  className,
}: {
  id?: string;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn(dark ? "bg-[#070C1C] text-white" : "bg-[#F4F4F1] text-[#0B0D14]", className)}>
      <div className="mx-auto w-full max-w-[1240px] px-6 py-16 md:py-[104px]">{children}</div>
    </section>
  );
}

export function H2({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 className={cn("text-[36px] font-extrabold leading-[1.05] tracking-[-2px] md:text-[52px]", light ? "text-white" : "text-[#0B0D14]")}>
      {children}
    </h2>
  );
}

export const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]";
