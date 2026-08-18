import { useState } from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { App as AntApp, Button, Descriptions, Drawer, Space, Typography } from 'antd';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { formatClockTime } from '@/domain/value-objects/time-range';
import { formatMinutes } from '@/ui/utils/time';
import { RecordForm } from './RecordForm';
import type { RecordDraft } from './RecordForm';
import { ConflictDialog } from '@/ui/components/ConflictDialog';

export function RecordDetailsPanel({
  record,
  projects,
  onClose,
  onChanged,
}: {
  record?: LogRecordProps;
  projects: ProjectProps[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { modal, message } = AntApp.useApp();
  const [editing, setEditing] = useState(false);
  const [conflict, setConflict] = useState<{ draft: RecordDraft; current: LogRecordProps }>();
  const project = projects.find((item) => item.id === record?.projectId);
  const remove = () => {
    if (!record) return;
    modal.confirm({
      title: 'Excluir este registro?',
      content: 'Esta ação remove a tarefa do histórico e recalcula os totais.',
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        await sendAppMessage({
          type: 'record.delete',
          payload: { id: record.id, expectedRevision: record.revision },
        });
        message.success('Registro excluído.');
        onClose();
        await onChanged();
      },
    });
  };
  const findCurrent = async () => {
    if (!record) return undefined;
    const page = await sendAppMessage<{ items: LogRecordProps[] }>({
      type: 'record.listPeriod',
      payload: { start: record.localDate, end: record.localDate, mode: 'day' },
    });
    return page.items.find((item) => item.id === record.id);
  };
  const onConflict = async (draft: RecordDraft) => {
    const current = await findCurrent();
    setEditing(false);
    if (current) setConflict({ draft, current });
    else {
      message.warning('O registro foi excluído em outra janela.');
      onClose();
      await onChanged();
    }
  };
  const reapply = async () => {
    if (!record || !conflict) return;
    try {
      await sendAppMessage({
        type: 'record.update',
        payload: {
          id: record.id,
          record: conflict.draft,
        },
      });
      setConflict(undefined);
      onClose();
      await onChanged();
      message.success('Alterações reaplicadas.');
    } catch {
      const current = await findCurrent();
      if (current) setConflict({ ...conflict, current });
      message.warning('O registro mudou novamente. Compare a versão mais recente.');
    }
  };
  return (
    <>
      <Drawer
        title="Detalhes do registro"
        open={Boolean(record)}
        onClose={onClose}
        width="min(34rem, 100vw)"
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={remove}>
              Excluir
            </Button>
          </Space>
        }
      >
        {record && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Projeto">
                {project?.name ?? 'Projeto arquivado'}
              </Descriptions.Item>
              <Descriptions.Item label="Data">
                {record.localDate.split('-').reverse().join('/')}
              </Descriptions.Item>
              <Descriptions.Item label="Horário">
                {formatClockTime(record.startMinute)}–{formatClockTime(record.endMinute)}
              </Descriptions.Item>
              <Descriptions.Item label="Duração">
                {formatMinutes(record.durationMinutes)}
              </Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5}>Detalhes</Typography.Title>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {record.details}
            </Typography.Paragraph>
          </>
        )}
      </Drawer>
      {record && (
        <RecordForm
          open={editing}
          record={record}
          projects={projects}
          initialDate={record.localDate}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            onClose();
            await onChanged();
          }}
          onConflict={onConflict}
        />
      )}
      {conflict && (
        <ConflictDialog
          open
          local={conflict.draft as unknown as Record<string, unknown>}
          current={conflict.current as unknown as Record<string, unknown>}
          onCancel={() => setConflict(undefined)}
          onReload={() => {
            setConflict(undefined);
            onClose();
            void onChanged();
          }}
          onReapply={() => void reapply()}
        />
      )}
    </>
  );
}
