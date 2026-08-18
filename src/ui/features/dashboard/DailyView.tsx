import { useState } from 'react';
import { ClockCircleOutlined, CopyOutlined, FolderOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import type { HourSummary } from '@/domain/services/hour-classifier';
import { formatClockTime } from '@/domain/value-objects/time-range';
import { EmptyState } from '@/ui/components/AsyncState';
import { formatMinutes } from '@/ui/utils/time';
import type { ClipboardPort } from '@/application/ports/platform';
import { browserClipboard } from '@/infrastructure/browser/clipboard-adapter';

export function SummaryCards({ summary }: { summary?: HourSummary }) {
  if (!summary) return null;
  return (
    <div className="summary-grid" aria-label="Resumo de horas">
      {[
        ['Total', summary.total],
        ['Normais', summary.regular],
        ['Extra 50%', summary.overtime50],
        ['Extra 100%', summary.overtime100],
      ].map(([label, value]) => (
        <Card size="small" key={String(label)}>
          <Typography.Text type="secondary">{label}</Typography.Text>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {summary.available ? formatMinutes(Number(value)) : 'Indisponível'}
          </Typography.Title>
        </Card>
      ))}
    </div>
  );
}

export function DailyView({
  records,
  projects,
  summary,
  onOpen,
  onCreate,
  clipboard = browserClipboard,
}: {
  records: LogRecordProps[];
  projects: ProjectProps[];
  summary?: HourSummary;
  onOpen: (record: LogRecordProps) => void;
  onCreate: () => void;
  clipboard?: ClipboardPort;
}) {
  const names = new Map(projects.map((project) => [project.id, project.name]));
  const [copyFeedback, setCopyFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  }>();
  const copyDetails = async (record: LogRecordProps) => {
    try {
      await clipboard.writeText(record.details);
      setCopyFeedback({ kind: 'success', message: 'Descrição copiada.' });
    } catch {
      setCopyFeedback({ kind: 'error', message: 'Não foi possível copiar a descrição.' });
    }
  };
  return (
    <>
      <SummaryCards summary={summary} />
      {copyFeedback ? (
        <span className="copy-feedback" role={copyFeedback.kind === 'error' ? 'alert' : 'status'}>
          {copyFeedback.message}
        </span>
      ) : null}
      {records.length === 0 ? (
        <div className="empty-action">
          <EmptyState
            description="Nenhuma atividade neste dia."
            action={
              <Button type="primary" onClick={onCreate}>
                Registrar atividade
              </Button>
            }
          />
        </div>
      ) : (
        <div className="record-list">
          {records.map((record) => (
            <Card
              key={record.id}
              className="record-card"
              hoverable
              onClick={() => onOpen(record)}
              styles={{ body: { padding: 16 } }}
            >
              <div className="record-card-row">
                <div>
                  <Space>
                    <FolderOutlined aria-hidden="true" />
                    <Typography.Text strong>
                      {names.get(record.projectId) ?? 'Projeto arquivado'}
                    </Typography.Text>
                  </Space>
                  <Typography.Paragraph
                    className="record-details"
                    ellipsis={{ rows: 2 }}
                    style={{ margin: '6px 0 0' }}
                  >
                    {record.details}
                  </Typography.Paragraph>
                </div>
                <Tag icon={<ClockCircleOutlined />}>
                  {formatClockTime(record.startMinute)}–{formatClockTime(record.endMinute)}
                </Tag>
                <Typography.Text>{formatMinutes(record.durationMinutes)}</Typography.Text>
                <div className="record-actions">
                  <Button
                    type="link"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(record);
                    }}
                  >
                    Detalhes
                  </Button>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    aria-label={`Copiar descrição de ${names.get(record.projectId) ?? 'projeto arquivado'}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyDetails(record);
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
