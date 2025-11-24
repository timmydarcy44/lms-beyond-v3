/**
 * Calcule la durée estimée d'un test en fonction du nombre et du type de questions
 */
export function calculateTestDuration(questions: any[]): number {
  if (!questions || questions.length === 0) {
    return 0; // Pas de questions = 0 minute
  }

  let totalSeconds = 0;

  questions.forEach((question) => {
    const type = question.type || question.question_type;
    const optionsCount = question.options?.length || 0;

    // Durée de base selon le type de question
    let baseSeconds = 30; // 30 secondes par défaut

    switch (type) {
      case "single":
      case "multiple_choice":
        // Questions à choix multiples : 30-60 secondes selon le nombre d'options
        baseSeconds = 30 + (optionsCount * 5);
        break;

      case "multiple":
      case "checkbox":
        // Questions à choix multiples (plusieurs réponses) : 45-90 secondes
        baseSeconds = 45 + (optionsCount * 7);
        break;

      case "open":
      case "text":
        // Questions ouvertes : 60-180 secondes selon la longueur attendue
        const expectedLength = question.expected_length || "medium";
        if (expectedLength === "short") baseSeconds = 60;
        else if (expectedLength === "long") baseSeconds = 180;
        else baseSeconds = 120;
        break;

      case "scale":
      case "likert":
        // Échelles de Likert : 20-40 secondes
        baseSeconds = 20 + (optionsCount * 3);
        break;

      default:
        baseSeconds = 30;
    }

    // Ajouter du temps pour lire la question (10-20 secondes selon la longueur)
    const questionText = question.text || question.question || "";
    const readingTime = Math.min(20, Math.max(10, questionText.length / 50));
    baseSeconds += readingTime;

    totalSeconds += baseSeconds;
  });

  // Convertir en minutes et arrondir à la minute supérieure
  const minutes = Math.ceil(totalSeconds / 60);
  
  // Minimum 1 minute, maximum 120 minutes (2 heures)
  return Math.min(120, Math.max(1, minutes));
}

/**
 * Formate la durée en format lisible (ex: "15 min", "1h 30min")
 */
export function formatTestDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}









