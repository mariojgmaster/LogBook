import { describe, expect, it } from 'vitest';
import { Project } from '@/domain/entities/project';
import { LogRecord } from '@/domain/entities/log-record';
import { IndexedDbProjectRepository } from '@/infrastructure/persistence/indexeddb/project-repository';
import { IndexedDbLogRecordRepository } from '@/infrastructure/persistence/indexeddb/log-record-repository';

const now = new Date(2026, 7, 17, 12);

describe('atomic archived project lifecycle', () => {
  it('restores with CAS and active-name uniqueness', async () => {
    const repository = new IndexedDbProjectRepository();
    const archived = Project.create('Projeto', crypto.randomUUID(), now, 3).archive(now);
    await repository.add(archived);
    const restored = await repository.restoreArchived(
      archived.props.id,
      archived.props.revision,
      now,
    );
    expect(restored).toMatchObject({ status: 'active', colorSlot: 3 });
    await expect(
      repository.restoreArchived(archived.props.id, archived.props.revision, now),
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    const duplicate = Project.create('Projeto', crypto.randomUUID(), now, 4).archive(now);
    await repository.add(duplicate);
    await expect(
      repository.restoreArchived(duplicate.props.id, duplicate.props.revision, now),
    ).rejects.toMatchObject({ code: 'DUPLICATE' });
  });

  it('removes only an empty archived project and never cascades records', async () => {
    const projects = new IndexedDbProjectRepository();
    const records = new IndexedDbLogRecordRepository();
    const empty = Project.create('Vazio', crypto.randomUUID(), now, 1).archive(now);
    await projects.add(empty);
    await projects.removeArchived(empty.props.id, empty.props.revision);
    expect(await projects.get(empty.props.id)).toBeUndefined();

    const linked = Project.create('Com histórico', crypto.randomUUID(), now, 2).archive(now);
    await projects.add(linked);
    const record = LogRecord.create({
      id: crypto.randomUUID(),
      projectId: linked.props.id,
      localDate: '2026-08-17',
      startMinute: 480,
      durationMinutes: 60,
      details: 'Vínculo tardio',
      now,
    });
    await records.add(record);
    await expect(
      projects.removeArchived(linked.props.id, linked.props.revision),
    ).rejects.toMatchObject({ code: 'PROJECT_HAS_RECORDS' });
    expect(await projects.get(linked.props.id)).toBeDefined();
    expect(await records.get(record.props.id)).toBeDefined();
  });
});
