import type { Clock, IdGenerator } from '@/application/ports/platform';
import type { ProjectRepository } from '@/application/ports/repositories';
import { Project, type ProjectProps } from '@/domain/entities/project';
import { assignProjectColorSlot } from '@/domain/services/project-color-assignment';

export class CreateProject {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  async execute(name: string): Promise<ProjectProps> {
    const projects = await this.repository.list(true);
    const colorSlot = assignProjectColorSlot(projects);
    const project = Project.create(name, this.ids.next(), this.clock.now(), colorSlot);
    await this.repository.add(project);
    return project.props;
  }
}
