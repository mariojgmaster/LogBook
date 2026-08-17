import type { HolidayProvider, RecordRepository } from '@/application/ports/repositories';
import { classifyHours } from '@/domain/services/hour-classifier';
import { assertPeriodLimit, type Period } from '@/domain/value-objects/period';
export class GetHourSummary {
  constructor(
    private readonly records: RecordRepository,
    private readonly holidays: HolidayProvider,
  ) {}
  async execute(period: Period) {
    assertPeriodLimit(period);
    return classifyHours(await this.records.listRange(period.start, period.end), this.holidays);
  }
}
