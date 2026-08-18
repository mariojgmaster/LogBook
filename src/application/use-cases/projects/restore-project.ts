import type { Clock } from '@/application/ports/platform';
import type { ProjectRepository } from '@/application/ports/repositories';

export class RestoreProject {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
  ) {}
  execute(id: string, expectedRevision: number) {
    return this.projects.restoreArchived(id, expectedRevision, this.clock.now());
  }
}
