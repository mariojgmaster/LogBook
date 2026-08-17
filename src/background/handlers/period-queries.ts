import type { CompositionRoot } from '@/application/composition-root';
import type { AppRequest } from '@/shared/contracts/messages';

type Request = Extract<AppRequest, { type: 'record.listPeriod' | 'summary.getPeriod' }>;
export const handlePeriodRequest = async (request: Request, root: CompositionRoot) => {
  if (request.type === 'record.listPeriod') {
    return root.listRecords.execute(request.payload, {
      projectIds: request.payload.projectIds,
      search: request.payload.search,
    });
  }
  await root.holidays.initialize();
  return root.getSummary.execute(request.payload);
};
