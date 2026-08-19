import type { CompositionRoot } from '@/application/composition-root';
import type { AppRequest } from '@/shared/contracts/messages';
import { broadcastEntityChange } from '../events';

type Request = Extract<AppRequest, { type: 'record.create' | 'record.update' | 'record.delete' }>;
export const handleRecordRequest = async (request: Request, root: CompositionRoot) => {
  if (request.type === 'record.delete') {
    await root.deleteRecord.execute(request.payload.id, request.payload.expectedRevision);
    broadcastEntityChange('record', request.payload.id, request.payload.expectedRevision + 1);
    return null;
  }
  const value =
    request.type === 'record.create'
      ? await root.createRecord.execute(request.payload)
      : await root.updateRecord.execute(request.payload.id, request.payload.record);
  broadcastEntityChange('record', value.id, value.revision);
  return value;
};
