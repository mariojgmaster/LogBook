// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { WorkdaySettings } from '@/ui/features/settings/WorkdaySettings';
describe('settings page sections', () => {
  it('explains immutable workday rules', () => {
    render(
      <ConfigProvider>
        <WorkdaySettings />
      </ConfigProvider>,
    );
    expect(screen.getByText('8 horas por dia')).toBeVisible();
    expect(screen.getByText('Extra 100%')).toBeVisible();
  });
});
