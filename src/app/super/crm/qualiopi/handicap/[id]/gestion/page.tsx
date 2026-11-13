"use client";

import { use } from "react";
import { QualiopiHandicapGestion } from "@/components/super-admin/qualiopi-handicap-gestion";

export default function QualiopiHandicapGestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <QualiopiHandicapGestion profileId={id} />;
}
