import { assertPeriodLimit, type Period } from '@/domain/value-objects/period';
import type { RecordFilters, RecordQueryRepository } from '@/application/ports/repositories';
import { AppError } from '@/domain/errors/app-error';
export class ListRecordsByPeriod {
  constructor(private readonly repository: RecordQueryRepository) {}
  execute(period: Period, filters?: RecordFilters) {
    assertPeriodLimit(period);
    if (
      filters?.projectIds?.some(
        (id) =>
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
      ) ||
      (filters?.search?.length ?? 0) > 2_000 ||
      (filters?.limit !== undefined && (!Number.isInteger(filters.limit) || filters.limit < 1))
    ) {
      throw new AppError('VALIDATION');
    }
    return this.repository.list(period.start, period.end, filters);
  }
}
