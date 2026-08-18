import { describe, expect, it } from 'vitest';
import { Project, normalizeProjectName } from '@/domain/entities/project';

const now = new Date('2026-08-17T12:00:00.000Z');

describe('project v2 lifecycle', () => {
  it('restores an archived project preserving identity, color and history', () => {
    const archived = Project.create('Projeto', crypto.randomUUID(), now, 7).archive(now);
    const restored = archived.restore(new Date('2026-08-17T13:00:00.000Z'));
    expect(restored.props).toMatchObject({
      id: archived.props.id,
      name: archived.props.name,
      status: 'active',
      colorSlot: 7,
      createdAt: archived.props.createdAt,
      revision: archived.props.revision + 1,
    });
  });

  it('normalizes equivalent active names for duplicate checks', () => {
    expect(normalizeProjectName('  PROJETO   ÁGIL ')).toBe(normalizeProjectName('projeto ágil'));
  });

  it('allows definitive removal only from the archived state', () => {
    const active = Project.create('Projeto', crypto.randomUUID(), now, 2);
    expect(() => active.ensureRemovable()).toThrow();
    expect(() => active.archive(now).ensureRemovable()).not.toThrow();
  });
});
