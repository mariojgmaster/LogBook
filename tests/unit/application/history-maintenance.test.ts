import { describe, expect, it } from 'vitest';
import { Project } from '@/domain/entities/project';
import { LogRecord } from '@/domain/entities/log-record';
describe('history maintenance', () => {
  it('keeps identities while moving records and archiving projects', () => {
    const now = new Date(2026, 7, 17, 12);
    const project = Project.create('Projeto', crypto.randomUUID(), now);
    const record = LogRecord.create({
      id: crypto.randomUUID(),
      projectId: project.props.id,
      localDate: '2026-08-17',
      startMinute: 480,
      endMinute: 540,
      details: 'x',
      now,
    });
    const moved = record.update({
      projectId: project.props.id,
      localDate: '2026-08-16',
      startMinute: 480,
      endMinute: 540,
      details: 'x',
      now,
    });
    expect(moved.props.id).toBe(record.props.id);
    expect(moved.props.localDate).toBe('2026-08-16');
    expect(project.archive(now).props.id).toBe(project.props.id);
  });
});
