import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Lister tous les PDFs disponibles dans Supabase Storage
 * GET /api/admin/list-storage-pdfs?bucket=Public
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get("bucket") || "Public";

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase client unavailable" },
        { status: 500 }
      );
    }

    const allPdfs: Array<{ bucket: string; path: string; name: string; url: string }> = [];

    // Fonction récursive pour lister tous les PDFs
    const listPdfsInFolder = async (bucket: string, folderPath: string = ""): Promise<void> => {
      try {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list(folderPath, {
            limit: 1000,
            offset: 0,
            sortBy: { column: "name", order: "asc" },
          });

        if (error) {
          console.warn(`[list-storage-pdfs] Erreur dans ${bucket}/${folderPath}:`, error);
          return;
        }

        if (!files || files.length === 0) {
          return;
        }

        for (const file of files) {
          if (file.id === null) {
            // C'est un dossier, chercher récursivement
            const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
            await listPdfsInFolder(bucket, subFolderPath);
          } else {
            // C'est un fichier
            const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
            const fileNameLower = file.name.toLowerCase();
            
            if (fileNameLower.endsWith(".pdf")) {
              const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

              allPdfs.push({
                bucket,
                path: filePath,
                name: file.name,
                url: publicUrl,
              });
            }
          }
        }
      } catch (error) {
        console.error(`[list-storage-pdfs] Erreur dans ${bucket}/${folderPath}:`, error);
      }
    };

    // Chercher dans plusieurs buckets (commencer par le bucket dédié "pdfs")
    const buckets = [bucketName, "pdfs", "PDFs", "Public", "public", "Jessica CONTENTIN", "Jessica Contentin"];
    const uniqueBuckets = [...new Set(buckets)];

    for (const bucket of uniqueBuckets) {
      try {
        await listPdfsInFolder(bucket);
      } catch (error) {
        console.warn(`[list-storage-pdfs] Bucket ${bucket} non accessible:`, error);
      }
    }

    // Filtrer les PDFs qui pourraient correspondre
    const relevantPdfs = allPdfs.filter(pdf => 
      pdf.name.toLowerCase().includes("sommeil") ||
      pdf.name.toLowerCase().includes("guide") ||
      pdf.name.toLowerCase().includes("pratique")
    );

    return NextResponse.json({
      success: true,
      totalPdfs: allPdfs.length,
      relevantPdfs: relevantPdfs.length,
      allPdfs: allPdfs.slice(0, 50), // Limiter à 50 pour éviter une réponse trop grande
      relevantPdfsList: relevantPdfs,
    });
  } catch (error) {
    console.error("[list-storage-pdfs] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

