import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

/**
 * Recherche automatiquement un PDF dans Supabase Storage et l'associe à une ressource
 * POST /api/admin/auto-link-resource-pdf
 * Body: { resourceId: string, fileName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, fileName } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId est requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase client unavailable" },
        { status: 500 }
      );
    }

    // Récupérer la ressource pour obtenir son titre
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id, title")
      .eq("id", resourceId)
      .maybeSingle();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    // Buckets à chercher (dans l'ordre de priorité)
    const buckets = ["Public", "Jessica CONTENTIN"];
    
    // Noms de fichiers possibles à chercher
    const searchNames = fileName 
      ? [fileName, `${fileName}.pdf`, fileName.replace(/\.pdf$/i, "") + ".pdf"]
      : [
          "Guide_pratique_le_sommeil",
          "Guide_pratique_le_sommeil.pdf",
          "guide-pratique-le-sommeil.pdf",
          "guide_pratique_le_sommeil.pdf",
          // Générer des variantes à partir du titre
          ...resource.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .split("_")
            .slice(0, 5) // Prendre les 5 premiers mots
            .map((word, index, arr) => {
              if (index === 0) return word + ".pdf";
              return arr.slice(0, index + 1).join("_") + ".pdf";
            }),
        ];

    console.log("[auto-link-resource-pdf] Recherche du PDF pour:", {
      resourceId,
      resourceTitle: resource.title,
      searchNames,
      buckets,
    });

    let foundFile: { bucket: string; path: string; url: string } | null = null;

    // Chercher dans chaque bucket
    for (const bucket of buckets) {
      try {
        // Lister tous les fichiers du bucket
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list("", {
            limit: 1000,
            offset: 0,
            sortBy: { column: "name", order: "asc" },
          });

        if (listError) {
          console.warn(`[auto-link-resource-pdf] Erreur lors de la liste du bucket ${bucket}:`, listError);
          continue;
        }

        if (!files || files.length === 0) {
          continue;
        }

        // Chercher récursivement dans les sous-dossiers
        const searchInFolder = async (folderPath: string = ""): Promise<{ bucket: string; path: string; url: string } | null> => {
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from(bucket)
            .list(folderPath, {
              limit: 1000,
              offset: 0,
              sortBy: { column: "name", order: "asc" },
            });

          if (folderError || !folderFiles) {
            return null;
          }

          // Chercher dans les fichiers de ce dossier
          for (const file of folderFiles) {
            if (file.id === null) {
              // C'est un dossier, chercher récursivement
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              const found = await searchInFolder(subFolderPath);
              if (found) return found;
              continue;
            }

            // C'est un fichier, vérifier si c'est un PDF qui correspond
            const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
            const fileNameLower = file.name.toLowerCase();
            
            // Vérifier si c'est un PDF
            if (!fileNameLower.endsWith(".pdf")) {
              continue;
            }

            // Vérifier si le nom correspond à un des noms recherchés
            for (const searchName of searchNames) {
              const searchNameLower = searchName.toLowerCase().replace(/\.pdf$/i, "");
              const fileNameWithoutExt = fileNameLower.replace(/\.pdf$/, "");
              
              if (
                fileNameLower.includes(searchNameLower) ||
                searchNameLower.includes(fileNameWithoutExt) ||
                fileNameWithoutExt.includes(searchNameLower) ||
                file.name.toLowerCase().includes("sommeil") ||
                file.name.toLowerCase().includes("guide")
              ) {
                // Construire l'URL publique
                const { data: { publicUrl } } = supabase.storage
                  .from(bucket)
                  .getPublicUrl(filePath);

                console.log(`[auto-link-resource-pdf] ✅ Fichier trouvé: ${bucket}/${filePath}`);
                return {
                  bucket,
                  path: filePath,
                  url: publicUrl,
                };
              }
            }
          }

          return null;
        };

        // Chercher dans le bucket
        foundFile = await searchInFolder();
        if (foundFile) {
          break; // Fichier trouvé, arrêter la recherche
        }
      } catch (error) {
        console.error(`[auto-link-resource-pdf] Erreur lors de la recherche dans ${bucket}:`, error);
        continue;
      }
    }

    if (!foundFile) {
      return NextResponse.json(
        {
          error: "PDF non trouvé dans Storage",
          searchedBuckets: buckets,
          searchedNames: searchNames,
          suggestion: "Vérifiez que le fichier est bien uploadé dans Supabase Storage (bucket 'Public' ou 'Jessica CONTENTIN')",
        },
        { status: 404 }
      );
    }

    // Mettre à jour la ressource avec l'URL du PDF
    const { error: updateError } = await supabase
      .from("resources")
      .update({
        file_url: foundFile.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resourceId);

    if (updateError) {
      console.error("[auto-link-resource-pdf] Erreur lors de la mise à jour:", updateError);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PDF associé avec succès à la ressource",
      resource: {
        id: resourceId,
        title: resource.title,
        file_url: foundFile.url,
      },
      file: {
        bucket: foundFile.bucket,
        path: foundFile.path,
        url: foundFile.url,
      },
    });
  } catch (error) {
    console.error("[auto-link-resource-pdf] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

