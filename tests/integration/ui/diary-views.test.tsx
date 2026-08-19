// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { DailyView } from '@/ui/features/dashboard/DailyView';
import type { LogRecordProps } from '@/domain/entities/log-record';
const project = {
  id: 'p',
  name: 'Projeto',
  normalizedName: 'projeto',
  status: 'active' as const,
  revision: 1,
  createdAt: 'x',
  updatedAt: 'x',
};
const record: LogRecordProps = {
  id: 'r',
  projectId: 'p',
  localDate: '2026-08-17',
  startMinute: 480,
  endMinute: 540,
  durationMinutes: 60,
  details: 'Detalhes',
  revision: 1,
  createdAt: 'x',
  updatedAt: 'x',
};
describe('diary views', () => {
  it('renders actionable empty state', () => {
    render(
      <ConfigProvider>
        <DailyView records={[]} projects={[project]} onOpen={vi.fn()} onCreate={vi.fn()} />
      </ConfigProvider>,
    );
    expect(screen.getByRole('button', { name: 'Registrar atividade' })).toBeVisible();
  });
  it('renders project, details and stable time', () => {
    render(
      <ConfigProvider>
        <DailyView records={[record]} projects={[project]} onOpen={vi.fn()} onCreate={vi.fn()} />
      </ConfigProvider>,
    );
    expect(screen.getByText('Projeto')).toBeVisible();
    expect(screen.getByText('08:00–09:00')).toBeVisible();
  });
  it('renders events without time or duration', () => {
    render(
      <ConfigProvider>
        <DailyView
          records={[{ ...record, isEvent: true, startMinute: 0, endMinute: 0, durationMinutes: 0 }]}
          projects={[project]}
          onOpen={vi.fn()}
          onCreate={vi.fn()}
        />
      </ConfigProvider>,
    );
    expect(screen.getByText('Evento')).toBeVisible();
    expect(screen.getByText('Informativo')).toBeVisible();
    expect(screen.queryByText('00:00–00:00')).not.toBeInTheDocument();
  });
});
