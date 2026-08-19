// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { ProjectsPage } from '@/ui/features/projects/ProjectsPage';

const archived = {
  id: crypto.randomUUID(),
  name: 'Projeto Arquivado',
  normalizedName: 'projeto arquivado',
  status: 'archived' as const,
  colorSlot: 3,
  revision: 2,
  createdAt: '2026-08-17T12:00:00.000Z',
  updatedAt: '2026-08-17T12:00:00.000Z',
};
const scrollIntoView = vi.fn();

describe('archived projects UI', () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (request: { type: string }) => {
        if (request.type === 'project.list') return { ok: true, data: [archived] };
        if (request.type === 'project.restore') {
          return {
            ok: false,
            error: { code: 'DUPLICATE', message: 'Já existe um item com esses dados.' },
          };
        }
        if (request.type === 'project.remove') {
          return {
            ok: false,
            error: {
              code: 'PROJECT_HAS_RECORDS',
              message: 'O projeto ainda possui registros vinculados.',
            },
          };
        }
        return { ok: true, data: null };
      },
    );
  });
  afterEach(cleanup);

  it('offers restore/removal, confirms irreversible removal and keeps contextual failures', async () => {
    const user = userEvent.setup();
    render(
      <ConfigProvider>
        <App>
          <ProjectsPage />
        </App>
      </ConfigProvider>,
    );
    await user.click(await screen.findByText('Arquivados'));
    const card = await screen.findByRole('group', { name: 'Projeto Arquivado' });
    await user.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe');
    expect(card).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Remover' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Remover “Projeto Arquivado”?');
    await user.click(screen.getByRole('button', { name: 'Remover definitivamente' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('registros vinculados'),
    );
    expect(card).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
