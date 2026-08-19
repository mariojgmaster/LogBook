import type { ProjectRepository } from '@/application/ports/repositories';

export class RemoveProject {
  constructor(private readonly projects: ProjectRepository) {}
  async execute(id: string, expectedRevision: number): Promise<null> {
    await this.projects.removeArchived(id, expectedRevision);
    return null;
  }
}
