import { NextResponse } from "next/server";
import { getFormateurOrganizations } from "@/lib/queries/formateur";

/**
 * Galaxies assignables pour une formation / métadonnées cours (aligné sur `getFormateurOrganizations`).
 * Préféré à `/api/super-admin/organisations` dans l’UI formateur : même règles multi-tenant + super-admin catalogue complet.
 */
export async function GET() {
  try {
    const organizations = await getFormateurOrganizations();
    return NextResponse.json({ organizations });
  } catch (e) {
    console.warn("[api/formateur/organizations]", e);
    return NextResponse.json({ organizations: [] }, { status: 200 });
  }
}
