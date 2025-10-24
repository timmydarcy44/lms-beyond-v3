import { describe, it, expect } from 'vitest';
import { pathwayMetaInputClient, pathwayItemsInputClient, pathwayAssignmentsInputClient } from '@/lib/validation/pathways.client';

describe('Pathway Meta Validation', () => {
  it('should accept valid pathway meta', () => {
    const validData = {
      title: 'Formation React',
      description: 'Apprendre React.js',
      reading_mode: 'linear' as const,
    };
    
    expect(() => pathwayMetaInputClient.parse(validData)).not.toThrow();
    const result = pathwayMetaInputClient.parse(validData);
    expect(result.title).toBe('Formation React');
    expect(result.reading_mode).toBe('linear');
  });

  it('should accept minimal valid data', () => {
    const minimalData = {
      title: 'A',
    };
    
    expect(() => pathwayMetaInputClient.parse(minimalData)).not.toThrow();
    const result = pathwayMetaInputClient.parse(minimalData);
    expect(result.reading_mode).toBe('linear'); // default value
  });

  it('should reject empty title', () => {
    const invalidData = {
      title: '',
      reading_mode: 'linear' as const,
    };
    
    expect(() => pathwayMetaInputClient.parse(invalidData)).toThrow();
  });

  it('should reject invalid reading mode', () => {
    const invalidData = {
      title: 'Test',
      reading_mode: 'invalid' as any,
    };
    
    expect(() => pathwayMetaInputClient.parse(invalidData)).toThrow();
  });

  it('should reject invalid URL', () => {
    const invalidData = {
      title: 'Test',
      cover_url: 'not-a-url',
    };
    
    expect(() => pathwayMetaInputClient.parse(invalidData)).toThrow();
  });
});

describe('Pathway Items Validation', () => {
  it('should accept valid items array', () => {
    const validData = {
      items: [
        { type: 'formation' as const, id: '123', position: 0 },
        { type: 'test' as const, id: '456', position: 1 },
        { type: 'resource' as const, id: '789', position: 2 },
      ],
    };
    
    expect(() => pathwayItemsInputClient.parse(validData)).not.toThrow();
  });

  it('should accept empty items array', () => {
    const validData = { items: [] };
    expect(() => pathwayItemsInputClient.parse(validData)).not.toThrow();
  });

  it('should reject invalid item type', () => {
    const invalidData = {
      items: [
        { type: 'invalid' as any, id: '123', position: 0 },
      ],
    };
    
    expect(() => pathwayItemsInputClient.parse(invalidData)).toThrow();
  });

  it('should reject negative position', () => {
    const invalidData = {
      items: [
        { type: 'formation' as const, id: '123', position: -1 },
      ],
    };
    
    expect(() => pathwayItemsInputClient.parse(invalidData)).toThrow();
  });

  it('should reject empty item id', () => {
    const invalidData = {
      items: [
        { type: 'formation' as const, id: '', position: 0 },
      ],
    };
    
    expect(() => pathwayItemsInputClient.parse(invalidData)).toThrow();
  });
});

describe('Pathway Assignments Validation', () => {
  it('should accept valid assignments', () => {
    const validData = {
      learners: ['user1', 'user2'],
      groups: ['group1'],
    };
    
    expect(() => pathwayAssignmentsInputClient.parse(validData)).not.toThrow();
  });

  it('should accept empty assignments', () => {
    const validData = {};
    expect(() => pathwayAssignmentsInputClient.parse(validData)).not.toThrow();
  });

  it('should accept only learners', () => {
    const validData = {
      learners: ['user1'],
    };
    
    expect(() => pathwayAssignmentsInputClient.parse(validData)).not.toThrow();
  });

  it('should accept only groups', () => {
    const validData = {
      groups: ['group1'],
    };
    
    expect(() => pathwayAssignmentsInputClient.parse(validData)).not.toThrow();
  });

  it('should reject non-string learner IDs', () => {
    const invalidData = {
      learners: [123 as any],
    };
    
    expect(() => pathwayAssignmentsInputClient.parse(invalidData)).toThrow();
  });

  it('should reject non-string group IDs', () => {
    const invalidData = {
      groups: [true as any],
    };
    
    expect(() => pathwayAssignmentsInputClient.parse(invalidData)).toThrow();
  });
});
