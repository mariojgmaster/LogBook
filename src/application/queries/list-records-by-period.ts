import { assertPeriodLimit, type Period } from '@/domain/value-objects/period';
import type { RecordFilters, RecordQueryRepository } from '@/application/ports/repositories';
export class ListRecordsByPeriod {
  constructor(private readonly repository: RecordQueryRepository) {}
  execute(period: Period, filters?: RecordFilters) {
    assertPeriodLimit(period);
    return this.repository.list(period.start, period.end, filters);
  }
}
