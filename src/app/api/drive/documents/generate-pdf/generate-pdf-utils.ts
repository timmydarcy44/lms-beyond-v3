import { SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleClient } from "@/lib/supabase/server";

// Fonction pour convertir HTML en PDF en préservant le formatage
async function htmlToPdf(htmlContent: string, title: string): Promise<Buffer> {
  // Import dynamique de puppeteer pour éviter les problèmes avec les imports ES modules
  const puppeteer = await import("puppeteer");
  
  // Extraire les balises <style> du contenu HTML pour les placer dans le <head>
  const styleMatches = htmlContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const extractedStyles = styleMatches.join('\n');
  
  // Retirer les balises <style> du contenu pour éviter la duplication
  let cleanContent = htmlContent;
  styleMatches.forEach(styleTag => {
    cleanContent = cleanContent.replace(styleTag, '');
  });
  
  // Créer une page HTML complète avec les styles pour préserver le formatage
  const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #000;
      padding: 40px;
      background: #fff;
    }
    h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #000;
    }
    .content {
      max-width: 100%;
    }
    /* Préserver tous les styles du contenu (gras, couleurs, etc.) */
    ${extractedStyles}
    /* Styles par défaut pour les éléments courants */
    strong, b {
      font-weight: bold;
    }
    em, i {
      font-style: italic;
    }
    u {
      text-decoration: underline;
    }
    p {
      margin-bottom: 1em;
    }
    ul, ol {
      margin-left: 2em;
      margin-bottom: 1em;
    }
    li {
      margin-bottom: 0.5em;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="content">
    ${cleanContent}
  </div>
</body>
</html>
  `.trim();

  // Lancer Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Définir le contenu HTML
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0',
    });

    // Générer le PDF avec les options de formatage
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true, // Important pour préserver les couleurs de fond
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function generatePdfForDocument({
  documentId,
  htmlContent,
  title,
  userId,
  supabase,
  skipAuthCheck = false,
}: {
  documentId: string;
  htmlContent: string;
  title: string;
  userId: string;
  supabase: SupabaseClient;
  skipAuthCheck?: boolean;
}): Promise<string> {
  // Vérifier que l'utilisateur est bien l'auteur du document (sauf si skipAuthCheck est true)
  if (!skipAuthCheck) {
    const { data: document, error: docError } = await supabase
      .from("drive_documents")
      .select("author_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("[generate-pdf-utils] Document not found:", { documentId, error: docError });
      throw new Error("Document non trouvé");
    }

    if (document.author_id !== userId) {
      console.error("[generate-pdf-utils] Unauthorized:", { documentId, userId, authorId: document.author_id });
      throw new Error("Non autorisé");
    }
  } else {
    console.log("[generate-pdf-utils] Skipping auth check (using service role client)");
  }

  // Générer le PDF
  console.log("[generate-pdf-utils] Generating PDF for document:", documentId, "title:", title);
  const pdfBuffer = await htmlToPdf(htmlContent, title);
  console.log("[generate-pdf-utils] PDF buffer generated, size:", pdfBuffer.length, "bytes");

  // Générer un nom de fichier unique
  const fileName = `drive-documents/${userId}/${documentId}-${Date.now()}.pdf`;
  console.log("[generate-pdf-utils] Target file name:", fileName);
  
  // Utiliser le service role client pour l'upload (bypass RLS)
  const serviceClient = getServiceRoleClient();
  if (!serviceClient) {
    console.error("[generate-pdf-utils] Service role client not available");
    throw new Error("Service role client non disponible");
  }

  // Upload vers Supabase Storage - essayer plusieurs buckets
  const bucketsToTry = ["drive-documents", "public", "uploads", "files"];
  let bucketName: string | null = null;
  let uploadData: any = null;
  let uploadError: any = null;

  for (const bucket of bucketsToTry) {
    console.log("[generate-pdf-utils] Trying bucket:", bucket);
    const result = await serviceClient.storage
      .from(bucket)
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (!result.error) {
      bucketName = bucket;
      uploadData = result.data;
      break;
    } else {
      uploadError = result.error;
      // Si l'erreur n'est pas "Bucket not found", arrêter la boucle
      if (!uploadError.message?.includes("Bucket not found") && !uploadError.message?.includes("not found")) {
        break;
      }
    }
  }

  if (!bucketName || uploadError) {
    console.error("[generate-pdf-utils] Upload error:", {
      error: uploadError,
      message: uploadError?.message,
      bucketsTried: bucketsToTry,
      fileName,
    });
    throw new Error(`Erreur lors de l'upload du PDF: ${uploadError?.message || "Aucun bucket disponible. Veuillez créer le bucket 'drive-documents' ou 'public' dans Supabase Storage."}`);
  }

  console.log("[generate-pdf-utils] Upload successful to bucket:", bucketName, uploadData);

  // Obtenir l'URL publique
  const { data: urlData } = serviceClient.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  console.log("[generate-pdf-utils] Public URL:", urlData.publicUrl);

  // Mettre à jour le document avec l'URL du PDF (utiliser le service role client pour bypass RLS)
  const { error: updateError } = await serviceClient
    .from("drive_documents")
    .update({ file_url: urlData.publicUrl })
    .eq("id", documentId);

  if (updateError) {
    console.error("[generate-pdf-utils] Update error:", {
      error: updateError,
      message: updateError.message,
      documentId,
      fileUrl: urlData.publicUrl,
    });
    throw new Error(`Erreur lors de la mise à jour du document: ${updateError.message}`);
  }

  console.log("[generate-pdf-utils] PDF generated and uploaded successfully:", urlData.publicUrl);

  return urlData.publicUrl;
}

