import { describe, expect, it } from 'vitest';
import { Project, normalizeProjectName } from '@/domain/entities/project';

describe('Project', () => {
  it('normalizes whitespace and casing', () => {
    const project = Project.create('  Meu   Projeto  ', crypto.randomUUID(), new Date());
    expect(project.props.name).toBe('Meu Projeto');
    expect(normalizeProjectName('MEU PROJETO')).toBe(project.props.normalizedName);
  });
  it('enforces the 100-character limit', () => {
    expect(() => Project.create('', crypto.randomUUID(), new Date())).toThrow();
    expect(() => Project.create('a'.repeat(101), crypto.randomUUID(), new Date())).toThrow();
  });
  it('archives without reactivation', () =>
    expect(
      Project.create('A', crypto.randomUUID(), new Date()).archive(new Date()).props.status,
    ).toBe('archived'));
});
