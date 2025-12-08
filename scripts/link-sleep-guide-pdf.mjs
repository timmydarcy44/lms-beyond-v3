/**
 * Script pour lier automatiquement le PDF au guide du sommeil
 * Usage: node scripts/link-sleep-guide-pdf.mjs
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

async function linkSleepGuidePdf() {
  try {
    console.log("🔍 Recherche du PDF pour le guide du sommeil...");
    
    const response = await fetch(`${API_URL}/api/admin/link-sleep-guide-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur:", data);
      process.exit(1);
    }

    console.log("✅ Succès:", data);
    console.log("\n📄 PDF lié:", data.pdf?.url);
    console.log("📚 Ressource:", data.resource?.title);
  } catch (error) {
    console.error("❌ Erreur lors de l'appel API:", error);
    process.exit(1);
  }
}

linkSleepGuidePdf();

