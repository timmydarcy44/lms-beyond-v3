'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/url';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

interface InviteLearnerData {
  email: string;
  formationIds: string[];
  testIds: string[];
  resourceIds: string[];
  pathwayIds: string[];
}

export async function inviteLearnerWithAssignments(data: InviteLearnerData) {
  console.log('🔍 inviteLearnerWithAssignments: Starting invitation process', {
    email: data.email,
    formations: data.formationIds.length,
    tests: data.testIds.length,
    resources: data.resourceIds.length,
    pathways: data.pathwayIds.length
  });

  try {
    const admin = supabaseAdmin();
    const supabase = await supabaseServer();

    // 1. Récupérer l'utilisateur connecté (formateur/admin)
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    console.log(`🔍 inviteLearnerWithAssignments: Current user ${currentUser.email}`);

    // 2. Récupérer la dernière membership du formateur pour obtenir l'org
    const { data: instructorMembership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('org_id, organizations!inner(name, slug)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (membershipError || !instructorMembership) {
      throw new Error('Aucune organisation trouvée pour le formateur');
    }

    const orgId = instructorMembership.org_id;
    console.log(`🔍 inviteLearnerWithAssignments: Using org ${instructorMembership.organizations.name} (${orgId})`);

    // 3. Créer ou récupérer l'utilisateur apprenant
    let learnerUser;
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === data.email);

      if (existingUser) {
        learnerUser = existingUser;
        console.log(`🔍 inviteLearnerWithAssignments: User ${data.email} already exists`);
      } else {
        // Créer un nouvel utilisateur
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: data.email,
          email_confirm: true,
          user_metadata: {
            role: 'learner',
            invited_by: currentUser.id
          }
        });

        if (createError || !newUser.user) {
          throw new Error(`Erreur création utilisateur: ${createError?.message}`);
        }

        learnerUser = newUser.user;
        console.log(`🔍 inviteLearnerWithAssignments: Created new user ${data.email}`);
      }
    } catch (error) {
      console.error('🔍 inviteLearnerWithAssignments: Error with user creation:', error);
      throw new Error('Erreur lors de la création/récupération de l\'utilisateur');
    }

    // 4. Upsert org_memberships (idempotent)
    const { error: membershipUpsertError } = await supabase
      .from('org_memberships')
      .upsert({
        user_id: learnerUser.id,
        org_id: orgId,
        role: 'learner',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,org_id'
      });

    if (membershipUpsertError) {
      console.error('🔍 inviteLearnerWithAssignments: Error upserting membership:', membershipUpsertError);
      throw new Error('Erreur lors de l\'ajout à l\'organisation');
    }

    console.log(`🔍 inviteLearnerWithAssignments: Added user to org ${orgId}`);

    // 5. Lier formateur ↔ apprenant (idempotent)
    const { error: linkError } = await supabase
      .from('instructor_learners')
      .upsert({
        instructor_id: currentUser.id,
        learner_id: learnerUser.id,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'instructor_id,learner_id'
      });

    if (linkError) {
      console.error('🔍 inviteLearnerWithAssignments: Error linking instructor-learner:', linkError);
      // Non bloquant, on continue
    } else {
      console.log(`🔍 inviteLearnerWithAssignments: Linked instructor ${currentUser.id} to learner ${learnerUser.id}`);
    }

    // 6. Créer un parcours "Starter Pack" si des formations sont assignées
    let starterPackPathwayId = null;
    if (data.formationIds.length > 0) {
      const { data: pathway, error: pathwayError } = await supabase
        .from('pathways')
        .upsert({
          title: `Starter Pack — ${data.email}`,
          description: `Parcours d'introduction créé automatiquement pour ${data.email}`,
          org_id: orgId,
          created_by: currentUser.id,
          published: true
        }, {
          onConflict: 'title,org_id'
        })
        .select('id')
        .single();

      if (pathwayError) {
        console.error('🔍 inviteLearnerWithAssignments: Error creating starter pack:', pathwayError);
        // Non bloquant, on continue
      } else {
        starterPackPathwayId = pathway?.id;
        console.log(`🔍 inviteLearnerWithAssignments: Created starter pack pathway ${starterPackPathwayId}`);

        // Ajouter les formations au parcours
        if (starterPackPathwayId) {
          const pathwayItems = data.formationIds.map((formationId, index) => ({
            pathway_id: starterPackPathwayId,
            content_id: formationId,
            content_type: 'formation',
            position: index + 1,
            created_at: new Date().toISOString()
          }));

          const { error: itemsError } = await supabase
            .from('pathway_items')
            .upsert(pathwayItems, {
              onConflict: 'pathway_id,content_id,content_type'
            });

          if (itemsError) {
            console.error('🔍 inviteLearnerWithAssignments: Error adding formations to pathway:', itemsError);
          } else {
            console.log(`🔍 inviteLearnerWithAssignments: Added ${data.formationIds.length} formations to starter pack`);
          }
        }
      }
    }

    // 7. Assigner les contenus directement à l'apprenant
    const assignments = [];

    // Assignations de formations
    data.formationIds.forEach(formationId => {
      assignments.push({
        learner_id: learnerUser.id,
        content_id: formationId,
        content_type: 'formation',
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString()
      });
    });

    // Assignations de tests
    data.testIds.forEach(testId => {
      assignments.push({
        learner_id: learnerUser.id,
        content_id: testId,
        content_type: 'test',
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString()
      });
    });

    // Assignations de ressources
    data.resourceIds.forEach(resourceId => {
      assignments.push({
        learner_id: learnerUser.id,
        content_id: resourceId,
        content_type: 'resource',
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString()
      });
    });

    // Assignations de parcours
    data.pathwayIds.forEach(pathwayId => {
      assignments.push({
        learner_id: learnerUser.id,
        content_id: pathwayId,
        content_type: 'pathway',
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString()
      });
    });

    // Ajouter le starter pack s'il existe
    if (starterPackPathwayId) {
      assignments.push({
        learner_id: learnerUser.id,
        content_id: starterPackPathwayId,
        content_type: 'pathway',
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString()
      });
    }

    // Insérer toutes les assignations
    if (assignments.length > 0) {
      const { error: assignmentsError } = await supabase
        .from('learner_assignments')
        .upsert(assignments, {
          onConflict: 'learner_id,content_id,content_type'
        });

      if (assignmentsError) {
        console.error('🔍 inviteLearnerWithAssignments: Error creating assignments:', assignmentsError);
        throw new Error('Erreur lors de l\'assignation du contenu');
      }

      console.log(`🔍 inviteLearnerWithAssignments: Created ${assignments.length} assignments`);
    }

    // 8. Envoyer le magic link pour définir le mot de passe
    const redirectTo = await absoluteUrl('/create-password');
    
    const { error: magicLinkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: data.email,
      options: {
        redirectTo
      }
    });

    if (magicLinkError) {
      console.error('🔍 inviteLearnerWithAssignments: Error sending magic link:', magicLinkError);
      throw new Error('Erreur lors de l\'envoi du lien de réinitialisation');
    }

    console.log(`🔍 inviteLearnerWithAssignments: Sent magic link to ${data.email}`);

    // 9. Revalidation
    revalidatePath('/admin/utilisateurs');

    console.log('🔍 inviteLearnerWithAssignments: Invitation completed successfully');

    return { ok: true };

  } catch (error) {
    console.error('🔍 inviteLearnerWithAssignments: Error:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}