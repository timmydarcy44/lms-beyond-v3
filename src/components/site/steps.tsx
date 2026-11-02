export function NumberedSteps({
  steps,
  className,
  cardClassName = "bg-white",
  marker = "circle",
}: {
  steps: { n: string; title: string; text: string }[];
  className?: string;
  cardClassName?: string;
  marker?: "circle" | "index";
}) {
  return (
    <ol className={className}>
      {steps.map((step) => (
        <li key={step.n} className={`rounded-[28px] p-6 ${cardClassName}`}>
          {marker === "index" ? (
            <span className="text-[40px] font-extrabold leading-none tracking-[-2px]">{step.n}</span>
          ) : (
            <span className={step.n === "1" ? "grid h-10 w-10 place-items-center rounded-full bg-[#6E5BFF] text-[15px] font-extrabold text-white" : "grid h-10 w-10 place-items-center rounded-full bg-[#E6E4DE] text-[15px] font-extrabold text-[#0B0D14]"}>
              {step.n}
            </span>
          )}
          <h3 className="mt-6 text-[20px] font-extrabold tracking-[-0.4px]">{step.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F5C]">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
