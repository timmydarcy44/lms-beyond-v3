import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client unavailable" }, { status: 500 });
    }

    // Vérifier l'authentification
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructorId = authData.user.id;

    // Récupérer les données du formulaire
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const expectations = formData.get("expectations") as string;
    const dueDate = formData.get("dueDate") as string;
    const groupIdsJson = formData.get("groupIds") as string;
    const learnerIdsJson = formData.get("learnerIds") as string;
    const file = formData.get("file") as File | null;

    if (!title || !expectations || !dueDate) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const groupIds: string[] = groupIdsJson ? JSON.parse(groupIdsJson) : [];
    const learnerIds: string[] = learnerIdsJson ? JSON.parse(learnerIdsJson) : [];

    if (groupIds.length === 0 && learnerIds.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire sélectionné" }, { status: 400 });
    }

    // Récupérer tous les apprenants destinataires (individuels + membres des groupes)
    const recipientIds = new Set<string>(learnerIds);

    // Ajouter les membres des groupes
    if (groupIds.length > 0) {
      const { data: groupMembers, error: groupError } = await supabase
        .from("group_members")
        .select("user_id")
        .in("group_id", groupIds);

      if (!groupError && groupMembers) {
        groupMembers.forEach((member) => {
          recipientIds.add(member.user_id);
        });
      }
    }

    const allRecipientIds = Array.from(recipientIds);

    if (allRecipientIds.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire valide" }, { status: 400 });
    }

    // Upload du fichier si présent
    let fileUrl: string | null = null;
    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("consignes")
        .upload(fileName, file, {
          contentType: file.type,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from("consignes")
          .getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }
    }

    // Créer le message dans la table messages
    // Note: La table messages utilise subject/body OU content selon la structure
    const messageContent = `📋 **${title}**\n\n${expectations}\n\n📅 **Date limite:** ${new Date(dueDate).toLocaleDateString("fr-FR")}${fileUrl ? `\n\n📎 [Télécharger la ressource](${fileUrl})` : ""}`;

    console.log("[consigne] Creating message for instructor:", instructorId);
    console.log("[consigne] Message content length:", messageContent.length);
    console.log("[consigne] Recipients count:", allRecipientIds.length);
    
    // Essayer d'abord avec content (nouvelle structure)
    let messageData: any = {
      sender_id: instructorId,
      type: "consigne",
      metadata: {
        title,
        dueDate,
        fileUrl,
        groupIds,
        learnerIds,
      },
    };
    
    // Essayer content d'abord, sinon subject/body
    messageData.content = messageContent;
    messageData.subject = title;
    messageData.body = messageContent;
    
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert(messageData)
      .select("id")
      .single();

    if (messageError || !message) {
      console.error("[consigne] Error creating message:", messageError);
      console.error("[consigne] Message error code:", messageError?.code);
      console.error("[consigne] Message error message:", messageError?.message);
      console.error("[consigne] Message error details:", JSON.stringify(messageError, null, 2));
      // Si la table messages n'existe pas, créer le message dans notifications (fallback)
      // La table notifications utilise recipient_id et payload (JSONB)
      const notificationData = allRecipientIds.map((recipientId) => {
        const data: any = {
          recipient_id: recipientId,
          type: "consigne",
          payload: {
            title: `Nouvelle consigne: ${title}`,
            message: messageContent,
            dueDate,
            fileUrl,
            groupIds,
            learnerIds,
          },
        };
        // Ajouter user_id seulement si la colonne existe (ne pas échouer si elle n'existe pas)
        return data;
      });
      
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notificationData);

      if (notifError) {
        console.error("[consigne] Error creating notifications:", notifError);
        console.error("[consigne] Notification error code:", notifError.code);
        console.error("[consigne] Notification error message:", notifError.message);
        // Retourner quand même un succès partiel si le message principal a été créé
        return NextResponse.json(
          { 
            error: "Erreur lors de la création des notifications",
            details: notifError.message,
            partialSuccess: true 
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, recipientsCount: allRecipientIds.length });
    }

    // Créer les destinataires du message
    const { error: recipientsError } = await supabase
      .from("message_recipients")
      .insert(
        allRecipientIds.map((recipientId) => ({
          message_id: message.id,
          recipient_id: recipientId,
          read: false,
        }))
      );

    if (recipientsError) {
      console.error("[consigne] Error creating recipients:", recipientsError);
      // Si message_recipients n'existe pas, utiliser notifications
      const notificationData = allRecipientIds.map((recipientId) => ({
        recipient_id: recipientId,
        type: "consigne",
        payload: {
          title: `Nouvelle consigne: ${title}`,
          message: messageContent,
          dueDate,
          fileUrl,
          groupIds,
          learnerIds,
        },
      }));
      
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notificationData);

      if (notifError) {
        return NextResponse.json(
          { error: "Erreur lors de la création des notifications" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      messageId: message.id,
      recipientsCount: allRecipientIds.length,
    });
  } catch (error) {
    console.error("[consigne] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

