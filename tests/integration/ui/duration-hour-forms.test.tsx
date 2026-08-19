// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { RecordForm } from '@/ui/features/records/RecordForm';
import { SnoozeForm } from '@/ui/features/records/SnoozeForm';

const project = {
  id: crypto.randomUUID(),
  name: 'Projeto',
  normalizedName: 'projeto',
  status: 'active' as const,
  colorSlot: 0,
  revision: 1,
  createdAt: '2026-08-17T12:00:00.000Z',
  updatedAt: '2026-08-17T12:00:00.000Z',
};
const record = {
  id: crypto.randomUUID(),
  projectId: project.id,
  localDate: '2026-08-16',
  startMinute: 480,
  endLocalDate: '2026-08-16',
  endMinute: 510,
  durationMinutes: 30,
  details: 'Atividade',
  revision: 1,
  createdAt: '2026-08-16T12:00:00.000Z',
  updatedAt: '2026-08-16T12:00:00.000Z',
};

describe('duration hour forms', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.stubGlobal('close', vi.fn());
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (request: { type?: string }) => ({
        ok: true,
        data: request.type === 'draft.get' ? undefined : {},
      }),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows an existing record in hours and submits integer minutes', async () => {
    const user = userEvent.setup();
    render(
      <ConfigProvider>
        <App>
          <RecordForm
            open
            projects={[project]}
            record={record}
            initialDate={record.localDate}
            onCancel={vi.fn()}
            onSaved={vi.fn(async () => undefined)}
          />
        </App>
      </ConfigProvider>,
    );
    await user.click(screen.getByRole('radio', { name: /Duração/ }));
    const duration = screen.getByLabelText('Duração (horas)');
    await user.clear(duration);
    await user.type(duration, '0,5');
    await user.click(screen.getByRole('button', { name: 'Salvar registro' }));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'record.update',
        payload: expect.objectContaining({
          record: expect.objectContaining({ durationMinutes: 30 }),
        }),
      }),
    );
  });

  it('defaults new records to a lunch break and removes the obsolete details hint', () => {
    render(
      <ConfigProvider>
        <App>
          <RecordForm
            open
            projects={[project]}
            initialDate="2026-08-17"
            onCancel={vi.fn()}
            onSaved={vi.fn(async () => undefined)}
          />
        </App>
      </ConfigProvider>,
    );
    expect(screen.getByRole('switch', { name: 'Sem hora de almoço?' })).not.toBeChecked();
    expect(screen.getByLabelText('Início')).toHaveValue('08:00');
    expect(screen.getByLabelText('Fim')).toHaveValue('17:00');
    expect(
      screen.queryByText('Campo obrigatório. Não há campo de título.'),
    ).not.toBeInTheDocument();
  });

  it('submits an informational event without time fields', async () => {
    const user = userEvent.setup();
    render(
      <ConfigProvider>
        <App>
          <RecordForm
            open
            projects={[project]}
            template={record}
            initialDate="2026-08-17"
            onCancel={vi.fn()}
            onSaved={vi.fn(async () => undefined)}
          />
        </App>
      </ConfigProvider>,
    );
    await user.click(screen.getByRole('switch', { name: 'É evento?' }));
    expect(screen.queryByLabelText('Início')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Detalhes'));
    await user.type(screen.getByLabelText('Detalhes'), 'Evento da equipe');
    await user.click(screen.getByRole('button', { name: 'Salvar registro' }));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'record.create',
      payload: {
        projectId: project.id,
        localDate: record.localDate,
        isEvent: true,
        details: 'Evento da equipe',
      },
    });
  });

  it('uses a template to clone as a new record', async () => {
    const user = userEvent.setup();
    render(
      <ConfigProvider>
        <App>
          <RecordForm
            open
            projects={[project]}
            template={record}
            initialDate={record.localDate}
            onCancel={vi.fn()}
            onSaved={vi.fn(async () => undefined)}
          />
        </App>
      </ConfigProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Clonar registro');
    await user.click(screen.getByRole('button', { name: 'Salvar registro' }));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'record.create' }),
    );
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'record.update' }),
    );
  });

  it('keeps invalid hour text from reaching persistence', async () => {
    const user = userEvent.setup();
    render(
      <ConfigProvider>
        <App>
          <RecordForm
            open
            projects={[project]}
            record={record}
            initialDate={record.localDate}
            onCancel={vi.fn()}
            onSaved={vi.fn(async () => undefined)}
          />
        </App>
      </ConfigProvider>,
    );
    await user.click(screen.getByRole('radio', { name: /Duração/ }));
    const duration = screen.getByLabelText('Duração (horas)');
    await user.clear(duration);
    await user.type(duration, '0,0166');
    await user.click(screen.getByRole('button', { name: 'Salvar registro' }));
    expect(screen.getByText(/duração em horas válida/)).toBeVisible();
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'record.update' }),
    );
  });

  it('converts a custom snooze clock value to minutes only on submit', async () => {
    const user = userEvent.setup();
    render(
      <ConfigProvider>
        <App>
          <SnoozeForm targetLocalDate="2026-08-17" slotId="morning" />
        </App>
      </ConfigProvider>,
    );
    const duration = await screen.findByLabelText('Personalizado');
    await user.clear(duration);
    await user.type(duration, '00:30');
    await user.click(screen.getByRole('button', { name: /^Adiar$/ }));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'reminder.snooze',
      payload: expect.objectContaining({ minutes: 30 }),
    });
  });
});
