/**
 * Données espace tuteur : logique serveur dans `@/lib/tuteur/workspace-server`
 * et exposition API `/api/tuteur/workspace`.
 */

export type {
  TutorAssignmentDetail,
  TutorPendingMission,
  TutorTodoPreview,
  TutorWorkspaceAssignment,
  TutorWorkspacePayload,
} from "@/lib/tuteur/workspace-server";

export { buildTutorWorkspace, loadTutorAssignmentDetail } from "@/lib/tuteur/workspace-server";
