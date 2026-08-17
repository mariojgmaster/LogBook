import type { CompositionRoot } from '@/application/composition-root';
import type { AppRequest } from '@/shared/contracts/messages';
import { broadcastEntityChange } from '../events';

type Request = Extract<AppRequest, { type: `reminder.${string}` }>;
export const handleReminderRequest = async (request: Request, root: CompositionRoot) => {
  if (request.type === 'reminder.snooze')
    return root.snoozeReminder.execute(request.payload, request.payload.minutes);
  if (request.type === 'reminder.reconcile') return root.reconcileReminders.execute();
  const value = await root.updateReminders.execute(
    request.payload,
    request.payload.expectedRevision,
    false,
  );
  broadcastEntityChange('reminder', 'schedule', value.schedule.revision);
  return value;
};
