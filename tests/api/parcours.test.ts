import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock Supabase pour les tests
const mockSupabase = {
  auth: {
    getUser: () => Promise.resolve({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null,
    }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({
          data: { id: 'test-org', slug: 'test-org' },
          error: null,
        }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { id: 'test-pathway' },
          error: null,
        }),
      }),
    }),
  }),
};

// Mock du module Supabase
vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: () => Promise.resolve(mockSupabase),
}));

// Mock du module auth
vi.mock('@/lib/server/auth', () => ({
  requireUser: () => Promise.resolve({
    sb: mockSupabase,
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

describe('API Parcours', () => {
  describe('GET /api/parcours', () => {
    it('should return 400 when org parameter is missing', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/parcours')
        .expect(400);

      expect(response.body).toEqual({
        ok: false,
        error: 'ORG_SLUG_REQUIRED',
        code: 'MISSING_ORG',
      });
    });

    it('should return 400 when org parameter is empty', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/parcours?org=')
        .expect(400);

      expect(response.body).toEqual({
        ok: false,
        error: 'ORG_SLUG_REQUIRED',
        code: 'MISSING_ORG',
      });
    });

    it('should return pathways for valid org', async () => {
      const response = await request('http://localhost:3000')
        .get('/api/parcours?org=test-org')
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        data: expect.any(Array),
      });
    });
  });

  describe('POST /api/parcours', () => {
    it('should return 400 when org parameter is missing', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/parcours')
        .send({ title: 'Test Pathway' })
        .expect(400);

      expect(response.body).toEqual({
        ok: false,
        error: 'ORG_SLUG_REQUIRED',
        code: 'MISSING_ORG',
      });
    });

    it('should return 400 when title is missing', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/parcours?org=test-org')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        ok: false,
        error: expect.stringContaining('title'),
        code: 'VALIDATION_ERROR',
      });
    });

    it('should return 400 when title is empty', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/parcours?org=test-org')
        .send({ title: '' })
        .expect(400);

      expect(response.body).toEqual({
        ok: false,
        error: expect.stringContaining('title'),
        code: 'VALIDATION_ERROR',
      });
    });

    it('should return 400 when reading_mode is invalid', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/parcours?org=test-org')
        .send({ 
          title: 'Test Pathway',
          reading_mode: 'invalid',
        })
        .expect(400);

      expect(response.body).toEqual({
        ok: false,
        error: expect.stringContaining('reading_mode'),
        code: 'VALIDATION_ERROR',
      });
    });

    it('should create pathway with valid data', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/parcours?org=test-org')
        .send({
          title: 'Test Pathway',
          description: 'Test Description',
          reading_mode: 'linear',
        })
        .expect(201);

      expect(response.body).toEqual({
        ok: true,
        data: { id: 'test-pathway' },
      });
    });

    it('should create pathway with minimal data', async () => {
      const response = await request('http://localhost:3000')
        .post('/api/parcours?org=test-org')
        .send({ title: 'Minimal Pathway' })
        .expect(201);

      expect(response.body).toEqual({
        ok: true,
        data: { id: 'test-pathway' },
      });
    });
  });
});
