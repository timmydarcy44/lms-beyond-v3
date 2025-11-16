export function estimateAIUsageScore(htmlContent: string): number {
  if (!htmlContent) return 0;

  const text = htmlContent
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return 0;

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) return 0;
  
  // Pour les très courts textes (< 10 mots), retourner 0 sauf si vraiment suspect
  if (wordCount < 10) {
    // Vérifier seulement les phrases de transition très suspectes
    const highlySuspiciousPhrases = [
      "en conclusion",
      "dans cet article",
      "ce guide",
      "nous allons",
      "explorons",
      "plongeons",
      "il est important de",
      "il convient de",
      "il faut noter que",
      "il est essentiel de",
      "il est crucial de",
      "il est primordial de",
    ];
    const suspiciousCount = highlySuspiciousPhrases.reduce((count, phrase) => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return count + (text.match(regex) ? text.match(regex)!.length : 0);
    }, 0);
    
    // Si moins de 2 phrases suspectes, retourner 0
    if (suspiciousCount < 2) {
      return 0;
    }
  }

  const sentences = text
    .split(/[.!?]+/g)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const averageSentenceLength = wordCount / Math.max(sentences.length, 1);
  const totalCharacters = words.reduce((acc, word) => acc + word.length, 0);
  const averageWordLength = totalCharacters / wordCount;
  const uniqueWordRatio = new Set(words.map((w) => w.toLowerCase().replace(/[,;:()"]/g, ""))).size / wordCount;

  // Détection de structure organisée (listes, numérotation)
  const bulletMatches =
    (text.match(/\n?\s*[-•–]\s+/g) || []).length +
    (text.match(/\b(?:1\.|2\.|3\.|4\.|5\.|6\.|7\.|8\.|9\.|10\.)\s+/g) || []).length;

  // Phrases de transition typiques de ChatGPT et autres IA
  const transitionalPhrases = [
    "en conclusion",
    "dans cet article",
    "ce guide",
    "nous allons",
    "explorons",
    "plongeons",
    "cependant",
    "notamment",
    "globalement",
    "dans l'ensemble",
    "par conséquent",
    "afin de",
    "de plus",
    "il est important de",
    "il convient de",
    "il faut noter que",
    "il est essentiel de",
    "il est crucial de",
    "il est primordial de",
    "il est nécessaire de",
    "il est recommandé de",
    "il est conseillé de",
    "il est préférable de",
    "il est possible de",
    "il est intéressant de",
    "il est pertinent de",
    "il est utile de",
    "il est important de noter",
    "il convient également de",
    "il faut également",
    "il est également",
    "il s'agit de",
    "il s'agit également de",
    "cela permet de",
    "cela permet également de",
    "cela consiste à",
    "cela consiste également à",
    "cela implique",
    "cela implique également",
    "cela signifie",
    "cela signifie également",
    "en effet",
    "en outre",
    "par ailleurs",
    "de surcroît",
    "de même",
    "ainsi",
    "également",
    "toutefois",
    "néanmoins",
    "par contre",
    "en revanche",
    "d'une part",
    "d'autre part",
    "d'un côté",
    "de l'autre côté",
    "premièrement",
    "deuxièmement",
    "troisièmement",
    "en premier lieu",
    "en second lieu",
    "en dernier lieu",
    "pour commencer",
    "pour terminer",
    "pour finir",
    "en résumé",
    "pour résumer",
    "en somme",
    "finalement",
    "en définitive",
    "au final",
    "en fin de compte",
  ];

  const phraseMatches = transitionalPhrases.reduce(
    (count, phrase) => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    },
    0,
  );

  // Détection de markup (markdown, HTML structuré)
  const markupSignal = /(\*\*|__|##|###|####|```|<\/?(ul|ol|li|h[1-6]|p|div|section)>)/i.test(htmlContent) ? 1 : 0;
  
  // Détection de structure très organisée (titres, sections)
  const structuredContent = (htmlContent.match(/<h[1-6]|##|###|####/gi) || []).length;
  
  const punctuationDensity =
    text.replace(/[A-Za-z0-9\s]/g, "").length / Math.max(text.length, 1);

  // Scores normalisés (seuils encore plus stricts pour éviter les faux positifs)
  const sentenceScore = Math.min(1, averageSentenceLength / 30); // Seuil relevé à 30
  const wordLengthScore = Math.min(1, averageWordLength / 6.0); // Seuil relevé à 6.0
  const vocabularyScore = Math.min(1, uniqueWordRatio / 0.65); // Seuil relevé à 0.65
  const bulletScore = Math.min(1, bulletMatches / 8); // Seuil relevé à 8
  const phraseScore = Math.min(1, phraseMatches / 8); // Seuil relevé à 8 (au moins 8 phrases de transition)
  const volumeScore = Math.min(1, wordCount / 800); // Seuil relevé à 800
  const punctuationScore = Math.min(1, punctuationDensity / 0.10); // Seuil relevé à 0.10
  const structureScore = Math.min(1, structuredContent / 8); // Seuil relevé à 8

  // Score de base à 0 pour éviter les faux positifs
  let baseScore = 0;

  // Poids ajustés pour être plus stricts et éviter les faux positifs
  let weighted = baseScore +
    sentenceScore * 0.12 +
    wordLengthScore * 0.10 +
    vocabularyScore * 0.12 +
    bulletScore * 0.08 +
    phraseScore * 0.20 + // Poids élevé car très indicateur d'IA
    volumeScore * 0.06 +
    punctuationScore * 0.04 +
    structureScore * 0.05;

  // Bonus pour markup (seulement si vraiment structuré)
  if (markupSignal && structuredContent >= 3) {
    weighted += 0.05;
  }

  // Bonus pour texte long et bien structuré (seuils encore plus relevés)
  if (wordCount >= 100 && averageSentenceLength >= 25 && uniqueWordRatio >= 0.60 && phraseMatches >= 8) {
    weighted += 0.10;
  }

  // Bonus supplémentaire pour texte très long (>1000 mots) et bien structuré
  if (wordCount >= 1000 && averageSentenceLength >= 22 && uniqueWordRatio >= 0.55 && phraseMatches >= 12) {
    weighted += 0.12;
  }

  // Bonus pour beaucoup de phrases de transition (indicateur fort d'IA) - seuils encore plus relevés
  if (phraseMatches >= 8) {
    weighted += 0.08;
  }
  if (phraseMatches >= 15) {
    weighted += 0.10;
  }
  if (phraseMatches >= 20) {
    weighted += 0.08; // Bonus supplémentaire
  }

  // Bonus pour structure très organisée (titres + listes) - seuils relevés
  if (structuredContent >= 5 && bulletMatches >= 5) {
    weighted += 0.08;
  }

  // Bonus pour vocabulaire très riche
  if (uniqueWordRatio >= 0.65) {
    weighted += 0.06;
  }

  // Bonus pour texte avec beaucoup de mots (seulement si vraiment long)
  if (wordCount >= 500 && phraseMatches >= 3) {
    weighted += 0.03;
  }
  if (wordCount >= 800 && phraseMatches >= 5) {
    weighted += 0.04;
  }

  const score = Math.round(Math.max(0, Math.min(weighted, 1)) * 100);
  return score;
}

