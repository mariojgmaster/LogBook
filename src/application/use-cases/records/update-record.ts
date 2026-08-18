import type { Clock } from '@/application/ports/platform';
import type { ProjectRepository, RecordRepository } from '@/application/ports/repositories';
import { AppError } from '@/domain/errors/app-error';
import { LogRecord, type CreateLogRecordInput } from '@/domain/entities/log-record';
export class UpdateRecord {
  constructor(
    private readonly records: RecordRepository,
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
  ) {}
  async execute(
    id: string,
    inputOrLegacyRevision: Omit<CreateLogRecordInput, 'id' | 'now'> | number,
    legacyInput?: Omit<CreateLogRecordInput, 'id' | 'now'>,
  ) {
    const input = typeof inputOrLegacyRevision === 'number' ? legacyInput! : inputOrLegacyRevision;
    const current = await this.records.get(id);
    if (!current) throw new AppError('NOT_FOUND');
    const project = await this.projects.get(input.projectId);
    if (!project) throw new AppError('VALIDATION', { projectId: 'Projeto inválido.' });
    const updated = LogRecord.restore(current).update({ ...input, now: this.clock.now() });
    const legacyExpected =
      typeof inputOrLegacyRevision === 'number' ? inputOrLegacyRevision : undefined;
    return (await this.records.update(updated, legacyExpected)) ?? updated.props;
  }
}
