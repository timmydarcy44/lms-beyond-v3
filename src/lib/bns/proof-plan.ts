export type ProofPlanContent = {
  id: string;
  title: string;
  description?: string | null;
  content_type?: string | null;
  content_id?: string | null;
  node_type?: string | null;
  resource_url?: string | null;
  resource_mime?: string | null;
};

export type ProofPlanStep = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  contents: ProofPlanContent[];
};

export type ProofPlanSnapshot = {
  proofId: string;
  proofTitle: string;
  recognitionGoal?: string | null;
  finalDeliverable?: string | null;
  steps: ProofPlanStep[];
  generatedAt: string;
};

export type ProofPlaylistItem = {
  stepId: string;
  contentId: string | null;
  contentType: string | null;
  title: string;
  description?: string | null;
};

export const proofPlanToPlaylist = (snapshot: ProofPlanSnapshot): ProofPlaylistItem[] => {
  return snapshot.steps.flatMap((step) =>
    step.contents.map((content) => ({
      stepId: step.id,
      contentId: content.content_id ?? null,
      contentType: content.content_type ?? null,
      title: content.title,
      description: content.description ?? null,
    })),
  );
};

