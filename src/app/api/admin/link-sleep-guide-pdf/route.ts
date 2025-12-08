import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Lier automatiquement le PDF au guide du sommeil
 * POST /api/admin/link-sleep-guide-pdf
 */
export async function POST(request: NextRequest) {
  try {
    const resourceId = "f2a961f4-bc0e-49cd-b683-ad65e834213b"; // ID de la ressource "Guide pratique : comprendre et résoudre les problématiques de sommeil"
    
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase client unavailable" },
        { status: 500 }
      );
    }

    // Buckets à chercher
    const buckets = ["pdfs", "PDFs", "Public", "public", "Jessica CONTENTIN"];
    
    // Noms de fichiers possibles
    const searchNames = [
      "cartesritueldusommeil",
      "cartesritueldusommeiljessicacontentin",
      "guide_sommeil",
      "guide-pratique-sommeil",
      "sommeil",
    ];

    let foundFile: { bucket: string; path: string; url: string } | null = null;

    // Chercher dans chaque bucket
    for (const bucket of buckets) {
      try {
        const searchInFolder = async (folderPath: string = ""): Promise<{ bucket: string; path: string; url: string } | null> => {
          const { data: files, error } = await supabase.storage
            .from(bucket)
            .list(folderPath, {
              limit: 1000,
              offset: 0,
              sortBy: { column: "name", order: "asc" },
            });

          if (error || !files) {
            return null;
          }

          for (const file of files) {
            if (file.id === null) {
              // C'est un dossier, chercher récursivement
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              const found = await searchInFolder(subFolderPath);
              if (found) return found;
              continue;
            }

            // C'est un fichier
            const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
            const fileNameLower = file.name.toLowerCase();
            
            if (!fileNameLower.endsWith(".pdf")) {
              continue;
            }

            // Vérifier si le nom correspond
            const fileNameWithoutExt = fileNameLower.replace(/\.pdf$/, "");
            const matches = searchNames.some(searchName => 
              fileNameWithoutExt.includes(searchName.toLowerCase())
            );

            if (matches) {
              const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
              
              return {
                bucket,
                path: filePath,
                url: publicUrl,
              };
            }
          }
          return null;
        };

        foundFile = await searchInFolder();
        if (foundFile) break;
      } catch (error) {
        console.warn(`[link-sleep-guide-pdf] Erreur dans ${bucket}:`, error);
      }
    }

    if (!foundFile) {
      return NextResponse.json(
        { 
          error: "PDF non trouvé dans Storage",
          searchedBuckets: buckets,
          searchedNames: searchNames,
        },
        { status: 404 }
      );
    }

    // Mettre à jour la ressource avec l'URL du PDF
    const { data: updatedResource, error: updateError } = await supabase
      .from("resources")
      .update({ 
        file_url: foundFile.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resourceId)
      .select("id, title, file_url")
      .single();

    if (updateError || !updatedResource) {
      return NextResponse.json(
        { 
          error: "Erreur lors de la mise à jour de la ressource",
          details: updateError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PDF lié avec succès à la ressource",
      resource: updatedResource,
      pdf: foundFile,
    });
  } catch (error: any) {
    console.error("[link-sleep-guide-pdf] Error:", error);
    return NextResponse.json(
      {
        error: "Erreur inattendue",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

