import { NextResponse } from "next/server";

/**
 * Route de test pour vérifier si les variables d'environnement sont bien chargées
 * NE PAS UTILISER EN PRODUCTION - À SUPPRIMER APRÈS DEBUG
 */
export async function GET() {
  // Vérifier directement les variables d'environnement
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Ne pas exposer les clés complètes, juste les premiers caractères
  const openaiPreview = openaiKey 
    ? `${openaiKey.substring(0, 7)}...${openaiKey.substring(openaiKey.length - 4)}` 
    : "NON DÉFINIE";
  
  const anthropicPreview = anthropicKey 
    ? `${anthropicKey.substring(0, 7)}...${anthropicKey.substring(anthropicKey.length - 4)}` 
    : "NON DÉFINIE";

  return NextResponse.json({
    openai: {
      exists: !!openaiKey,
      length: openaiKey?.length || 0,
      preview: openaiPreview,
      startsWith: openaiKey?.startsWith("sk-") || false,
    },
    anthropic: {
      exists: !!anthropicKey,
      length: anthropicKey?.length || 0,
      preview: anthropicPreview,
      startsWith: anthropicKey?.startsWith("sk-ant-") || false,
    },
    allEnvKeys: Object.keys(process.env)
      .filter(key => key.includes("OPENAI") || key.includes("ANTHROPIC"))
      .map(key => ({ key, exists: true })),
  });
}



