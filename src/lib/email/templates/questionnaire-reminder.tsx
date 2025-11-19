/**
 * Template d'email pour rappeler aux apprenants de répondre au questionnaire
 */

export function QuestionnaireReminderEmailTemplate({
  learnerName,
  questionnaireTitle,
  questionnaireUrl,
}: {
  learnerName: string;
  questionnaireTitle: string;
  questionnaireUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Questionnaire de santé mentale</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Questionnaire de santé mentale</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Bonjour ${learnerName},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Il est temps de remplir votre questionnaire de santé mentale hebdomadaire.
    </p>
    
    <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">${questionnaireTitle}</h2>
      <p style="color: #6b7280; margin-bottom: 20px;">
        Ce questionnaire vous prendra environ 5 minutes et nous aidera à mieux vous accompagner.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${questionnaireUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Répondre au questionnaire
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Vos réponses sont confidentielles et nous aident à améliorer votre bien-être.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
      Si vous avez des questions, n'hésitez pas à contacter votre coach ou responsable.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af;">
      Beyond LMS - Système de gestion de l'apprentissage
    </p>
  </div>
</body>
</html>
  `.trim();
}




