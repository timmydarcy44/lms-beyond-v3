import { SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleClient } from "@/lib/supabase/server";

// Fonction pour convertir HTML en PDF
async function htmlToPdf(htmlContent: string, title: string): Promise<Buffer> {
  // Import dynamique de jsPDF pour éviter les problèmes avec les imports ES modules
  const { jsPDF } = await import("jspdf");
  
  // Extraire le texte du HTML (supprimer les balises)
  const textContent = htmlContent
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Créer un PDF avec jsPDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Ajouter le titre
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, 180);
  doc.text(titleLines, 10, 20);

  // Ajouter le contenu
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(textContent, 180);
  
  let y = 35;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  lines.forEach((line: string) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, 10, y);
    y += lineHeight;
  });

  // Convertir en buffer (utiliser "arraybuffer" au lieu de "blob" pour Node.js)
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
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

  // Upload vers Supabase Storage (bucket "public")
  const bucketName = "public";
  
  console.log("[generate-pdf-utils] Uploading to bucket:", bucketName);
  const { data: uploadData, error: uploadError } = await serviceClient.storage
    .from(bucketName)
    .upload(fileName, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("[generate-pdf-utils] Upload error:", {
      error: uploadError,
      message: uploadError.message,
      statusCode: uploadError.statusCode,
      bucketName,
      fileName,
    });
    throw new Error(`Erreur lors de l'upload du PDF: ${uploadError.message}`);
  }

  console.log("[generate-pdf-utils] Upload successful:", uploadData);

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

