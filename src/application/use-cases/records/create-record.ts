import type { Clock, IdGenerator } from '@/application/ports/platform';
import type { ProjectRepository, RecordRepository } from '@/application/ports/repositories';
import { AppError } from '@/domain/errors/app-error';
import { LogRecord, type CreateLogRecordInput } from '@/domain/entities/log-record';

export class CreateRecord {
  constructor(
    private readonly records: RecordRepository,
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  async execute(input: Omit<CreateLogRecordInput, 'id' | 'now'>) {
    const project = await this.projects.get(input.projectId);
    if (!project || project.status !== 'active')
      throw new AppError('VALIDATION', { projectId: 'Selecione um projeto ativo.' });
    const record = LogRecord.create({ ...input, id: this.ids.next(), now: this.clock.now() });
    await this.records.add(record);
    return record.props;
  }
}
