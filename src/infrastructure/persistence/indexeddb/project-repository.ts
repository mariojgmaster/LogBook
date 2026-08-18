import { AppError } from '@/domain/errors/app-error';
import { Project, type ProjectProps } from '@/domain/entities/project';
import type { ProjectRepository } from '@/application/ports/repositories';
import { getDatabase } from './database';

export class IndexedDbProjectRepository implements ProjectRepository {
  async add(project: Project): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction('projects', 'readwrite');
    const matching = await tx.store
      .index('by-normalized-name')
      .getAll(project.props.normalizedName);
    if (
      project.props.status === 'active' &&
      matching.some((candidate) => candidate.status === 'active')
    ) {
      throw new AppError('DUPLICATE', { name: 'Já existe um projeto ativo com esse nome.' });
    }
    try {
      await tx.store.add({ ...project.props });
      await tx.done;
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }

  async list(includeArchived = true): Promise<ProjectProps[]> {
    const values = await (await getDatabase()).getAll('projects');
    return values
      .map((item) => Project.restore(item).props)
      .filter((item) => includeArchived || item.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  async get(id: string): Promise<ProjectProps | undefined> {
    const value = await (await getDatabase()).get('projects', id);
    return value ? Project.restore(value).props : undefined;
  }

  async update(project: Project, expectedRevision: number): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction('projects', 'readwrite');
    const current = await tx.store.get(project.props.id);
    if (!current) throw new AppError('NOT_FOUND');
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    const matching = await tx.store
      .index('by-normalized-name')
      .getAll(project.props.normalizedName);
    if (
      project.props.status === 'active' &&
      matching.some(
        (candidate) => candidate.id !== project.props.id && candidate.status === 'active',
      )
    ) {
      throw new AppError('DUPLICATE', { name: 'Já existe um projeto ativo com esse nome.' });
    }
    await tx.store.put({ ...project.props });
    await tx.done;
  }

  async restore(id: string): Promise<Project | undefined> {
    const props = await this.get(id);
    return props ? Project.restore(props) : undefined;
  }

  async restoreArchived(id: string, expectedRevision: number, now: Date): Promise<ProjectProps> {
    const tx = (await getDatabase()).transaction('projects', 'readwrite');
    const current = await tx.store.get(id);
    if (!current) throw new AppError('NOT_FOUND');
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    const project = Project.restore(current);
    if (project.props.status !== 'archived') throw new AppError('CONFLICT');
    const matching = await tx.store
      .index('by-normalized-name')
      .getAll(project.props.normalizedName);
    if (matching.some((candidate) => candidate.id !== id && candidate.status === 'active')) {
      throw new AppError('DUPLICATE', { name: 'Já existe um projeto ativo com esse nome.' });
    }
    const restored = project.restore(now);
    await tx.store.put({ ...restored.props });
    await tx.done;
    return restored.props;
  }

  async removeArchived(id: string, expectedRevision: number): Promise<void> {
    const tx = (await getDatabase()).transaction(['projects', 'records'], 'readwrite');
    const projectStore = tx.objectStore('projects');
    const current = await projectStore.get(id);
    if (!current) throw new AppError('NOT_FOUND');
    if (current.revision !== expectedRevision) throw new AppError('CONFLICT');
    Project.restore(current).ensureRemovable();
    const linkedRecord = await tx.objectStore('records').index('by-project').getKey(id);
    if (linkedRecord !== undefined) throw new AppError('PROJECT_HAS_RECORDS');
    await projectStore.delete(id);
    await tx.done;
  }
}
