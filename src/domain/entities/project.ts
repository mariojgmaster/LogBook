import { AppError } from '@/domain/errors/app-error';

export type ProjectStatus = 'active' | 'archived';

export interface ProjectProps {
  id: string;
  name: string;
  normalizedName: string;
  status: ProjectStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export const normalizeProjectName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').normalize('NFKC').toLocaleLowerCase('pt-BR');

export class Project {
  private constructor(readonly props: Readonly<ProjectProps>) {}

  static create(name: string, id: string, now: Date): Project {
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 1 || cleanName.length > 100) {
      throw new AppError('VALIDATION', { name: 'O nome deve ter entre 1 e 100 caracteres.' });
    }
    const timestamp = now.toISOString();
    return new Project({
      id,
      name: cleanName,
      normalizedName: normalizeProjectName(cleanName),
      status: 'active',
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static restore(props: ProjectProps): Project {
    if (
      !props.id ||
      props.revision < 1 ||
      normalizeProjectName(props.name) !== props.normalizedName
    ) {
      throw new AppError('STORAGE_UNAVAILABLE');
    }
    return new Project({ ...props });
  }

  rename(name: string, now: Date): Project {
    const updated = Project.create(name, this.props.id, new Date(this.props.createdAt));
    return new Project({
      ...updated.props,
      status: this.props.status,
      revision: this.props.revision + 1,
      createdAt: this.props.createdAt,
      updatedAt: now.toISOString(),
    });
  }

  archive(now: Date): Project {
    if (this.props.status === 'archived') return this;
    return new Project({
      ...this.props,
      status: 'archived',
      revision: this.props.revision + 1,
      updatedAt: now.toISOString(),
    });
  }
}
