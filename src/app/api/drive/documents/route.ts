import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { estimateAIUsageScore } from "@/lib/drive/ai-usage";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Récupérer tous les documents de l'apprenant
    // Essayer d'abord avec author_id (version 003), sinon user_id (version 005)
    let documents, error;
    
    const queryWithAuthorId = await supabase
      .from("drive_documents")
      .select("id, title, content, status, folder_id, updated_at, deposited_at, submitted_at")
      .eq("author_id", userId)
      .order("updated_at", { ascending: false });
    
    if (queryWithAuthorId.error?.code === '42703' && queryWithAuthorId.error?.message?.includes('author_id')) {
      // Pas de colonne author_id, utiliser user_id (version 005)
      const queryWithUserId = await supabase
        .from("drive_documents")
        .select("id, name, url, folder_id, updated_at, submitted_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      
      documents = queryWithUserId.data;
      error = queryWithUserId.error;
      
      // Mapper name -> title, url -> file_url, pas de content/status dans version 005
      if (documents) {
        documents = documents.map((doc: any) => ({
          ...doc,
          title: doc.name || "Document sans titre",
          content: "",
          status: "draft",
          file_url: doc.url,
        }));
      }
    } else {
      documents = queryWithAuthorId.data;
      error = queryWithAuthorId.error;
    }

    if (error) {
      console.error("[drive/documents] Error fetching documents:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error("[drive/documents] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;
    const body = await request.json();
    const { title, content, status, folderId, consigneId, instructorId } = body;
    
    console.log("[drive/documents] POST request body:", {
      hasTitle: !!title,
      hasContent: !!content,
      status,
      statusType: typeof status,
      statusIsShared: status === "shared",
      folderId,
      consigneId,
      instructorId,
    });

    if (!title?.trim() || !content) {
      return NextResponse.json({ error: "title et content sont requis" }, { status: 400 });
    }

    console.log("[drive/documents] Creating document for user:", userId);

    // Si le document est partagé, utiliser l'instructorId fourni ou trouver automatiquement
    let sharedWith: string | null = null;
    if (status === "shared") {
      if (instructorId) {
        // Utiliser l'ID du formateur fourni explicitement
        sharedWith = instructorId;
        console.log("[drive/documents] Using provided instructor ID:", sharedWith);
      } else {
        // Fallback: trouver automatiquement un formateur
        const { data: learnerMemberships } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", userId)
          .eq("role", "learner");

        if (learnerMemberships && learnerMemberships.length > 0) {
          const orgIds = learnerMemberships.map(m => m.org_id);
          
          // Trouver un formateur dans ces organisations
          const { data: instructorMemberships } = await supabase
            .from("org_memberships")
            .select("user_id")
            .in("org_id", orgIds)
            .eq("role", "instructor")
            .limit(1)
            .maybeSingle();

          if (instructorMemberships?.user_id) {
            sharedWith = instructorMemberships.user_id;
            console.log("[drive/documents] Auto-found instructor to share with:", sharedWith);
          } else {
            console.warn("[drive/documents] No instructor found for learner organizations:", orgIds);
          }
        }
      }
    }

    // Calculer le nombre de mots
    const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

    // Créer le document dans la base de données
    // La table a author_id, title, content, status, shared_with (structure version 003)
    // Si folder_id est NOT NULL, créer ou trouver un dossier par défaut
    let finalFolderId = folderId;
    if (!finalFolderId) {
      // Chercher un dossier par défaut pour l'utilisateur
      // drive_folders utilise owner_id (pas user_id)
      const { data: defaultFolder } = await supabase
        .from("drive_folders")
        .select("id")
        .eq("owner_id", userId)
        .eq("name", "Mes documents")
        .maybeSingle();

      if (defaultFolder) {
        finalFolderId = defaultFolder.id;
      } else {
        // Créer un dossier par défaut
        // consigne_id doit être NULL pour les dossiers généraux (pas liés à une consigne)
        const folderData: any = {
          owner_id: userId,
          name: "Mes documents",
          consigne_id: null, // Explicitement null pour les dossiers généraux
        };
        
        const { data: newFolder, error: createFolderError } = await supabase
          .from("drive_folders")
          .insert(folderData)
          .select("id")
          .single();

        if (newFolder && !createFolderError) {
          finalFolderId = newFolder.id;
          console.log("[drive/documents] Created default folder:", finalFolderId);
        } else {
          console.error("[drive/documents] Failed to create default folder:", createFolderError);
          // Si on ne peut pas créer de dossier, on essaiera sans folder_id (peut-être que la colonne est nullable)
        }
      }
    }

    // Si on n'a toujours pas de dossier et que folder_id est NOT NULL, on doit absolument en créer un
    if (!finalFolderId) {
      console.warn("[drive/documents] No folder ID available, attempting to create one...");
      // Réessayer de créer le dossier avec gestion d'erreur
      try {
        const { data: newFolder, error: createFolderError } = await supabase
          .from("drive_folders")
          .insert({
            owner_id: userId,
            name: "Mes documents",
          })
          .select("id")
          .single();

        if (newFolder && !createFolderError) {
          finalFolderId = newFolder.id;
          console.log("[drive/documents] Successfully created default folder:", finalFolderId);
        } else {
          console.error("[drive/documents] Failed to create folder with regular client:", createFolderError);
          // Si RLS bloque, essayer avec le service role client
          try {
            const serviceClient = getServiceRoleClient();
            if (serviceClient) {
              // Pour le service role, ne pas inclure consigne_id non plus
              const { data: serviceFolder, error: serviceError } = await serviceClient
                .from("drive_folders")
                .insert({
                  owner_id: userId,
                  name: "Mes documents",
                  consigne_id: null, // Explicitement null pour les dossiers généraux
                })
                .select("id")
                .single();

              if (serviceFolder && !serviceError) {
                finalFolderId = serviceFolder.id;
                console.log("[drive/documents] Created folder with service role:", finalFolderId);
              } else {
                console.error("[drive/documents] Service role also failed:", serviceError);
                return NextResponse.json(
                  {
                    error: "Impossible de créer le dossier par défaut",
                    details: serviceError?.message || createFolderError?.message || "Erreur inconnue lors de la création du dossier",
                    code: serviceError?.code || createFolderError?.code,
                  },
                  { status: 500 }
                );
              }
            } else {
              return NextResponse.json(
                {
                  error: "Impossible de créer le dossier par défaut",
                  details: createFolderError?.message || "Service role client non disponible",
                  code: createFolderError?.code,
                },
                { status: 500 }
              );
            }
          } catch (serviceError) {
            console.error("[drive/documents] Exception with service role:", serviceError);
            return NextResponse.json(
              {
                error: "Impossible de créer le dossier par défaut",
                details: createFolderError?.message || (serviceError instanceof Error ? serviceError.message : String(serviceError)),
                code: createFolderError?.code,
              },
              { status: 500 }
            );
          }
        }
      } catch (folderError) {
        console.error("[drive/documents] Exception creating folder:", folderError);
        return NextResponse.json(
          {
            error: "Erreur lors de la création du dossier",
            details: folderError instanceof Error ? folderError.message : String(folderError),
          },
          { status: 500 }
        );
      }
    }

    // À ce point, finalFolderId DOIT être défini
    if (!finalFolderId) {
      return NextResponse.json(
        {
          error: "Impossible d'obtenir un dossier pour le document",
          details: "folder_id est requis mais aucun dossier n'a pu être créé ou trouvé",
        },
        { status: 500 }
      );
    }

    const aiUsageScore = estimateAIUsageScore(content);

    const documentData: any = {
      author_id: userId,
      title: title.trim(),
      content: content,
      status: status || "draft",
      shared_with: sharedWith || null,
      word_count: wordCount,
      ai_usage_score: aiUsageScore,
      folder_id: finalFolderId, // Maintenant on est sûr qu'il est défini
      file_url: null, // Sera généré si status === "shared"
      deposited_at: new Date().toISOString(),
      submitted_at: status === "shared" ? new Date().toISOString() : null,
      is_read: false,
    };

    console.log("[drive/documents] Final document data:", {
      author_id: documentData.author_id,
      title: documentData.title,
      folder_id: documentData.folder_id,
      status: documentData.status,
    });

    console.log("[drive/documents] Creating document with data:", {
      author_id: documentData.author_id,
      title: documentData.title,
      status: documentData.status,
      shared_with: documentData.shared_with,
      word_count: documentData.word_count,
    });

    // Si c'est une réponse à une consigne, récupérer la date limite
    if (consigneId) {
      const { data: consigneMessage } = await supabase
        .from("messages")
        .select("metadata")
        .eq("id", consigneId)
        .single();

      if (consigneMessage?.metadata) {
        const dueDate = (consigneMessage.metadata as any)?.dueDate;
        if (dueDate) {
          documentData.due_at = new Date(dueDate).toISOString();
        }
      }
    }

    const { data: document, error: documentError } = await supabase
      .from("drive_documents")
      .insert(documentData)
      .select("id, title, status, shared_with, submitted_at, updated_at")
      .single();

    if (documentError || !document) {
      console.error("[drive/documents] Error creating document:", {
        error: documentError,
        code: documentError?.code,
        message: documentError?.message,
        details: documentError?.details,
        hint: documentError?.hint,
        fullError: JSON.stringify(documentError, Object.getOwnPropertyNames(documentError)),
      });
      
      // Si c'est une erreur de colonne manquante, essayer sans file_url
      if (documentError?.code === "42703" || documentError?.message?.includes("column") || documentError?.message?.includes("does not exist")) {
        console.log("[drive/documents] Retrying without optional columns...");
        // Pour le retry, utiliser le finalFolderId créé précédemment
        const retryData: any = {
          author_id: userId,
          title: title.trim(),
          content: content,
          status: status || "draft",
          shared_with: sharedWith || null,
          word_count: wordCount,
          ai_usage_score: aiUsageScore,
          file_url: null, // file_url peut être NULL si aucun fichier PDF n'est uploadé
          deposited_at: new Date().toISOString(),
          submitted_at: status === "shared" ? new Date().toISOString() : null,
          is_read: false,
        };
        
        // Inclure folder_id seulement si on a un dossier
        if (finalFolderId) {
          retryData.folder_id = finalFolderId;
        }
        
        const { data: retryDocument, error: retryError } = await supabase
          .from("drive_documents")
          .insert(retryData)
          .select("id, title, status, shared_with, submitted_at, updated_at")
          .single();
        
        if (retryError || !retryDocument) {
          console.error("[drive/documents] Retry also failed:", retryError);
          return NextResponse.json(
            { 
              error: "Erreur lors de la création du document", 
              details: documentError?.message || retryError?.message,
              code: documentError?.code || retryError?.code
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          documentId: retryDocument.id,
          document: retryDocument,
        });
      }
      
      return NextResponse.json(
        { 
          error: "Erreur lors de la création du document", 
          details: documentError?.message,
          code: documentError?.code,
          hint: documentError?.hint
        },
        { status: 500 }
      );
    }

    console.log("[drive/documents] Document created successfully:", {
      id: document.id,
      title: document.title,
      status: document.status,
      shared_with: document.shared_with,
    });

    // Si le document est partagé, générer le PDF
    // IMPORTANT: On génère le PDF de manière synchrone pour s'assurer qu'il est créé
    // même si cela ralentit légèrement la réponse
    console.log("[drive/documents] Checking if PDF generation is needed:", {
      status,
      documentId: document.id,
      hasContent: !!content,
      contentLength: content?.length || 0,
    });
    
    if (status === "shared" && document.id) {
      console.log("[drive/documents] ✓ Document is shared, generating PDF synchronously for:", document.id);
      try {
        // Utiliser le service role client pour bypass RLS
        const serviceClient = getServiceRoleClient();
        if (!serviceClient) {
          console.error("[drive/documents] Service role client not available for PDF generation");
        } else {
          // Importer et appeler directement la fonction de génération PDF
          const { generatePdfForDocument } = await import("@/app/api/drive/documents/generate-pdf/generate-pdf-utils");
          
          console.log("[drive/documents] Starting PDF generation for document:", document.id, "title:", title.trim());
          await generatePdfForDocument({
            documentId: document.id,
            htmlContent: content,
            title: title.trim(),
            userId,
            supabase: serviceClient as any, // Utiliser le service role client
            skipAuthCheck: true, // Bypasser la vérification d'autorisation
          });
          console.log("[drive/documents] PDF generated successfully for document:", document.id);
        }
      } catch (pdfError) {
        console.error("[drive/documents] Error generating PDF for document:", document.id, {
          error: pdfError,
          message: pdfError instanceof Error ? pdfError.message : String(pdfError),
          stack: pdfError instanceof Error ? pdfError.stack : undefined,
        });
        // Ne pas échouer la création du document si la génération PDF échoue
        // Le PDF pourra être régénéré plus tard via l'endpoint de régénération
      }
    } else {
      console.log("[drive/documents] Document is not shared, skipping PDF generation. Status:", status, "Document ID:", document.id);
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      document: {
        id: document.id,
        title: document.title || (document as any).name || "",
        createdAt: document.submitted_at || document.updated_at,
      },
    });
  } catch (error) {
    console.error("[drive/documents] POST Unexpected error:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { 
        error: "Erreur serveur", 
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : "UnknownError"
      },
      { status: 500 }
    );
  }
}

