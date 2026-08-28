type Props = {
  title: string;
  description?: string;
};

export function EcoleModulePlaceholder({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#86868B]">
        {description ??
          "Ce module est en cours de déploiement. Les données seront bientôt disponibles depuis cet espace."}
      </p>
    </div>
  );
}
