// app/(dashboard)/admin/select-org/layout.tsx - Layout spécial pour la page de sélection d'organisation
export default function SelectOrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout minimal sans sidebar - page pleine écran comme Netflix
  return <>{children}</>;
}
