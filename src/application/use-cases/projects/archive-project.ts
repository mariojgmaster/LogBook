import type { Clock } from '@/application/ports/platform';
import type { ProjectRepository } from '@/application/ports/repositories';
import { AppError } from '@/domain/errors/app-error';
import { Project } from '@/domain/entities/project';
export class ArchiveProject {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly clock: Clock,
  ) {}
  async execute(id: string, expectedRevision: number) {
    const current = await this.repository.get(id);
    if (!current) throw new AppError('NOT_FOUND');
    const archived = Project.restore(current).archive(this.clock.now());
    await this.repository.update(archived, expectedRevision);
    return archived.props;
  }
}
