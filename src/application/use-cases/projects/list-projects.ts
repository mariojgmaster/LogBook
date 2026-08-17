import type { ProjectRepository } from '@/application/ports/repositories';
export class ListProjects {
  constructor(private readonly repository: ProjectRepository) {}
  execute(includeArchived = true) {
    return this.repository.list(includeArchived);
  }
}
