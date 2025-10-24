import { fetchJson, ApiResponse } from './http';

export interface ListItem {
  id: string;
  title: string;
}

export interface Learner {
  id: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
}

// GET /api/lists/formations?org={slug}
export async function getFormationsList(orgSlug: string): Promise<ApiResponse<ListItem[]>> {
  return fetchJson(`/api/lists/formations?org=${encodeURIComponent(orgSlug)}`);
}

// GET /api/lists/resources?org={slug}
export async function getResourcesList(orgSlug: string): Promise<ApiResponse<ListItem[]>> {
  return fetchJson(`/api/lists/resources?org=${encodeURIComponent(orgSlug)}`);
}

// GET /api/lists/tests?org={slug}
export async function getTestsList(orgSlug: string): Promise<ApiResponse<ListItem[]>> {
  return fetchJson(`/api/lists/tests?org=${encodeURIComponent(orgSlug)}`);
}

// GET /api/lists/learners?org={slug}
export async function getLearnersList(orgSlug: string): Promise<ApiResponse<Learner[]>> {
  return fetchJson(`/api/lists/learners?org=${encodeURIComponent(orgSlug)}`);
}

// GET /api/lists/groups?org={slug}
export async function getGroupsList(orgSlug: string): Promise<ApiResponse<Group[]>> {
  return fetchJson(`/api/lists/groups?org=${encodeURIComponent(orgSlug)}`);
}
