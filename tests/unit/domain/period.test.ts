import { describe, expect, it } from 'vitest';
import { navigatePeriod, periodFor } from '@/domain/value-objects/period';
describe('periods', () => {
  it('builds fixed fortnights', () => {
    expect(periodFor('2026-02-03', 'fortnight')).toMatchObject({
      start: '2026-02-01',
      end: '2026-02-15',
    });
    expect(periodFor('2024-02-20', 'fortnight')).toMatchObject({
      start: '2024-02-16',
      end: '2024-02-29',
    });
  });
  it('navigates across months', () =>
    expect(navigatePeriod(periodFor('2026-01-20', 'fortnight'), 1).start).toBe('2026-02-01'));
});
