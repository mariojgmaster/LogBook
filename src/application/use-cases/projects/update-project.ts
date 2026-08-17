import type { Clock } from '@/application/ports/platform';
import type { ProjectRepository } from '@/application/ports/repositories';
import { AppError } from '@/domain/errors/app-error';
import { Project } from '@/domain/entities/project';
export class UpdateProject {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly clock: Clock,
  ) {}
  async execute(id: string, name: string, expectedRevision: number) {
    const current = await this.repository.get(id);
    if (!current) throw new AppError('NOT_FOUND');
    const updated = Project.restore(current).rename(name, this.clock.now());
    await this.repository.update(updated, expectedRevision);
    return updated.props;
  }
}
