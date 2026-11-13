"use client";

import { use } from "react";
import { QualiopiHandicapFiche } from "@/components/super-admin/qualiopi-handicap-fiche";

export default function QualiopiHandicapFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <QualiopiHandicapFiche profileId={id} />;
}
