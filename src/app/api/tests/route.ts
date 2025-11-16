import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { createStripeProduct, updateStripeProduct } from "@/lib/stripe/products";
import { calculateTestDuration, formatTestDuration } from "@/lib/utils/test-duration";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      testId, 
      status = "draft",
      // Données pour la création
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
    } = body as {
      testId?: string;
      status?: "draft" | "published";
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
    };

    // Si pas de testId, c'est une création
    if (!testId) {
      if (!title || !title.trim()) {
        return NextResponse.json({ error: "Titre de test requis" }, { status: 400 });
      }

      // Vérifier si l'utilisateur est Super Admin
      const { data: superAdmin } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const isSuperAdmin = !!superAdmin;

      // Récupérer l'org_id
      let userOrgId: string | null = null;
      
      if (!isSuperAdmin) {
        const { data: memberships } = await supabase
          .from("org_memberships")
          .select("org_id, role")
          .eq("user_id", user.id)
          .in("role", ["instructor", "admin", "tutor"])
          .limit(1);

        if (memberships && memberships.length > 0) {
          userOrgId = memberships[0].org_id;
        }
      } else {
        const { data: memberships } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1);

        if (memberships && memberships.length > 0) {
          userOrgId = memberships[0].org_id;
        } else {
          // Créer une organisation par défaut pour le Super Admin
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", user.id)
            .single();

          const orgName = profile?.full_name || profile?.email || "Organisation Super Admin";
          
          // Utiliser le service role client pour bypasser RLS lors de la création d'organisation
          const { getServiceRoleClient } = await import("@/lib/supabase/server");
          const serviceClient = getServiceRoleClient();
          const clientToUse = serviceClient || supabase;
          
          // Essayer d'abord avec description, puis sans si la colonne n'existe pas
          let orgCreateResult = await clientToUse
            .from("organizations")
            .insert({
              name: orgName,
              description: "Organisation par défaut pour Super Admin",
            })
            .select()
            .single();

          // Si erreur liée à description, réessayer sans
          if (orgCreateResult.error && (
            orgCreateResult.error.message?.includes("description") || 
            orgCreateResult.error.code === "42703" ||
            orgCreateResult.error.message?.includes("Could not find")
          )) {
            console.log("[api/tests] Colonne description non trouvée, création sans description");
            orgCreateResult = await clientToUse
              .from("organizations")
              .insert({
                name: orgName,
              })
              .select()
              .single();
          }

          const { data: newOrg, error: orgCreateError } = orgCreateResult;

          if (!orgCreateError && newOrg) {
            userOrgId = newOrg.id;
            await supabase
              .from("org_memberships")
              .insert({
                user_id: user.id,
                org_id: newOrg.id,
                role: "admin",
              });
            console.log("[api/tests] Organisation créée pour Super Admin:", userOrgId);
          } else {
            console.error("[api/tests] Erreur lors de la création de l'organisation:", orgCreateError);
          }
        }
      }

      // Si org_id est requis mais non trouvé, créer une organisation d'urgence
      if (!userOrgId) {
        console.warn("[api/tests] Aucun org_id trouvé, création d'organisation d'urgence");
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", user.id)
          .maybeSingle();

        const orgName = profile?.full_name || profile?.email || `Organisation ${user.id.substring(0, 8)}`;
        
        // Utiliser le service role client pour bypasser RLS lors de la création d'organisation
        const { getServiceRoleClient } = await import("@/lib/supabase/server");
        const serviceClient = getServiceRoleClient();
        const clientToUse = serviceClient || supabase;
        
        // Essayer d'abord avec description, puis sans si la colonne n'existe pas
        let emergencyOrgResult = await clientToUse
          .from("organizations")
          .insert({
            name: orgName,
            description: "Organisation créée automatiquement",
          })
          .select()
          .single();

        // Si erreur liée à description, réessayer sans
        if (emergencyOrgResult.error && (
          emergencyOrgResult.error.message?.includes("description") || 
          emergencyOrgResult.error.code === "42703" ||
          emergencyOrgResult.error.message?.includes("Could not find")
        )) {
          console.log("[api/tests] Colonne description non trouvée, création d'urgence sans description");
          emergencyOrgResult = await clientToUse
            .from("organizations")
            .insert({
              name: orgName,
            })
            .select()
            .single();
        }

        const { data: emergencyOrg, error: emergencyError } = emergencyOrgResult;

        if (!emergencyError && emergencyOrg) {
          userOrgId = emergencyOrg.id;
          await supabase
            .from("org_memberships")
            .insert({
              user_id: user.id,
              org_id: emergencyOrg.id,
              role: isSuperAdmin ? "admin" : "instructor",
            });
          console.log("[api/tests] Organisation d'urgence créée:", userOrgId);
        } else {
          console.error("[api/tests] Impossible de créer une organisation d'urgence:", emergencyError);
          return NextResponse.json({ 
            error: "Impossible de créer une organisation", 
            details: emergencyError?.message || "Erreur inconnue lors de la création de l'organisation"
          }, { status: 500 });
        }
      }

      // Créer le test
      const testData: any = {
        title: title.trim(),
        creator_id: user.id,
        status: published ? "published" : "draft",
        org_id: userOrgId, // Toujours défini maintenant
      };

      // Ajouter form_url si la colonne existe (avec valeur par défaut vide)
      // Cette colonne sera gérée par le fallback si elle n'existe pas
      testData.form_url = ""; // Chaîne vide par défaut (si la colonne est NOT NULL)

      if (description?.trim()) {
        testData.description = description.trim();
      }

      // Calculer automatiquement la durée si des questions sont fournies
      if (questions && Array.isArray(questions) && questions.length > 0) {
        const calculatedMinutes = calculateTestDuration(questions);
        testData.duration = formatTestDuration(calculatedMinutes);
        console.log(`[api/tests] Calculated duration: ${testData.duration} (${questions.length} questions)`);
      } else if (duration?.trim()) {
        // Si pas de questions mais durée fournie manuellement, utiliser celle-ci
        testData.duration = duration.trim();
      }

      if (price !== undefined && price !== null) {
        testData.price = parseFloat(String(price)) || 0;
      }

      if (category?.trim()) {
        testData.category = category.trim();
      }

      // Ajouter display_format si fourni
      if (display_format) {
        testData.display_format = display_format;
      }

      // Ajouter questions si fourni (stockées en JSONB)
      if (questions && Array.isArray(questions)) {
        testData.questions = questions;
      }

      // Essayer avec published (boolean) si status n'existe pas
      const { data: test, error: createError } = await supabase
        .from("tests")
        .insert(testData)
        .select()
        .single();

      if (createError) {
        // Si l'erreur est liée à form_url NOT NULL, essayer avec une valeur par défaut
        if (createError.message?.includes("form_url") && createError.code === "23502") {
          console.log("[api/tests] form_url NOT NULL détecté, ajout d'une valeur par défaut");
          testData.form_url = ""; // Chaîne vide par défaut
          
          const retryResult = await supabase
            .from("tests")
            .insert(testData)
            .select()
            .single();
          
          if (!retryResult.error) {
            return NextResponse.json({ 
              success: true, 
              test: retryResult.data,
              message: published ? "Test créé et publié avec succès" : "Test créé en brouillon"
            });
          }
        }
        
        // Si l'erreur est liée à une colonne manquante, retirer et réessayer
        if (createError.code === "42703") {
          console.log("[api/tests] Colonne manquante détectée, nettoyage des données");
          
          // Retirer les colonnes qui pourraient ne pas exister
          const cleanedTestData = { ...testData };
          if (cleanedTestData.price) delete cleanedTestData.price;
          if (cleanedTestData.duration) delete cleanedTestData.duration;
          if (cleanedTestData.display_format) delete cleanedTestData.display_format;
          if (cleanedTestData.questions) delete cleanedTestData.questions;
          if (cleanedTestData.form_url === null) delete cleanedTestData.form_url;
          
          const retryResult = await supabase
            .from("tests")
            .insert(cleanedTestData)
            .select()
            .single();
          
          if (!retryResult.error) {
            return NextResponse.json({ 
              success: true, 
              test: retryResult.data,
              message: published ? "Test créé et publié avec succès" : "Test créé en brouillon"
            });
          }
        }
        
        // Si l'erreur mentionne spécifiquement 'duration', retirer duration et réessayer
        if (createError.message?.includes("duration") && createError.code === "42703") {
          console.log("[api/tests] Colonne duration non trouvée, retrait de la durée");
          delete testData.duration;
          
          const retryResult = await supabase
            .from("tests")
            .insert(testData)
            .select()
            .single();
          
          if (!retryResult.error) {
            return NextResponse.json({ 
              success: true, 
              test: retryResult.data,
              message: published ? "Test créé et publié avec succès" : "Test créé en brouillon"
            });
          }
        }
        
        // Si l'erreur est liée à la colonne price, retirer price et réessayer
        if (createError.message?.includes("price") && createError.code === "42703") {
          console.log("[api/tests] Colonne price non trouvée, retrait du prix");
          delete testData.price;
          
          const retryResult = await supabase
            .from("tests")
            .insert(testData)
            .select()
            .single();
          
          if (!retryResult.error) {
            const testData = retryResult.data;
            
            // Créer automatiquement un produit Stripe si un prix > 0 est défini
            if (testData && testData.id && price !== undefined && price !== null && price > 0) {
              try {
                const stripeProduct = await createStripeProduct({
                  title: title.trim(),
                  description: description?.trim() || undefined,
                  price: parseFloat(String(price)),
                  contentType: "test",
                  contentId: testData.id,
                  userId: user.id,
                  metadata: {
                    test_id: testData.id,
                    org_id: userOrgId || "",
                  },
                });

                if (stripeProduct) {
                  await supabase
                    .from("tests")
                    .update({
                      stripe_product_id: stripeProduct.productId,
                      stripe_price_id: stripeProduct.priceId,
                    })
                    .eq("id", testData.id);
                }
              } catch (stripeError) {
                console.error("[api/tests] Erreur Stripe:", stripeError);
              }
            }
            
            return NextResponse.json({ 
              success: true, 
              test: testData,
              message: published ? "Test créé et publié avec succès" : "Test créé en brouillon"
            });
          }
        }
        
        // Essayer avec published au lieu de status
        const testDataWithPublished = { ...testData };
        delete testDataWithPublished.status;
        testDataWithPublished.published = published || false;
        
        // Retirer les colonnes optionnelles qui pourraient ne pas exister
        if (testDataWithPublished.price) {
          delete testDataWithPublished.price;
        }
        if (testDataWithPublished.duration) {
          delete testDataWithPublished.duration;
        }
        if (testDataWithPublished.display_format) {
          delete testDataWithPublished.display_format;
        }
        if (testDataWithPublished.questions) {
          delete testDataWithPublished.questions;
        }
        // Si form_url est null et cause une erreur, essayer avec une chaîne vide
        if (testDataWithPublished.form_url === null) {
          testDataWithPublished.form_url = "";
        }

        const { data: test2, error: createError2 } = await supabase
          .from("tests")
          .insert(testDataWithPublished)
          .select()
          .single();

        if (createError2) {
          console.error("[api/tests] Erreur lors de la création:", createError2);
          return NextResponse.json({ 
            error: "Erreur lors de la création", 
            details: createError2.message 
          }, { status: 500 });
        }

        // Créer automatiquement un produit Stripe si un prix > 0 est défini
        if (test2 && test2.id && price !== undefined && price !== null && price > 0) {
          try {
            const stripeProduct = await createStripeProduct({
              title: title.trim(),
              description: description?.trim() || undefined,
              price: parseFloat(String(price)),
              contentType: "test",
              contentId: test2.id,
              userId: user.id,
              metadata: {
                test_id: test2.id,
                org_id: userOrgId || "",
              },
            });

            if (stripeProduct) {
              await supabase
                .from("tests")
                .update({
                  stripe_product_id: stripeProduct.productId,
                  stripe_price_id: stripeProduct.priceId,
                })
                .eq("id", test2.id);
            }
          } catch (stripeError) {
            console.error("[api/tests] Erreur Stripe:", stripeError);
          }
        }

        return NextResponse.json({ 
          success: true, 
          test: test2,
          message: published ? "Test créé et publié avec succès" : "Test créé en brouillon"
        });
      }

      // Créer automatiquement un produit Stripe si un prix > 0 est défini
      if (test && test.id && price !== undefined && price !== null && price > 0) {
        try {
          const stripeProduct = await createStripeProduct({
            title: title.trim(),
            description: description?.trim() || undefined,
            price: parseFloat(String(price)),
            contentType: "test",
            contentId: test.id,
            userId: user.id,
            metadata: {
              test_id: test.id,
              org_id: userOrgId || "",
            },
          });

          if (stripeProduct) {
            await supabase
              .from("tests")
              .update({
                stripe_product_id: stripeProduct.productId,
                stripe_price_id: stripeProduct.priceId,
              })
              .eq("id", test.id);
          }
        } catch (stripeError) {
          console.error("[api/tests] Erreur Stripe:", stripeError);
        }
      }

      return NextResponse.json({ 
        success: true, 
        test: test,
        message: published ? "Test créé et publié avec succès" : "Test créé en brouillon"
      });
    }

    // Si testId existe, c'est une mise à jour
    if (!testId) {
      return NextResponse.json({ error: "ID de test requis" }, { status: 400 });
    }

    // Vérifier que le test existe et appartient au formateur
    // Essayer d'abord avec created_by, puis owner_id
    const { data: existingTest, error: checkError } = await supabase
      .from("tests")
      .select("id, created_by, owner_id")
      .eq("id", testId)
      .single();

    if (checkError || !existingTest) {
      return NextResponse.json({ error: "Test introuvable" }, { status: 404 });
    }

    // Vérifier la propriété (supporter created_by ET owner_id)
    const isOwner = (existingTest.created_by === user.id) || 
                   (existingTest.owner_id && existingTest.owner_id === user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à modifier ce test" }, { status: 403 });
    }

    // Mettre à jour le statut (et updated_at)
    const { data, error } = await supabase
      .from("tests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", testId)
      .select()
      .single();

    if (error) {
      console.error("[api/tests] Erreur lors de la mise à jour:", error);
      return NextResponse.json({ 
        error: "Erreur lors de la publication", 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      test: data,
      message: status === "published" ? "Test publié avec succès" : "Test sauvegardé en brouillon"
    });
  } catch (error) {
    console.error("[api/tests] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

