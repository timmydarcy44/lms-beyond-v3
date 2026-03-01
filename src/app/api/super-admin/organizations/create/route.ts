import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceSupabase } from "@/lib/supabase/service";

type AdminInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  logo?: string;
};

type MemberInput = {
  email: string;
  role: "instructor" | "learner" | "tutor";
  fullName: string;
};

type CreateOrganizationPayload = {
  name?: string;
  slug?: string;
  description?: string;
  admin?: AdminInput;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  phone?: string;
  members?: MemberInput[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function POST(request: NextRequest) {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  let payload: CreateOrganizationPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const fieldErrors: Record<string, string> = {};
  const name = (payload.name ?? "").trim();
  if (!name) {
    fieldErrors.name = "Le nom est obligatoire";
  }

  const adminFromContact = payload.contactEmail
    ? {
        email: payload.contactEmail,
        firstName: payload.contactFirstName,
        lastName: payload.contactLastName,
        phone: payload.phone,
      }
    : undefined;

  const admin = payload.admin?.email ? payload.admin : adminFromContact;
  if (admin?.email) {
    if (!admin.firstName) fieldErrors.adminFirstName = "Prénom requis";
    if (!admin.lastName) fieldErrors.adminLastName = "Nom requis";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", fieldErrors }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await getServiceSupabase();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[super-admin] Service client not configured:", error);
    }
    return NextResponse.json({ ok: false, error: "SERVICE_NOT_CONFIGURED" }, { status: 500 });
  }

  const baseSlug = payload.slug ? slugify(payload.slug) : slugify(name);
  let finalSlug = baseSlug;

  try {
    if (payload.slug) {
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ ok: false, error: "ORG_SLUG_TAKEN" }, { status: 409 });
      }
    } else {
      let counter = 1;
      while (true) {
        const { data: existing } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", finalSlug)
          .maybeSingle();
        if (!existing) break;
        counter += 1;
        finalSlug = `${baseSlug}-${counter}`;
      }
    }

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        slug: finalSlug,
        description: payload.description || null,
      })
      .select()
      .single();

    if (orgError || !organization) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[super-admin] Error creating organization:", orgError);
      }
      if (orgError?.code === "23505") {
        return NextResponse.json({ ok: false, error: "ORG_SLUG_TAKEN" }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }

    const warnings: string[] = [];

    if (admin?.email && admin.firstName && admin.lastName) {
      const adminFullName = `${admin.firstName} ${admin.lastName}`.trim();

      let adminUserId: string | null = null;
      const { data: existingAdmin } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", admin.email)
        .maybeSingle();

      if (existingAdmin) {
        adminUserId = existingAdmin.id;
        await supabase
          .from("profiles")
          .update({
            full_name: adminFullName,
            role: "admin",
            phone: admin.phone || null,
          })
          .eq("id", adminUserId);
      } else {
        const { data: inviteResponse, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          admin.email,
          {
            data: {
              first_name: admin.firstName,
              last_name: admin.lastName,
              phone: admin.phone,
              role: "admin",
              organization_id: organization.id,
              organization_name: name,
            },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password?token={token}`,
          }
        );

        if (inviteError || !inviteResponse?.user) {
          warnings.push(`ADMIN_INVITE_FAILED:${admin.email}`);
          if (process.env.NODE_ENV !== "production") {
            console.error("[super-admin] Error inviting admin:", inviteError);
          }
        } else {
          adminUserId = inviteResponse.user.id;
          await supabase.from("profiles").insert({
            id: adminUserId,
            email: admin.email,
            full_name: adminFullName,
            role: "admin",
            phone: admin.phone || null,
          });
        }
      }

      if (adminUserId) {
        await supabase.from("org_memberships").upsert({
          org_id: organization.id,
          user_id: adminUserId,
          role: "admin",
        });
      }
    }

    if (payload.members && payload.members.length > 0) {
      for (const member of payload.members) {
        if (!member.email || !member.fullName) continue;

        let userId: string | null = null;
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", member.email)
          .maybeSingle();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: member.email,
            email_confirm: false,
            user_metadata: {
              full_name: member.fullName,
              role: member.role,
            },
          });

          if (authError || !authUser?.user?.id) {
            warnings.push(`MEMBER_CREATE_FAILED:${member.email}`);
            if (process.env.NODE_ENV !== "production") {
              console.error("[super-admin] Error creating member:", authError);
            }
            continue;
          }

          userId = authUser.user.id;

          await supabase.from("profiles").insert({
            id: userId,
            email: member.email,
            full_name: member.fullName,
            role: member.role,
          });
        }

        if (userId) {
          const { error: membershipError } = await supabase.from("org_memberships").upsert({
            org_id: organization.id,
            user_id: userId,
            role: member.role,
          });

          if (membershipError) {
            warnings.push(`MEMBER_MEMBERSHIP_FAILED:${member.email}`);
            if (process.env.NODE_ENV !== "production") {
              console.error("[super-admin] Error adding member:", membershipError);
            }
          }
        }
      }
    }

    return NextResponse.json(
      { ok: true, organization, warnings: warnings.length > 0 ? warnings : undefined },
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[super-admin] Unexpected error:", error);
    }
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
