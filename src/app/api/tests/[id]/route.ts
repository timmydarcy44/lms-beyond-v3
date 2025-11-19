import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { calculateTestDuration, formatTestDuration } from "@/lib/utils/test-duration";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("[api/tests/[id]] Récupération du test:", id);
    
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[api/tests/[id]] Supabase non configuré");
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[api/tests/[id]] Erreur d'authentification:", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Utiliser le service role client pour bypasser RLS si disponible
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;

    // Récupérer le test avec toutes ses données
    const { data: test, error: testError } = await clientToUse
      .from("tests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (testError) {
      console.error("[api/tests/[id]] Erreur lors de la récupération:", testError);
      return NextResponse.json({ 
        error: "Erreur lors de la récupération",
        details: testError.message 
      }, { status: 500 });
    }

    if (!test) {
      return NextResponse.json({ 
        error: "Test introuvable" 
      }, { status: 404 });
    }

    return NextResponse.json({ test });

  } catch (error) {
    console.error("[api/tests/[id]] Erreur inattendue:", error);
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("[api/tests/[id]] Mise à jour du test:", id);
    
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[api/tests/[id]] Supabase non configuré");
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[api/tests/[id]] Erreur d'authentification:", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[api/tests/[id]] Erreur de parsing JSON:", parseError);
      return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
    }

    const { 
      title,
      description,
      duration,
      evaluationType,
      skills,
      price,
      category,
      published,
      display_format,
      questions,
      cover_image,
    } = body as {
      title?: string;
      description?: string;
      duration?: string;
      evaluationType?: string;
      skills?: string;
      price?: number;
      category?: string;
      published?: boolean;
      display_format?: "ranking" | "radar" | "score" | "detailed";
      questions?: any[];
      cover_image?: string;
    };

    // Utiliser le service role client pour bypasser RLS si disponible
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    
    // Calculer automatiquement la durée si des questions sont fournies
    if (questions !== undefined && Array.isArray(questions) && questions.length > 0) {
      const calculatedMinutes = calculateTestDuration(questions);
      updateData.duration = formatTestDuration(calculatedMinutes);
      console.log(`[api/tests/[id]] Calculated duration: ${updateData.duration} (${questions.length} questions)`);
    } else if (duration !== undefined) {
      // Si pas de questions mais durée fournie manuellement, utiliser celle-ci
      updateData.duration = duration?.trim() || null;
    }
    
    if (evaluationType !== undefined) updateData.evaluation_type = evaluationType?.trim() || null;
    if (skills !== undefined) updateData.skills = skills?.trim() || null;
    if (price !== undefined) updateData.price = parseFloat(String(price)) || 0;
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (display_format !== undefined) updateData.display_format = display_format;
    if (questions !== undefined && Array.isArray(questions)) updateData.questions = questions;
    if (cover_image !== undefined) {
      // Essayer cover_image, hero_image_url, thumbnail_url selon ce qui existe
      updateData.cover_image = cover_image;
      updateData.hero_image_url = cover_image;
      updateData.thumbnail_url = cover_image;
    }
    if (published !== undefined) {
      // Essayer published (boolean) et status (text)
      updateData.published = published;
      updateData.status = published ? "published" : "draft";
    }

    // Mettre à jour le test avec gestion d'erreurs pour colonnes manquantes
    // Stratégie optimisée : essayer d'abord avec toutes les colonnes, puis retry si nécessaire
    let updatedTest = null;
    let lastError = null;

    // Tentative 1 : avec toutes les colonnes
    console.log(`[api/tests/[id]] Tentative 1 avec toutes les colonnes:`, Object.keys(updateData));
    
    const result1 = await Promise.race([
      clientToUse
        .from("tests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 10000) // 10 secondes max
      )
    ]).catch((error) => {
      if (error.message === "Timeout") {
        return { error: { code: "TIMEOUT", message: "Request timeout" } };
      }
      return { error };
    }) as any;

    if (!result1.error || result1.error.code === "TIMEOUT") {
      if (result1.error?.code === "TIMEOUT") {
        console.log(`[api/tests/[id]] ⚠️ Timeout, essai avec colonnes minimales`);
        
        // Tentative 2 : seulement les colonnes essentielles (sans questions qui peuvent être lourdes)
        const minimalData: any = {};
        if (updateData.title) minimalData.title = updateData.title;
        if (updateData.description !== undefined) minimalData.description = updateData.description;
        if (updateData.price !== undefined) minimalData.price = updateData.price;
        if (updateData.category !== undefined) minimalData.category = updateData.category;
        if (updateData.published !== undefined) {
          minimalData.published = updateData.published;
          minimalData.status = updateData.status;
        }
        if (updateData.cover_image) {
          minimalData.cover_image = updateData.cover_image;
        }
        
        const result2 = await clientToUse
          .from("tests")
          .update(minimalData)
          .eq("id", id)
          .select()
          .single();
        
        if (!result2.error) {
          updatedTest = result2.data;
          console.log(`[api/tests/[id]] ✓ Succès avec colonnes minimales`);
          
          // Mettre à jour questions séparément si nécessaire
          if (updateData.questions && Array.isArray(updateData.questions)) {
            try {
              const { error } = await clientToUse
                .from("tests")
                .update({ questions: updateData.questions })
                .eq("id", id);
              if (error) {
                console.error("[api/tests/[id]] Erreur mise à jour questions:", error);
              }
            } catch (err) {
              console.error("[api/tests/[id]] Erreur mise à jour questions:", err);
            }
          }
        } else {
          lastError = result2.error;
        }
      } else if (!result1.error) {
        updatedTest = result1.data;
        console.log(`[api/tests/[id]] ✓ Succès avec toutes les colonnes`);
      } else {
        lastError = result1.error;
        
        // Si erreur 42703 (colonne manquante), essayer avec moins de colonnes
        if (result1.error.code === "42703") {
          console.log(`[api/tests/[id]] ⚠️ Colonne manquante, essai avec colonnes de base`);
          
          const baseData: any = {};
          if (updateData.title) baseData.title = updateData.title;
          if (updateData.description !== undefined) baseData.description = updateData.description;
          if (updateData.price !== undefined) baseData.price = updateData.price;
          if (updateData.published !== undefined) {
            baseData.published = updateData.published;
            baseData.status = updateData.status;
          }
          
          const result3 = await clientToUse
            .from("tests")
            .update(baseData)
            .eq("id", id)
            .select()
            .single();
          
          if (!result3.error) {
            updatedTest = result3.data;
            console.log(`[api/tests/[id]] ✓ Succès avec colonnes de base`);
          } else {
            lastError = result3.error;
          }
        }
      }
    } else {
      lastError = result1.error;
    }

    if (!updatedTest) {
      return NextResponse.json({ 
        error: "Erreur lors de la mise à jour", 
        details: lastError?.message || "Impossible de mettre à jour le test"
      }, { status: 500 });
    }

    // Mettre à jour aussi catalog_items si le test est référencé
    // Mettre à jour le prix ET les images
    const { data: catalogItem } = await clientToUse
      .from("catalog_items")
      .select("id")
      .eq("content_id", id)
      .eq("item_type", "test")
      .maybeSingle();

    if (catalogItem) {
      const catalogUpdate: any = {};
      
      if (cover_image !== undefined) {
        catalogUpdate.hero_image_url = cover_image;
        catalogUpdate.thumbnail_url = cover_image;
      }
      
      // Synchroniser le prix depuis le test
      if (price !== undefined) {
        catalogUpdate.price = parseFloat(String(price)) || 0;
        catalogUpdate.is_free = catalogUpdate.price === 0;
      }
      
      if (Object.keys(catalogUpdate).length > 0) {
        try {
          const { error } = await clientToUse
            .from("catalog_items")
            .update(catalogUpdate)
            .eq("id", catalogItem.id);
          if (error) {
            console.error("[api/tests/[id]] Erreur mise à jour catalog_items:", error);
          } else {
            console.log(`[api/tests/[id]] ✓ Catalog item mis à jour:`, catalogUpdate);
          }
        } catch (err) {
          console.error("[api/tests/[id]] Erreur mise à jour catalog_items:", err);
        }
      }
    }

    return NextResponse.json({ 
      message: "Test mis à jour avec succès",
      test: updatedTest 
    });

  } catch (error) {
    console.error("[api/tests/[id]] Erreur inattendue:", error);
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

