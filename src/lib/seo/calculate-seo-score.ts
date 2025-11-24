/**
 * Calcule le score SEO d'un article de blog
 */

interface SEOData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  coverImageAlt: string;
}

export function calculateSEOScore(data: SEOData): number {
  let score = 0;
  const maxScore = 100;
  const weights = {
    metaTitle: 20,
    metaDescription: 20,
    title: 15,
    contentLength: 15,
    contentStructure: 10,
    coverImage: 10,
    imageAlt: 10,
  };

  // 1. Meta Title (20 points)
  const metaTitle = data.metaTitle || data.title || "";
  if (metaTitle.length >= 50 && metaTitle.length <= 60) {
    score += weights.metaTitle; // Parfait
  } else if (metaTitle.length >= 40 && metaTitle.length <= 70) {
    score += weights.metaTitle * 0.7; // Acceptable
  } else if (metaTitle.length > 0 && metaTitle.length < 40) {
    score += weights.metaTitle * 0.4; // Trop court
  } else if (metaTitle.length > 70) {
    score += weights.metaTitle * 0.5; // Trop long
  }

  // 2. Meta Description (20 points)
  const metaDescription = data.metaDescription || data.excerpt || "";
  if (metaDescription.length >= 150 && metaDescription.length <= 160) {
    score += weights.metaDescription; // Parfait
  } else if (metaDescription.length >= 120 && metaDescription.length <= 180) {
    score += weights.metaDescription * 0.7; // Acceptable
  } else if (metaDescription.length > 0 && metaDescription.length < 120) {
    score += weights.metaDescription * 0.4; // Trop court
  } else if (metaDescription.length > 180) {
    score += weights.metaDescription * 0.5; // Trop long
  }

  // 3. Title (15 points)
  const title = data.title || "";
  if (title.length >= 30 && title.length <= 70) {
    score += weights.title; // Bon
  } else if (title.length > 0) {
    score += weights.title * 0.6; // Présent mais pas optimal
  }

  // 4. Longueur du contenu (15 points)
  const textContent = data.content.replace(/<[^>]*>/g, "").trim();
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount >= 1000) {
    score += weights.contentLength; // Excellent (1000+ mots)
  } else if (wordCount >= 500) {
    score += weights.contentLength * 0.8; // Bon (500-999 mots)
  } else if (wordCount >= 300) {
    score += weights.contentLength * 0.6; // Acceptable (300-499 mots)
  } else if (wordCount >= 100) {
    score += weights.contentLength * 0.3; // Trop court (100-299 mots)
  }

  // 5. Structure du contenu (10 points)
  const hasH1 = /<h1[^>]*>.*?<\/h1>/i.test(data.content);
  const h2Count = (data.content.match(/<h2[^>]*>/gi) || []).length;
  const hasParagraphs = /<p[^>]*>.*?<\/p>/i.test(data.content);
  
  let structureScore = 0;
  if (hasH1) structureScore += 2;
  if (h2Count >= 2) structureScore += 4; // Au moins 2 H2
  else if (h2Count === 1) structureScore += 2;
  if (hasParagraphs) structureScore += 4;
  
  score += (structureScore / 10) * weights.contentStructure;

  // 6. Image de couverture (10 points)
  if (data.coverImageUrl && data.coverImageUrl.trim().length > 0) {
    score += weights.coverImage;
  }

  // 7. Balise Alt de l'image (10 points)
  if (data.coverImageAlt && data.coverImageAlt.trim().length > 0) {
    if (data.coverImageAlt.length >= 10 && data.coverImageAlt.length <= 125) {
      score += weights.imageAlt; // Parfait
    } else if (data.coverImageAlt.length > 0) {
      score += weights.imageAlt * 0.6; // Présent mais pas optimal
    }
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function getSEORecommendations(data: SEOData): string[] {
  const recommendations: string[] = [];
  const metaTitle = data.metaTitle || data.title || "";
  const metaDescription = data.metaDescription || data.excerpt || "";
  const textContent = data.content.replace(/<[^>]*>/g, "").trim();
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

  if (metaTitle.length < 50 || metaTitle.length > 60) {
    recommendations.push(`Meta Title: ${metaTitle.length < 50 ? "Trop court" : "Trop long"} (idéal: 50-60 caractères, actuel: ${metaTitle.length})`);
  }

  if (metaDescription.length < 150 || metaDescription.length > 160) {
    recommendations.push(`Meta Description: ${metaDescription.length < 150 ? "Trop court" : "Trop long"} (idéal: 150-160 caractères, actuel: ${metaDescription.length})`);
  }

  if (!data.title || data.title.trim().length === 0) {
    recommendations.push("Titre: Le titre est requis");
  }

  if (wordCount < 300) {
    recommendations.push(`Contenu: Trop court (minimum recommandé: 300 mots, actuel: ${wordCount})`);
  }

  if (!data.coverImageUrl || data.coverImageUrl.trim().length === 0) {
    recommendations.push("Image de couverture: Ajoutez une image de couverture pour améliorer le SEO");
  }

  if (!data.coverImageAlt || data.coverImageAlt.trim().length === 0) {
    recommendations.push("Balise Alt: Ajoutez une description alternative pour l'image de couverture");
  }

  const hasH1 = /<h1[^>]*>.*?<\/h1>/i.test(data.content);
  const h2Count = (data.content.match(/<h2[^>]*>/gi) || []).length;

  if (!hasH1) {
    recommendations.push("Structure: Ajoutez un titre H1 dans le contenu");
  }

  if (h2Count < 2) {
    recommendations.push("Structure: Ajoutez au moins 2 sous-titres H2 pour structurer votre contenu");
  }

  return recommendations;
}

