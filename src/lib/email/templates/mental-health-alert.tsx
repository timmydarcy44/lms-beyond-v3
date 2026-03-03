/**
 * Template d'email pour les alertes de santé mentale
 * Retourne le HTML de l'email
 */

export function MentalHealthAlertEmailTemplate({
  learnerName,
  learnerEmail,
  score,
  level,
  message,
  coachName,
}: {
  learnerName: string;
  learnerEmail: string;
  score: number;
  level: string;
  message: string;
  coachName?: string;
}) {
  const getLevelColor = () => {
    switch (level.toLowerCase()) {
      case "préoccupant":
      case "poor":
        return "#f97316"; // Orange
      case "critique":
      case "critical":
        return "#ef4444"; // Red
      default:
        return "#3b82f6"; // Blue
    }
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte Santé Mentale</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Alerte Santé Mentale</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Bonjour ${coachName ? coachName : "Coach"},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Une alerte de santé mentale a été générée pour l'un de vos apprenants.
    </p>
    
    <div style="background: white; border-left: 4px solid ${getLevelColor()}; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Informations de l'apprenant</h2>
      <p style="margin: 10px 0;"><strong>Nom :</strong> ${learnerName}</p>
      <p style="margin: 10px 0;"><strong>Email :</strong> ${learnerEmail}</p>
      <p style="margin: 10px 0;"><strong>Score :</strong> <span style="color: ${getLevelColor()}; font-weight: bold;">${score.toFixed(1)}%</span></p>
      <p style="margin: 10px 0;"><strong>Niveau :</strong> <span style="color: ${getLevelColor()}; font-weight: bold;">${level}</span></p>
    </div>
    
    ${message ? `
    <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>Message :</strong> ${message}</p>
    </div>
    ` : ''}
    
    <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af;">
        <strong>Action recommandée :</strong> Veuillez prendre contact avec cet apprenant pour discuter de sa situation et lui apporter le soutien nécessaire.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Cette notification a été générée automatiquement par le système Beyond LMS.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
      Vous pouvez également consulter les détails dans votre tableau de bord : 
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://beyond-lms.com"}/dashboard/formateur/sante-mentale" style="color: #3b82f6; text-decoration: none;">Tableau de bord</a>
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

