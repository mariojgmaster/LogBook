import type { RecordRepository } from '@/application/ports/repositories';
export class DeleteRecord {
  constructor(private readonly records: RecordRepository) {}
  execute(id: string, expectedRevision: number) {
    return this.records.delete(id, expectedRevision);
  }
}
