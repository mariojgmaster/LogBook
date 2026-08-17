import { useCallback, useEffect, useMemo, useState } from 'react';
import { LeftOutlined, PlusOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { App as AntApp, Button, DatePicker, Input, Segmented, Select, Space } from 'antd';
import dayjs from 'dayjs';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import type { HourSummary } from '@/domain/services/hour-classifier';
import { LocalDate } from '@/domain/value-objects/local-date';
import { navigatePeriod, periodFor, type PeriodMode } from '@/domain/value-objects/period';
import { AppError } from '@/domain/errors/app-error';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { ErrorState, LoadingState } from '@/ui/components/AsyncState';
import { RecordForm } from '@/ui/features/records/RecordForm';
import { RecordDetailsPanel } from '@/ui/features/records/RecordDetailsPanel';
import { DailyView } from './DailyView';
import { FortnightView } from './FortnightView';
import { MonthlyView } from './MonthlyView';
import { useEntityChanges } from '@/ui/hooks/useEntityChanges';

interface RecordPage {
  items: LogRecordProps[];
  nextCursor?: string;
}
const FILTER_KEY = 'logbook.diary.filters.v1';
const getFilters = (): { projectIds: string[]; search: string } => {
  try {
    return JSON.parse(localStorage.getItem(FILTER_KEY) ?? '') as {
      projectIds: string[];
      search: string;
    };
  } catch {
    return { projectIds: [], search: '' };
  }
};

export function DiaryPage({ newRecordSignal }: { newRecordSignal: number }) {
  const { message } = AntApp.useApp();
  const [mode, setMode] = useState<PeriodMode>('day');
  const [anchor, setAnchor] = useState(LocalDate.fromDate(new Date()).value);
  const [projects, setProjects] = useState<ProjectProps[]>([]);
  const [records, setRecords] = useState<LogRecordProps[]>([]);
  const [summary, setSummary] = useState<HourSummary>();
  const initial = useMemo(() => getFilters(), []);
  const [projectIds, setProjectIds] = useState(initial.projectIds);
  const [search, setSearch] = useState(initial.search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [formOpen, setFormOpen] = useState(false);
  const [formDate, setFormDate] = useState(anchor);
  const [selected, setSelected] = useState<LogRecordProps>();
  const period = useMemo(() => periodFor(anchor, mode), [anchor, mode]);
  const load = useCallback(async () => {
    try {
      const [projectData, page, summaryData] = await Promise.all([
        sendAppMessage<ProjectProps[]>({
          type: 'project.list',
          payload: { includeArchived: true },
        }),
        sendAppMessage<RecordPage>({
          type: 'record.listPeriod',
          payload: { ...period, projectIds, search },
        }),
        sendAppMessage<HourSummary>({ type: 'summary.getPeriod', payload: period }),
      ]);
      setError(undefined);
      setProjects(projectData);
      setRecords(page.items);
      setSummary(summaryData);
      localStorage.setItem(FILTER_KEY, JSON.stringify({ projectIds, search }));
    } catch (cause) {
      setError(AppError.fromUnknown(cause).message);
    } finally {
      setLoading(false);
    }
  }, [period, projectIds, search]);
  useEntityChanges(() => {
    void load();
  });
  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (newRecordSignal <= 0) return;
    const timer = setTimeout(() => {
      setFormDate(anchor);
      setFormOpen(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [newRecordSignal, anchor]);
  const openCreate = (date = anchor) => {
    if (!projects.some((project) => project.status === 'active')) {
      message.warning('Crie um projeto ativo antes do primeiro registro.');
      return;
    }
    setFormDate(date);
    setFormOpen(true);
  };
  const move = (direction: -1 | 1) => setAnchor(navigatePeriod(period, direction).start);
  const periodLabel =
    mode === 'day'
      ? dayjs(period.start).format('DD [de] MMMM [de] YYYY')
      : `${dayjs(period.start).format('DD/MM/YYYY')} – ${dayjs(period.end).format('DD/MM/YYYY')}`;
  return (
    <section aria-labelledby="diary-heading">
      <div className="page-heading">
        <div>
          <h1 id="diary-heading">Diário de bordo</h1>
          <span className="muted">{periodLabel}</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
          Novo registro
        </Button>
      </div>
      <div className="toolbar" aria-label="Controles do diário">
        <Segmented
          aria-label="Período"
          value={mode}
          onChange={(value) => setMode(value as PeriodMode)}
          options={[
            { value: 'day', label: 'Dia' },
            { value: 'fortnight', label: 'Quinzena' },
            { value: 'month', label: 'Mês' },
          ]}
        />
        <Space.Compact>
          <Button aria-label="Período anterior" icon={<LeftOutlined />} onClick={() => move(-1)} />
          <DatePicker
            aria-label="Data de referência"
            value={dayjs(anchor)}
            allowClear={false}
            format="DD/MM/YYYY"
            onChange={(date) => {
              if (date) setAnchor(date.format('YYYY-MM-DD'));
            }}
          />
          <Button aria-label="Próximo período" icon={<RightOutlined />} onClick={() => move(1)} />
        </Space.Compact>
      </div>
      <div className="toolbar" style={{ marginBlock: 16 }}>
        <Select
          mode="multiple"
          allowClear
          placeholder="Filtrar projetos"
          value={projectIds}
          onChange={setProjectIds}
          style={{ minWidth: 220, flex: '1 1 260px' }}
          options={projects.map((project) => ({
            value: project.id,
            label: `${project.name}${project.status === 'archived' ? ' (arquivado)' : ''}`,
          }))}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          aria-label="Buscar nos detalhes"
          placeholder="Buscar nos detalhes"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ flex: '1 1 260px' }}
        />
        {(projectIds.length > 0 || search) && (
          <Button
            onClick={() => {
              setProjectIds([]);
              setSearch('');
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : mode === 'day' ? (
        <DailyView
          records={records}
          projects={projects}
          summary={summary}
          onOpen={setSelected}
          onCreate={() => openCreate()}
        />
      ) : mode === 'fortnight' ? (
        <FortnightView
          period={period}
          records={records}
          projects={projects}
          onOpen={setSelected}
          onCreate={openCreate}
        />
      ) : (
        <MonthlyView
          period={period}
          records={records}
          onOpenDay={(date) => {
            setAnchor(date);
            setMode('day');
          }}
        />
      )}
      <RecordForm
        open={formOpen}
        projects={projects}
        initialDate={formDate}
        onCancel={() => setFormOpen(false)}
        onSaved={async () => {
          setFormOpen(false);
          message.success('Registro salvo.');
          await load();
        }}
      />
      <RecordDetailsPanel
        record={selected}
        projects={projects}
        onClose={() => setSelected(undefined)}
        onChanged={load}
      />
    </section>
  );
}
