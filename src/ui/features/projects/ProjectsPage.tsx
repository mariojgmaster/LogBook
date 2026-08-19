import { useCallback, useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App as AntApp, Button, Segmented } from 'antd';
import type { ProjectProps } from '@/domain/entities/project';
import { AppError } from '@/domain/errors/app-error';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { ErrorState, LoadingState } from '@/ui/components/AsyncState';
import { useEntityChanges } from '@/ui/hooks/useEntityChanges';
import { ProjectForm } from './ProjectForm';
import { ProjectList } from './ProjectList';

export function ProjectsPage() {
  const { message, modal } = AntApp.useApp();
  const [projects, setProjects] = useState<ProjectProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [editing, setEditing] = useState<ProjectProps | null>();
  const [saving, setSaving] = useState(false);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const values = await sendAppMessage<ProjectProps[]>({
        type: 'project.list',
        payload: { includeArchived: true },
      });
      setError(undefined);
      setProjects(values);
    } catch (cause) {
      setError(AppError.fromUnknown(cause).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEntityChanges(() => {
    void load();
  });
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const save = async (name: string) => {
    setSaving(true);
    try {
      if (editing) {
        await sendAppMessage({
          type: 'project.update',
          payload: { id: editing.id, name, expectedRevision: editing.revision },
        });
      } else {
        await sendAppMessage({ type: 'project.create', payload: { name } });
      }
      setEditing(undefined);
      message.success('Projeto salvo.');
      await load();
    } catch (cause) {
      message.error(AppError.fromUnknown(cause).message);
    } finally {
      setSaving(false);
    }
  };

  const archive = (project: ProjectProps) => {
    modal.confirm({
      title: `Arquivar “${project.name}”?`,
      content: 'O projeto continuará visível no histórico e poderá ser restaurado depois.',
      okText: 'Arquivar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        await sendAppMessage({
          type: 'project.archive',
          payload: { id: project.id, expectedRevision: project.revision },
        });
        message.success('Projeto arquivado.');
        await load();
      },
    });
  };

  const focusProject = (projectId: string) => {
    setTimeout(() => {
      const card = document.getElementById(`project-card-${projectId}`);
      card?.focus();
      card?.scrollIntoView({ block: 'nearest' });
    }, 0);
  };

  const reportProjectActionError = (project: ProjectProps, cause: unknown) => {
    setActionErrors((current) => ({
      ...current,
      [project.id]: AppError.fromUnknown(cause).message,
    }));
    focusProject(project.id);
  };

  const restore = async (project: ProjectProps) => {
    setActionErrors((current) => ({ ...current, [project.id]: '' }));
    try {
      await sendAppMessage({
        type: 'project.restore',
        payload: { id: project.id, expectedRevision: project.revision },
      });
      message.success('Projeto restaurado.');
      await load();
    } catch (cause) {
      reportProjectActionError(project, cause);
    }
  };

  const remove = (project: ProjectProps) => {
    modal.confirm({
      title: `Remover “${project.name}”?`,
      content:
        'Esta ação é irreversível. O projeto só será removido se não possuir registros vinculados.',
      okText: 'Remover definitivamente',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        setActionErrors((current) => ({ ...current, [project.id]: '' }));
        try {
          await sendAppMessage({
            type: 'project.remove',
            payload: { id: project.id, expectedRevision: project.revision },
          });
          message.success('Projeto removido definitivamente.');
          await load();
        } catch (cause) {
          reportProjectActionError(project, cause);
        }
      },
    });
  };

  return (
    <section aria-labelledby="projects-heading">
      <div className="page-heading">
        <div>
          <h1 id="projects-heading">Projetos</h1>
          <span className="muted">Organize o histórico sem perder referências antigas.</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
          Novo projeto
        </Button>
      </div>
      <Segmented
        aria-label="Estado dos projetos"
        value={view}
        onChange={(value) => setView(value as 'active' | 'archived')}
        options={[
          { value: 'active', label: 'Ativos' },
          { value: 'archived', label: 'Arquivados' },
        ]}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <ProjectList
          projects={projects.filter((project) => project.status === view)}
          onEdit={setEditing}
          onArchive={archive}
          onRestore={(project) => void restore(project)}
          onRemove={remove}
          onCreate={() => setEditing(null)}
          actionErrors={actionErrors}
        />
      )}
      <ProjectForm
        open={editing !== undefined}
        project={editing ?? undefined}
        confirmLoading={saving}
        onCancel={() => setEditing(undefined)}
        onSubmit={save}
      />
    </section>
  );
}
