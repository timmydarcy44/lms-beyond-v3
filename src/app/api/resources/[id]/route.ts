import { NextRequest, NextResponse } from "next/server";
import { extractResourceHtml } from "@/lib/resources/resource-db-write";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const client = getServiceRoleClient() ?? supabase;
    const selectCandidates = [
      "id, title, type, resource_type, kind, html_content, file_url, video_url, audio_url, published, status, created_by, owner_id",
      "id, title, type, kind, html_content, file_url, published, status, created_by, owner_id",
      "id, title, type, html_content, content, file_url, published, status, created_by, owner_id",
      "id, title, type, html_content, content, published, created_by, owner_id",
    ];

    let resource: Record<string, unknown> | null = null;
    let lastError: { message?: string; code?: string } | null = null;
    for (const select of selectCandidates) {
      const result = await client.from("resources").select(select).eq("id", id).maybeSingle();
      if (!result.error && result.data) {
        resource = result.data as Record<string, unknown>;
        break;
      }
      lastError = result.error;
      if (result.error?.code !== "42703" && result.error?.code !== "PGRST204") break;
    }

    if (!resource) {
      console.error("[api/resources/[id]] GET not found:", { id, error: lastError?.message });
      return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
    }

    const isOwner =
      resource.created_by === user.id ||
      (resource.owner_id && resource.owner_id === user.id);
    const isPublished =
      resource.published === true || resource.status === "published";

    if (!isOwner && !isPublished) {
      return NextResponse.json({ error: "Ressource non publiée" }, { status: 403 });
    }

    const html_content = extractResourceHtml(resource);
    return NextResponse.json({
      resource: {
        ...resource,
        html_content,
      },
    });
  } catch (error) {
    console.error("[api/resources/[id]] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("[api/resources/[id]] Mise à jour de la ressource:", id);
    
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[api/resources/[id]] Supabase non configuré");
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[api/resources/[id]] Erreur d'authentification:", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[api/resources/[id]] Erreur de parsing JSON:", parseError);
      return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
    }

    const { 
      title,
      description,
      type,
      price,
      published,
    } = body as {
      title?: string;
      description?: string;
      type?: string;
      price?: number;
      published?: boolean;
    };

    // Utiliser le service role client pour bypasser RLS si disponible
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (type !== undefined) {
      updateData.type = type;
      updateData.resource_type = type;
    }
    if (price !== undefined) updateData.price = parseFloat(String(price)) || 0;
    if (published !== undefined) {
      // Essayer published (boolean) et status (text)
      updateData.published = published;
      updateData.status = published ? "published" : "draft";
    }

    // Mettre à jour la ressource
    const { data: updatedResource, error: updateError } = await clientToUse
      .from("resources")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[api/resources/[id]] Erreur lors de la mise à jour:", updateError);
      
      // Si erreur liée à price, réessayer sans
      if (updateError.code === "42703" && updateError.message?.includes("price")) {
        delete updateData.price;
        const retryResult = await clientToUse
          .from("resources")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        
        if (retryResult.error) {
          return NextResponse.json({ 
            error: "Erreur lors de la mise à jour", 
            details: retryResult.error.message 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          message: "Ressource mise à jour avec succès",
          resource: retryResult.data 
        });
      }
      
      return NextResponse.json({ 
        error: "Erreur lors de la mise à jour", 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Ressource mise à jour avec succès",
      resource: updatedResource 
    });

  } catch (error) {
    console.error("[api/resources/[id]] Erreur inattendue:", error);
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}









