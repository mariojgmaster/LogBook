import { EditOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Card, List, Space, Tag, Typography } from 'antd';
import type { ProjectProps } from '@/domain/entities/project';
import { EmptyState } from '@/ui/components/AsyncState';

export function ProjectList({
  projects,
  onEdit,
  onArchive,
  onCreate,
}: {
  projects: ProjectProps[];
  onEdit: (project: ProjectProps) => void;
  onArchive: (project: ProjectProps) => void;
  onCreate: () => void;
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
    <List
      dataSource={projects}
      renderItem={(project) => (
        <List.Item>
          <Card style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Space>
                <Typography.Text strong>{project.name}</Typography.Text>
                <Tag color={project.status === 'active' ? 'green' : 'default'}>
                  {project.status === 'active' ? 'Ativo' : 'Arquivado'}
                </Tag>
              </Space>
              <Space>
                <Button
                  icon={<EditOutlined />}
                  disabled={project.status === 'archived'}
                  onClick={() => onEdit(project)}
                >
                  Renomear
                </Button>
                <Button
                  danger
                  icon={<InboxOutlined />}
                  disabled={project.status === 'archived'}
                  onClick={() => onArchive(project)}
                >
                  Arquivar
                </Button>
              </Space>
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );
}
