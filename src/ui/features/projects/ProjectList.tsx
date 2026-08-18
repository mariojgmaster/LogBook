import { DeleteOutlined, EditOutlined, InboxOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';
import type { ProjectProps } from '@/domain/entities/project';
import { EmptyState } from '@/ui/components/AsyncState';

export function ProjectList({
  projects,
  onEdit,
  onArchive,
  onRestore,
  onRemove,
  onCreate,
  actionErrors = {},
}: {
  projects: ProjectProps[];
  onEdit: (project: ProjectProps) => void;
  onArchive: (project: ProjectProps) => void;
  onRestore: (project: ProjectProps) => void;
  onRemove: (project: ProjectProps) => void;
  onCreate: () => void;
  actionErrors?: Readonly<Record<string, string>>;
}) {
  if (projects.length === 0)
    return (
      <EmptyState
        description="Nenhum projeto cadastrado."
        action={
          <Button type="primary" onClick={onCreate}>
            Criar primeiro projeto
          </Button>
        }
      />
    );
  return (
    <div className="project-list" role="list">
      {projects.map((project) => (
        <div role="listitem" key={project.id}>
          <Card
            id={`project-card-${project.id}`}
            role="group"
            aria-label={project.name}
            tabIndex={-1}
            style={{ width: '100%' }}
          >
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <Space>
                  <Typography.Text strong>{project.name}</Typography.Text>
                  <Tag color={project.status === 'active' ? 'green' : 'default'}>
                    {project.status === 'active' ? 'Ativo' : 'Arquivado'}
                  </Tag>
                </Space>
                <Space wrap>
                  {project.status === 'active' ? (
                    <>
                      <Button
                        aria-label="Renomear"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(project)}
                      >
                        Renomear
                      </Button>
                      <Button
                        danger
                        aria-label="Arquivar"
                        icon={<InboxOutlined />}
                        onClick={() => onArchive(project)}
                      >
                        Arquivar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        aria-label="Restaurar"
                        icon={<UndoOutlined />}
                        onClick={() => onRestore(project)}
                      >
                        Restaurar
                      </Button>
                      <Button
                        danger
                        aria-label="Remover"
                        icon={<DeleteOutlined />}
                        onClick={() => onRemove(project)}
                      >
                        Remover
                      </Button>
                    </>
                  )}
                </Space>
              </Space>
              {actionErrors[project.id] ? (
                <Typography.Text type="danger" role="alert">
                  {actionErrors[project.id]}
                </Typography.Text>
              ) : null}
            </Space>
          </Card>
        </div>
      ))}
    </div>
  );
}
