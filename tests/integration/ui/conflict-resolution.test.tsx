// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { ConflictDialog } from '@/ui/components/ConflictDialog';
describe('conflict dialog', () => {
  it('shows differences and explicit recovery choices', () => {
    const reload = vi.fn();
    const reapply = vi.fn();
    render(
      <ConfigProvider>
        <ConflictDialog
          open
          local={{ details: 'meu' }}
          current={{ details: 'atual' }}
          onReload={reload}
          onReapply={reapply}
          onCancel={vi.fn()}
        />
      </ConfigProvider>,
    );
    expect(screen.getByText(/Nenhum dado foi sobrescrito/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar versão atual', hidden: true }));
    expect(reload).toHaveBeenCalled();
  });
});
