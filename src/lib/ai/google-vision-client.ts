import { ImageAnnotatorClient } from "@google-cloud/vision";

/**
 * Client Google Cloud Vision pour l'OCR
 */
let visionClient: ImageAnnotatorClient | null = null;

/**
 * Initialise et retourne le client Google Vision
 */
export function getGoogleVisionClient(): ImageAnnotatorClient | null {
  // Si le client existe déjà, le retourner
  if (visionClient) {
    return visionClient;
  }

  // Vérifier si les credentials sont disponibles
  const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (!credentials && !projectId) {
    console.warn("[google-vision] Google Cloud credentials not configured");
    return null;
  }

  try {
    // Si credentials est une string JSON, la parser
    let credentialsObj: any = undefined;
    if (credentials) {
      try {
        credentialsObj = JSON.parse(credentials);
      } catch {
        // Si ce n'est pas du JSON, c'est peut-être un chemin de fichier
        // On laisse le client gérer ça
      }
    }

    visionClient = new ImageAnnotatorClient({
      projectId: projectId || undefined,
      credentials: credentialsObj || undefined,
    });

    console.log("[google-vision] Client initialized successfully");
    return visionClient;
  } catch (error) {
    console.error("[google-vision] Error initializing client:", error);
    return null;
  }
}

/**
 * Extrait le texte d'une image en utilisant Google Vision OCR
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<string | null> {
  const client = getGoogleVisionClient();
  if (!client) {
    console.warn("[google-vision] Client not available");
    return null;
  }

  try {
    const [result] = await client.textDetection({
      image: {
        content: imageBuffer,
      },
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      console.log("[google-vision] No text detected in image");
      return null;
    }

    // Le premier élément contient tout le texte détecté
    const fullText = detections[0].description || "";
    console.log("[google-vision] Text extracted successfully, length:", fullText.length);
    
    return fullText.trim();
  } catch (error) {
    console.error("[google-vision] Error extracting text from image:", error);
    return null;
  }
}

/**
 * Extrait le texte d'un PDF en utilisant Google Vision OCR
 * Note: Google Vision nécessite l'API batch pour les PDFs
 * Pour l'instant, on utilise documentTextDetection qui peut traiter les PDFs
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<string | null> {
  const client = getGoogleVisionClient();
  if (!client) {
    console.warn("[google-vision] Client not available");
    return null;
  }

  try {
    // Pour les PDFs, utiliser documentTextDetection qui est optimisé pour les documents
    const [result] = await client.documentTextDetection({
      image: {
        content: pdfBuffer,
      },
    });

    const fullTextAnnotation = result.fullTextAnnotation;
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      console.log("[google-vision] No text detected in PDF");
      return null;
    }

    const fullText = fullTextAnnotation.text;
    console.log("[google-vision] Text extracted from PDF successfully, length:", fullText.length);
    
    return fullText.trim();
  } catch (error) {
    console.error("[google-vision] Error extracting text from PDF:", error);
    
    // Si documentTextDetection échoue, essayer avec textDetection (peut fonctionner pour certaines images PDF)
    try {
      console.log("[google-vision] Trying textDetection as fallback...");
      const [result] = await client.textDetection({
        image: {
          content: pdfBuffer,
        },
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return null;
      }

      const fullText = detections[0].description || "";
      if (fullText.trim().length > 0) {
        console.log("[google-vision] Text extracted using textDetection fallback, length:", fullText.length);
        return fullText.trim();
      }
    } catch (fallbackError) {
      console.error("[google-vision] Fallback also failed:", fallbackError);
    }
    
    return null;
  }
}

