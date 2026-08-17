import type { Clock, IdGenerator } from '@/application/ports/platform';
import type { ProjectRepository } from '@/application/ports/repositories';
import { Project, type ProjectProps } from '@/domain/entities/project';

export class CreateProject {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  async execute(name: string): Promise<ProjectProps> {
    const project = Project.create(name, this.ids.next(), this.clock.now());
    await this.repository.add(project);
    return project.props;
  }
}
