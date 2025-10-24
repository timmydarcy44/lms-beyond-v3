import { fetchJson, ApiResponse } from './http';

export interface Formation {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  visibility_mode: 'private' | 'org' | 'public';
  created_at: string;
  updated_at: string;
  sections?: FormationSection[];
}

export interface FormationSection {
  id: string;
  title: string;
  order_index: number;
  chapters?: FormationChapter[];
}

export interface FormationChapter {
  id: string;
  title: string;
  order_index: number;
}

export interface CreateFormationInput {
  title: string;
  description?: string;
  cover_url?: string;
  visibility_mode?: 'private' | 'org' | 'public';
}

export interface UpdateFormationInput {
  title?: string;
  description?: string;
  cover_url?: string;
  visibility_mode?: 'private' | 'org' | 'public';
}

// GET /api/formations?org={slug}
export async function getFormations(orgSlug: string): Promise<ApiResponse<Formation[]>> {
  return fetchJson(`/api/formations?org=${encodeURIComponent(orgSlug)}`);
}

// POST /api/formations?org={slug}
export async function createFormation(
  orgSlug: string,
  input: CreateFormationInput
): Promise<ApiResponse<{ id: string }>> {
  return fetchJson(`/api/formations?org=${encodeURIComponent(orgSlug)}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// GET /api/formations/[id]
export async function getFormation(id: string): Promise<ApiResponse<Formation>> {
  return fetchJson(`/api/formations/${id}`);
}

// PUT /api/formations/[id]
export async function updateFormation(
  id: string,
  input: UpdateFormationInput
): Promise<ApiResponse<boolean>> {
  return fetchJson(`/api/formations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// DELETE /api/formations/[id]
export async function deleteFormation(id: string): Promise<ApiResponse<boolean>> {
  return fetchJson(`/api/formations/${id}`, {
    method: 'DELETE',
  });
}
