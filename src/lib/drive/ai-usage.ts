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

  // Phrases de transition typiques de ChatGPT et autres IA (liste étendue)
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
    // Phrases supplémentaires très typiques de GPT
    "il est à noter que",
    "il est à souligner que",
    "il est à rappeler que",
    "il est à mentionner que",
    "il est à préciser que",
    "il est à retenir que",
    "il est à observer que",
    "il est à constater que",
    "il est à remarquer que",
    "il est à signaler que",
    "il est à indiquer que",
    "il est à ajouter que",
    "il est à compléter que",
    "il est à développer que",
    "il est à approfondir que",
    "il est à explorer que",
    "il est à analyser que",
    "il est à examiner que",
    "il est à considérer que",
    "il est à prendre en compte que",
    "il est à tenir compte que",
    "il est à garder à l'esprit que",
    "il est à noter également que",
    "il est à souligner également que",
    "il est à rappeler également que",
    "il est à mentionner également que",
    "il est à préciser également que",
    "il est à retenir également que",
    "il est à observer également que",
    "il est à constater également que",
    "il est à remarquer également que",
    "il est à signaler également que",
    "il est à indiquer également que",
    "il est à ajouter également que",
    "il est à compléter également que",
    "il est à développer également que",
    "il est à approfondir également que",
    "il est à explorer également que",
    "il est à analyser également que",
    "il est à examiner également que",
    "il est à considérer également que",
    "il est à prendre en compte également que",
    "il est à tenir compte également que",
    "il est à garder à l'esprit également que",
    "pour conclure",
    "pour terminer",
    "pour finir",
    "en guise de conclusion",
    "en guise de synthèse",
    "en guise de résumé",
    "pour synthétiser",
    "pour récapituler",
    "pour faire le point",
    "pour faire un point",
    "pour faire le bilan",
    "pour faire un bilan",
    "pour faire le tour",
    "pour faire un tour",
    "pour faire le point sur",
    "pour faire un point sur",
    "pour faire le bilan de",
    "pour faire un bilan de",
    "pour faire le tour de",
    "pour faire un tour de",
    "pour faire le point sur la",
    "pour faire un point sur la",
    "pour faire le bilan de la",
    "pour faire un bilan de la",
    "pour faire le tour de la",
    "pour faire un tour de la",
    "pour faire le point sur le",
    "pour faire un point sur le",
    "pour faire le bilan du",
    "pour faire un bilan du",
    "pour faire le tour du",
    "pour faire un tour du",
    "pour faire le point sur les",
    "pour faire un point sur les",
    "pour faire le bilan des",
    "pour faire un bilan des",
    "pour faire le tour des",
    "pour faire un tour des",
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

  // Détection de patterns très spécifiques à GPT (formules répétitives)
  const gptPatterns = [
    /\b(il est à noter|il est à souligner|il est à rappeler|il est à mentionner|il est à préciser|il est à retenir|il est à observer|il est à constater|il est à remarquer|il est à signaler|il est à indiquer|il est à ajouter|il est à compléter|il est à développer|il est à approfondir|il est à explorer|il est à analyser|il est à examiner|il est à considérer|il est à prendre en compte|il est à tenir compte|il est à garder à l'esprit)\b/gi,
    /\b(pour conclure|pour terminer|pour finir|en guise de conclusion|en guise de synthèse|en guise de résumé|pour synthétiser|pour récapituler|pour faire le point|pour faire un point|pour faire le bilan|pour faire un bilan)\b/gi,
    /\b(en tant que|en qualité de|dans le cadre de|dans le contexte de|dans le but de|dans l'objectif de|dans la perspective de|dans l'optique de)\b/gi,
  ];
  const gptPatternMatches = gptPatterns.reduce((count, pattern) => {
    const matches = text.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);

  // Détection de répétitions de structures (très typique de GPT)
  const repetitiveStructures = [
    /(il est|il s'agit|cela permet|cela consiste|cela implique|cela signifie)\s+(de|à|également de|également à)/gi,
  ];
  const repetitiveMatches = repetitiveStructures.reduce((count, pattern) => {
    const matches = text.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);

  // Scores normalisés (seuils ajustés pour être plus sensibles aux textes GPT)
  const sentenceScore = Math.min(1, averageSentenceLength / 25); // Seuil réduit à 25
  const wordLengthScore = Math.min(1, averageWordLength / 5.5); // Seuil réduit à 5.5
  const vocabularyScore = Math.min(1, uniqueWordRatio / 0.60); // Seuil réduit à 0.60
  const bulletScore = Math.min(1, bulletMatches / 5); // Seuil réduit à 5
  const phraseScore = Math.min(1, phraseMatches / 5); // Seuil réduit à 5 (plus sensible)
  const volumeScore = Math.min(1, wordCount / 500); // Seuil réduit à 500
  const punctuationScore = Math.min(1, punctuationDensity / 0.08); // Seuil réduit à 0.08
  const structureScore = Math.min(1, structuredContent / 5); // Seuil réduit à 5
  const gptPatternScore = Math.min(1, gptPatternMatches / 3); // Nouveau score pour patterns GPT
  const repetitiveScore = Math.min(1, repetitiveMatches / 5); // Nouveau score pour répétitions

  // Score de base à 0 pour éviter les faux positifs
  let baseScore = 0;

  // Poids ajustés pour être plus sensibles aux textes GPT
  let weighted = baseScore +
    sentenceScore * 0.10 +
    wordLengthScore * 0.08 +
    vocabularyScore * 0.10 +
    bulletScore * 0.06 +
    phraseScore * 0.25 + // Poids augmenté car très indicateur d'IA
    volumeScore * 0.05 +
    punctuationScore * 0.03 +
    structureScore * 0.04 +
    gptPatternScore * 0.15 + // Nouveau poids important pour patterns GPT
    repetitiveScore * 0.14; // Nouveau poids important pour répétitions

  // Bonus pour markup (seulement si vraiment structuré)
  if (markupSignal && structuredContent >= 3) {
    weighted += 0.05;
  }

  // Bonus pour texte long et bien structuré (seuils réduits pour être plus sensible)
  if (wordCount >= 100 && averageSentenceLength >= 20 && uniqueWordRatio >= 0.55 && phraseMatches >= 5) {
    weighted += 0.12;
  }

  // Bonus supplémentaire pour texte très long (>1000 mots) et bien structuré
  if (wordCount >= 1000 && averageSentenceLength >= 18 && uniqueWordRatio >= 0.50 && phraseMatches >= 8) {
    weighted += 0.15;
  }

  // Bonus pour beaucoup de phrases de transition (indicateur fort d'IA) - seuils réduits
  if (phraseMatches >= 5) {
    weighted += 0.10;
  }
  if (phraseMatches >= 10) {
    weighted += 0.12;
  }
  if (phraseMatches >= 15) {
    weighted += 0.10; // Bonus supplémentaire
  }
  if (phraseMatches >= 20) {
    weighted += 0.08; // Bonus encore plus important
  }

  // Bonus important pour patterns GPT spécifiques
  if (gptPatternMatches >= 3) {
    weighted += 0.15;
  }
  if (gptPatternMatches >= 5) {
    weighted += 0.10;
  }
  if (gptPatternMatches >= 8) {
    weighted += 0.10;
  }

  // Bonus pour répétitions de structures (très typique de GPT)
  if (repetitiveMatches >= 5) {
    weighted += 0.12;
  }
  if (repetitiveMatches >= 10) {
    weighted += 0.10;
  }
  if (repetitiveMatches >= 15) {
    weighted += 0.08;
  }

  // Bonus pour structure très organisée (titres + listes) - seuils réduits
  if (structuredContent >= 3 && bulletMatches >= 3) {
    weighted += 0.10;
  }
  if (structuredContent >= 5 && bulletMatches >= 5) {
    weighted += 0.08;
  }

  // Bonus pour vocabulaire très riche
  if (uniqueWordRatio >= 0.60) {
    weighted += 0.08;
  }
  if (uniqueWordRatio >= 0.65) {
    weighted += 0.06;
  }

  // Bonus pour texte avec beaucoup de mots (seuils réduits)
  if (wordCount >= 300 && phraseMatches >= 2) {
    weighted += 0.05;
  }
  if (wordCount >= 500 && phraseMatches >= 3) {
    weighted += 0.05;
  }
  if (wordCount >= 800 && phraseMatches >= 5) {
    weighted += 0.06;
  }

  // Bonus combiné : si plusieurs indicateurs sont présents simultanément (très typique de GPT)
  const strongIndicators = [
    phraseMatches >= 5,
    gptPatternMatches >= 3,
    repetitiveMatches >= 5,
    structuredContent >= 3,
    averageSentenceLength >= 20,
    uniqueWordRatio >= 0.55,
  ];
  const strongIndicatorCount = strongIndicators.filter(Boolean).length;
  
  if (strongIndicatorCount >= 4) {
    weighted += 0.15; // Bonus important si 4+ indicateurs forts
  }
  if (strongIndicatorCount >= 5) {
    weighted += 0.10; // Bonus supplémentaire si 5+ indicateurs forts
  }
  if (strongIndicatorCount >= 6) {
    weighted += 0.10; // Bonus maximum si tous les indicateurs sont présents
  }

  // S'assurer que le score ne dépasse pas 100%
  const score = Math.round(Math.max(0, Math.min(weighted, 1)) * 100);
  return score;
}

