import { AppError } from '@/domain/errors/app-error';
import { requestSchema, type AppRequest, type AppResponse } from '@/shared/contracts/messages';
import type { CompositionRoot } from '@/application/composition-root';
import { handleProjectRequest } from './handlers/projects';
import { handleRecordRequest } from './handlers/records';
import { handlePeriodRequest } from './handlers/period-queries';
import { handleSettingsRequest } from './handlers/settings';
import { handleReminderRequest } from './handlers/reminders';
import { handleDraftRequest } from './handlers/drafts';

export const dispatchMessage = async (
  raw: unknown,
  sender: chrome.runtime.MessageSender,
  root: CompositionRoot,
): Promise<AppResponse> => {
  try {
    if (sender.id && sender.id !== chrome.runtime.id) throw new AppError('INVALID_MESSAGE');
    if (sender.url && !sender.url.startsWith(chrome.runtime.getURL('')))
      throw new AppError('INVALID_MESSAGE');
    const request = requestSchema.parse(raw);
    const data = await handleRequest(request, root);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: AppError.fromUnknown(error).toJSON() };
  }
};

const handleRequest = async (request: AppRequest, root: CompositionRoot): Promise<unknown> => {
  if (request.type.startsWith('project.'))
    return handleProjectRequest(
      request as Extract<AppRequest, { type: `project.${string}` }>,
      root,
    );
  if (
    request.type === 'record.create' ||
    request.type === 'record.update' ||
    request.type === 'record.delete'
  )
    return handleRecordRequest(request, root);
  if (request.type === 'record.listPeriod' || request.type === 'summary.getPeriod')
    return handlePeriodRequest(request, root);
  if (
    request.type === 'settings.get' ||
    request.type === 'settings.updateRegion' ||
    request.type === 'settings.updateMonthView' ||
    request.type === 'settings.updateReminderSound' ||
    request.type === 'holiday.coverage' ||
    request.type === 'holiday.listPeriod'
  )
    return handleSettingsRequest(request, root);
  if (
    request.type === 'draft.get' ||
    request.type === 'draft.upsert' ||
    request.type === 'draft.delete'
  )
    return handleDraftRequest(request, root);
  return handleReminderRequest(
    request as Extract<AppRequest, { type: `reminder.${string}` }>,
    root,
  );
};
