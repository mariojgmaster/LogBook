import { AppError } from '@/domain/errors/app-error';

export type ProjectStatus = 'active' | 'archived';

export interface ProjectProps {
  id: string;
  name: string;
  normalizedName: string;
  status: ProjectStatus;
  colorSlot?: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export const normalizeProjectName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').normalize('NFKC').toLocaleLowerCase('pt-BR');

export class Project {
  private constructor(readonly props: Readonly<ProjectProps>) {}

  static create(name: string, id: string, now: Date, colorSlot = 0): Project {
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 1 || cleanName.length > 100) {
      throw new AppError('VALIDATION', { name: 'O nome deve ter entre 1 e 100 caracteres.' });
    }
    validateColorSlot(colorSlot);
    const timestamp = now.toISOString();
    return new Project({
      id,
      name: cleanName,
      normalizedName: normalizeProjectName(cleanName),
      status: 'active',
      colorSlot,
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
    validateColorSlot(props.colorSlot, 'STORAGE_UNAVAILABLE');
    return new Project({ ...props });
  }

  rename(name: string, now: Date): Project {
    const updated = Project.create(
      name,
      this.props.id,
      new Date(this.props.createdAt),
      this.props.colorSlot ?? 0,
    );
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

  restore(now: Date): Project {
    if (this.props.status === 'active') return this;
    return new Project({
      ...this.props,
      status: 'active',
      revision: this.props.revision + 1,
      updatedAt: now.toISOString(),
    });
  }

  ensureRemovable(): void {
    if (this.props.status !== 'archived') {
      throw new AppError('VALIDATION', {
        project: 'Somente projetos arquivados podem ser removidos.',
      });
    }
  }
}

const validateColorSlot = (
  value: number | undefined,
  code: 'VALIDATION' | 'STORAGE_UNAVAILABLE' = 'VALIDATION',
) => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 11) {
    throw new AppError(
      code,
      code === 'VALIDATION' ? { colorSlot: 'Cor de projeto inválida.' } : undefined,
    );
  }
};
