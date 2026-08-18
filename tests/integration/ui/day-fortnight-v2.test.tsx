// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { DailyView } from '@/ui/features/dashboard/DailyView';
import { FortnightView } from '@/ui/features/dashboard/FortnightView';
import type { ClipboardPort } from '@/application/ports/platform';
import type { LogRecordProps } from '@/domain/entities/log-record';

const project = {
  id: 'project-1',
  name: 'Projeto Alpha',
  normalizedName: 'projeto alpha',
  status: 'active' as const,
  colorSlot: 2,
  revision: 1,
  createdAt: '2026-08-17T12:00:00.000Z',
  updatedAt: '2026-08-17T12:00:00.000Z',
};
const record: LogRecordProps = {
  id: 'record-1',
  projectId: project.id,
  localDate: '2026-08-17',
  endLocalDate: '2026-08-17',
  startMinute: 480,
  endMinute: 540,
  durationMinutes: 60,
  details: 'Descrição para copiar',
  revision: 1,
  createdAt: '2026-08-17T12:00:00.000Z',
  updatedAt: '2026-08-17T12:00:00.000Z',
};

describe('day and fortnight v2', () => {
  afterEach(cleanup);
  it('copies only details by pointer or keyboard without opening the record and announces outcomes', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error());
    const clipboard: ClipboardPort = { writeText };
    render(
      <ConfigProvider>
        <DailyView
          records={[record]}
          projects={[project]}
          onOpen={onOpen}
          onCreate={vi.fn()}
          clipboard={clipboard}
        />
      </ConfigProvider>,
    );
    const copy = screen.getByRole('button', { name: 'Copiar descrição de Projeto Alpha' });
    await user.click(copy);
    expect(writeText).toHaveBeenLastCalledWith(record.details);
    expect(onOpen).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('Descrição copiada');

    copy.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(onOpen).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível copiar');
  });

  it('renders empty fortnight days compactly and keeps filled days actionable', () => {
    render(
      <ConfigProvider>
        <FortnightView
          period={{ start: '2026-08-17', end: '2026-08-18', mode: 'fortnight' }}
          records={[record]}
          projects={[project]}
          onOpen={vi.fn()}
          onCreate={vi.fn()}
        />
      </ConfigProvider>,
    );
    expect(screen.getByText('Sem registros')).toBeVisible();
    expect(screen.queryAllByRole('button', { name: 'Registrar atividade' })).toHaveLength(0);
    expect(screen.getByText(record.details)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Detalhes' })).toBeVisible();
  });
});
