// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { NoticeCalendar } from '@/ui/features/dashboard/NoticeCalendar';
import { EventRangeCalendar } from '@/ui/features/dashboard/EventRangeCalendar';
import { MonthlyView } from '@/ui/features/dashboard/MonthlyView';
import type { LogRecordProps } from '@/domain/entities/log-record';
import { MonthViewSettings } from '@/ui/features/settings/MonthViewSettings';

const projects = [
  {
    id: 'project-a',
    name: 'Projeto Azul',
    normalizedName: 'projeto azul',
    status: 'active' as const,
    colorSlot: 0,
    revision: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'project-b',
    name: 'Projeto Verde',
    normalizedName: 'projeto verde',
    status: 'active' as const,
    colorSlot: 1,
    revision: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];
const overnight: LogRecordProps = {
  id: 'record-night',
  projectId: projects[0]!.id,
  localDate: '2026-08-08',
  endLocalDate: '2026-08-09',
  startMinute: 1380,
  endMinute: 60,
  durationMinutes: 120,
  details: 'Plantão atravessando a semana',
  revision: 1,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};
const overlapping: LogRecordProps = {
  ...overnight,
  id: 'record-overlapping',
  projectId: projects[1]!.id,
  details: 'Revisão simultânea',
  createdAt: '2026-08-01T00:01:00.000Z',
};
const period = { start: '2026-08-01', end: '2026-08-31', mode: 'month' as const };
const holidays = [{ date: '2026-08-15', name: 'Feriado de teste', scope: 'state' as const }];

describe('month views v2', () => {
  afterEach(cleanup);

  it('renders Notice segments per day with project name and deterministic color', () => {
    const onCreateDate = vi.fn();
    render(
      <ConfigProvider>
        <NoticeCalendar
          period={period}
          records={[overnight]}
          projects={projects}
          layout="wide"
          onOpenRecord={vi.fn()}
          onCreateDate={onCreateDate}
        />
      </ConfigProvider>,
    );
    const segments = screen.getAllByRole('button', {
      name: /Projeto Azul.*Plantão atravessando a semana/,
    });
    expect(segments).toHaveLength(2);
    expect(segments.every((item) => item.dataset.colorSlot === '0')).toBe(true);
    expect(segments[0]).toHaveTextContent('23:00–24:00 · Projeto Azul · Plantão');
    expect(segments[0]?.querySelector('.month-record-dot')).toBeInTheDocument();
    expect(screen.getByLabelText(/08 de agosto.*1 registro/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Novo registro em 08 de agosto/ }));
    expect(onCreateDate).toHaveBeenCalledWith('2026-08-08');
  });

  it('shares one Event Range identity, destination and tab stop across visual week segments', () => {
    const onOpenRecord = vi.fn();
    const onCreateDate = vi.fn();
    const { rerender } = render(
      <ConfigProvider>
        <EventRangeCalendar
          period={period}
          records={[overnight, overlapping]}
          projects={projects}
          layout="wide"
          onOpenRecord={onOpenRecord}
          onCreateDate={onCreateDate}
        />
      </ConfigProvider>,
    );
    const segments = document.querySelectorAll('[data-record-id="record-night"]');
    const overlappingSegments = document.querySelectorAll('[data-record-id="record-overlapping"]');
    expect(segments).toHaveLength(2);
    expect(overlappingSegments).toHaveLength(2);
    expect([...segments].filter((item) => item.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect((segments[0] as HTMLElement).style.getPropertyValue('--event-lane')).toBe('0');
    expect((overlappingSegments[0] as HTMLElement).style.getPropertyValue('--event-lane')).toBe(
      '1',
    );
    expect(segments[0]).toHaveClass('event-range-record--bar');
    expect(segments[0]).toHaveTextContent('Projeto Azul · Plantão');
    fireEvent.click(segments[1]!);
    expect(onOpenRecord).toHaveBeenCalledWith(overnight);
    expect(onCreateDate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Novo registro em 08 de agosto/ }));
    expect(onCreateDate).toHaveBeenCalledWith('2026-08-08');

    rerender(
      <ConfigProvider>
        <EventRangeCalendar
          period={period}
          records={[overnight, overlapping]}
          projects={projects}
          layout="narrow"
          onOpenRecord={onOpenRecord}
          onCreateDate={onCreateDate}
        />
      </ConfigProvider>,
    );
    expect(document.querySelectorAll('[data-record-id="record-night"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-record-id="record-overlapping"]')).toHaveLength(1);
  });

  it('shows project, full period and description in both record tooltips', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConfigProvider>
        <NoticeCalendar
          period={period}
          records={[overnight]}
          projects={projects}
          layout="wide"
          onOpenRecord={vi.fn()}
        />
      </ConfigProvider>,
    );
    await user.hover(screen.getAllByRole('button', { name: /Projeto Azul.*Plantão/ })[0]!);
    let tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Projeto')).toBeInTheDocument();
    expect(within(tooltip).getByText('Projeto Azul')).toBeInTheDocument();
    expect(within(tooltip).getByText('Período')).toBeInTheDocument();
    expect(within(tooltip).getByText('08/08/2026 23:00 → 09/08/2026 01:00')).toBeInTheDocument();
    expect(within(tooltip).getByText('Descrição')).toBeInTheDocument();
    expect(within(tooltip).getByText('Plantão atravessando a semana')).toBeInTheDocument();

    await user.unhover(screen.getAllByRole('button', { name: /Projeto Azul.*Plantão/ })[0]!);
    rerender(
      <ConfigProvider>
        <EventRangeCalendar
          period={period}
          records={[overnight]}
          projects={projects}
          layout="wide"
          onOpenRecord={vi.fn()}
        />
      </ConfigProvider>,
    );
    await user.hover(screen.getAllByRole('button', { name: /Projeto Azul.*Plantão/ })[0]!);
    tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Projeto Azul')).toBeInTheDocument();
    expect(within(tooltip).getByText('08/08/2026 23:00 → 09/08/2026 01:00')).toBeInTheDocument();
    expect(within(tooltip).getByText('Plantão atravessando a semana')).toBeInTheDocument();
  });

  it('shows regional holidays in both monthly modes, including dates without records', () => {
    const { rerender } = render(
      <ConfigProvider>
        <NoticeCalendar
          period={period}
          records={[overnight]}
          projects={projects}
          holidays={holidays}
          layout="wide"
          onOpenRecord={vi.fn()}
        />
      </ConfigProvider>,
    );
    expect(screen.getByText('Feriado de teste')).toBeVisible();

    rerender(
      <ConfigProvider>
        <EventRangeCalendar
          period={period}
          records={[overnight]}
          projects={projects}
          holidays={holidays}
          layout="wide"
          onOpenRecord={vi.fn()}
        />
      </ConfigProvider>,
    );
    expect(screen.getByText('Feriado de teste')).toBeVisible();
  });

  it('orchestrates the persisted mode and opens record details without changing to Day', () => {
    const onOpenRecord = vi.fn();
    const onCreateDate = vi.fn();
    render(
      <ConfigProvider>
        <MonthlyView
          period={period}
          records={[overnight]}
          projects={projects}
          mode="eventRange"
          layout="narrow"
          onOpenRecord={onOpenRecord}
          onCreateDate={onCreateDate}
        />
      </ConfigProvider>,
    );
    expect(screen.getByLabelText('Event Range mensal')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Projeto Azul.*Plantão/ }));
    expect(onOpenRecord).toHaveBeenCalledWith(overnight);
    expect(screen.queryByRole('button', { name: /Abrir dia/ })).not.toBeInTheDocument();
  });

  it('keeps an empty month interactive for creating a record on a selected day', () => {
    const onCreateDate = vi.fn();
    render(
      <ConfigProvider>
        <MonthlyView
          period={period}
          records={[]}
          projects={projects}
          mode="notice"
          layout="wide"
          onOpenRecord={vi.fn()}
          onCreateDate={onCreateDate}
        />
      </ConfigProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Novo registro em 08 de agosto/ }));
    expect(onCreateDate).toHaveBeenCalledWith('2026-08-08');
  });

  it('saves the month mode independently through the validated settings contract', async () => {
    const user = userEvent.setup();
    const sendMessage = chrome.runtime.sendMessage as ReturnType<typeof vi.fn>;
    sendMessage.mockResolvedValue({ ok: true, data: undefined });
    const onSaved = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfigProvider>
        <App>
          <MonthViewSettings
            settings={{
              revision: 4,
              updatedAt: '2026-08-01T00:00:00.000Z',
              monthViewMode: 'notice',
              reminderSoundId: 'gentle-bell',
            }}
            onSaved={onSaved}
            onDirtyChange={vi.fn()}
          />
        </App>
      </ConfigProvider>,
    );
    await user.click(screen.getByRole('radio', { name: 'Event Range' }));
    await user.click(screen.getByRole('button', { name: 'Salvar visualização' }));
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'settings.updateMonthView',
      payload: { mode: 'eventRange', expectedRevision: 4 },
    });
    expect(onSaved).toHaveBeenCalled();
  });
});
