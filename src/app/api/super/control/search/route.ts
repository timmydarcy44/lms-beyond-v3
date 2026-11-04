import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Hit = { id: string; label: string; hint?: string; href: string };
type Group = { type: string; items: Hit[] };

function clean(value: string) {
  return value.replace(/[%_,"]/g, " ").trim().slice(0, 80);
}

function orIlike(columns: string[], like: string) {
  const value = `"${like}"`;
  return columns.map((column) => `${column}.ilike.${value}`).join(",");
}

export async function GET(request: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ groups: [] }, { status: 403 });
  }
  const q = clean(new URL(request.url).searchParams.get("q") ?? "");
  if (q.length < 2) return NextResponse.json({ groups: [] });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ groups: [] });
  const like = `%${q}%`;

  const [orgs, companies, fiches, people, learners, experts, courses, badges] = await Promise.all([
    db.from("organizations").select("id, name").ilike("name", like).limit(5),
    db.from("cfa_companies").select("id, company_name, city").ilike("company_name", like).limit(5),
    db.from("companies").select("id, name, city").ilike("name", like).is("merged_into", null).limit(5),
    db.from("profiles").select("id, first_name, last_name, email").or(orIlike(["first_name", "last_name", "email"], like)).limit(5),
    db.from("cfa_applications").select("id, first_name, last_name, email").or(orIlike(["first_name", "last_name", "email"], like)).limit(5),
    db.from("experts").select("id, first_name, last_name, email").or(orIlike(["first_name", "last_name", "email"], like)).limit(5),
    db.from("courses").select("id, title").ilike("title", like).limit(5),
    db.from("open_badges").select("id, name").ilike("name", like).limit(5),
  ]);

  const groups: Group[] = [];
  const entreprises: Hit[] = [
    ...((fiches.error ? [] : fiches.data ?? []) as Array<{ id: string; name: string | null; city: string | null }>).map((row) => ({
      id: `company-${row.id}`,
      label: row.name || "Entreprise",
      hint: row.city || "Fiche entreprise",
      href: `/super/entreprises/${row.id}`,
    })),
    ...((orgs.data ?? []) as Array<{ id: string; name: string | null }>).map((row) => ({
      id: `org-${row.id}`,
      label: row.name || "Entreprise",
      hint: "Compte client",
      href: `/super/organisations/${row.id}`,
    })),
    ...((companies.data ?? []) as Array<{ id: string; company_name: string | null; city: string | null }>).map((row) => ({
      id: `cfa-${row.id}`,
      label: row.company_name || "Entreprise d'accueil",
      hint: row.city || "Entreprise d'accueil",
      href: `/super/cfa/entreprises/${row.id}`,
    })),
  ];
  if (entreprises.length) groups.push({ type: "Entreprises", items: entreprises.slice(0, 6) });

  const contacts = ((people.data ?? []) as Array<{ id: string; first_name?: string | null; last_name?: string | null; email?: string | null }>).map((row) => ({
    id: row.id,
    label: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email || "Contact",
    hint: row.email ?? undefined,
    href: `/super/utilisateurs/${row.id}`,
  }));
  if (contacts.length) groups.push({ type: "Contacts", items: contacts });

  const apprenants = ((learners.data ?? []) as Array<{ id: string; first_name?: string | null; last_name?: string | null; email?: string | null }>).map((row) => ({
    id: row.id,
    label: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email || "Apprenant",
    hint: row.email ?? undefined,
    href: `/super/crm/cfa/apprenants/${row.id}`,
  }));
  if (apprenants.length) groups.push({ type: "Apprenants", items: apprenants });

  const expertHits = ((experts.data ?? []) as Array<{ id: string; first_name?: string | null; last_name?: string | null; email?: string | null }>).map((row) => ({
    id: row.id,
    label: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email || "Expert",
    hint: row.email ?? undefined,
    href: `/super/experts/${row.id}`,
  }));
  if (expertHits.length) groups.push({ type: "Experts", items: expertHits });

  const formations = ((courses.data ?? []) as Array<{ id: string; title?: string | null }>).map((row) => ({
    id: row.id,
    label: row.title || "Formation",
    href: `/super/lms/formations/${row.id}`,
  }));
  if (formations.length) groups.push({ type: "Formations", items: formations });

  const badgeHits = ((badges.data ?? []) as Array<{ id: string; name?: string | null }>).map((row) => ({
    id: row.id,
    label: row.name || "Open Badge",
    href: `/super/open-badges/badgeclasses/${row.id}/edit`,
  }));
  if (badgeHits.length) groups.push({ type: "Badges", items: badgeHits });

  return NextResponse.json({ groups });
}
