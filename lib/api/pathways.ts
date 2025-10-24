import { fetchJson, ApiResponse } from './http';

export interface Pathway {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  reading_mode: 'linear' | 'free';
  created_at: string;
  updated_at: string;
  pathway_items?: PathwayItem[];
  pathway_assignments?: PathwayAssignment[];
}

export interface PathwayItem {
  id: string;
  pathway_id: string;
  item_type: 'formation' | 'test' | 'resource';
  item_id: string;
  position: number;
}

export interface PathwayAssignment {
  id: string;
  pathway_id: string;
  learner_id?: string;
  group_id?: string;
}

export interface CreatePathwayInput {
  title: string;
  description?: string;
  cover_url?: string;
  reading_mode?: 'linear' | 'free';
}

export interface UpdatePathwayInput {
  title?: string;
  description?: string;
  cover_url?: string;
  reading_mode?: 'linear' | 'free';
}

export interface PathwayItemsInput {
  items: Array<{
    type: 'formation' | 'test' | 'resource';
    id: string;
    position: number;
  }>;
}

export interface PathwayAssignmentsInput {
  learners?: string[];
  groups?: string[];
}

// GET /api/parcours?org={slug}
export async function getPathways(orgSlug: string): Promise<ApiResponse<Pathway[]>> {
  return fetchJson(`/api/parcours?org=${encodeURIComponent(orgSlug)}`);
}

// POST /api/parcours?org={slug}
export async function createPathway(
  orgSlug: string,
  input: CreatePathwayInput
): Promise<ApiResponse<{ id: string }>> {
  return fetchJson(`/api/parcours?org=${encodeURIComponent(orgSlug)}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// GET /api/parcours/[id]
export async function getPathway(id: string): Promise<ApiResponse<Pathway>> {
  return fetchJson(`/api/parcours/${id}`);
}

// PUT /api/parcours/[id]
export async function updatePathway(
  id: string,
  input: UpdatePathwayInput
): Promise<ApiResponse<boolean>> {
  return fetchJson(`/api/parcours/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// DELETE /api/parcours/[id]
export async function deletePathway(id: string): Promise<ApiResponse<boolean>> {
  return fetchJson(`/api/parcours/${id}`, {
    method: 'DELETE',
  });
}

// POST /api/parcours/[id]/items
export async function updatePathwayItems(
  id: string,
  input: PathwayItemsInput
): Promise<ApiResponse<boolean>> {
  return fetchJson(`/api/parcours/${id}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// POST /api/parcours/[id]/assignments
export async function updatePathwayAssignments(
  id: string,
  input: PathwayAssignmentsInput
): Promise<ApiResponse<boolean>> {
  return fetchJson(`/api/parcours/${id}/assignments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
