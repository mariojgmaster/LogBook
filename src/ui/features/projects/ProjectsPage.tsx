import { useCallback, useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App as AntApp, Button, Segmented } from 'antd';
import type { ProjectProps } from '@/domain/entities/project';
import { AppError } from '@/domain/errors/app-error';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { ErrorState, LoadingState } from '@/ui/components/AsyncState';
import { ProjectForm } from './ProjectForm';
import { ProjectList } from './ProjectList';
import { useEntityChanges } from '@/ui/hooks/useEntityChanges';

export function ProjectsPage() {
  const { message, modal } = AntApp.useApp();
  const [projects, setProjects] = useState<ProjectProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [editing, setEditing] = useState<ProjectProps | null>();
  const [saving, setSaving] = useState(false);
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
      if (editing)
        await sendAppMessage({
          type: 'project.update',
          payload: { id: editing.id, name, expectedRevision: editing.revision },
        });
      else await sendAppMessage({ type: 'project.create', payload: { name } });
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
      content:
        'O projeto continuará visível no histórico, mas não poderá receber novos registros nem ser reativado nesta versão.',
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
          onCreate={() => setEditing(null)}
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
