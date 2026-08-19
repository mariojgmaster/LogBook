import type { CompositionRoot } from '@/application/composition-root';
import type { FormDraftSnapshot } from '@/application/ports/repositories';
import type { AppRequest } from '@/shared/contracts/messages';
import { broadcastEntityChange } from '../events';

type Request = Extract<AppRequest, { type: 'draft.get' | 'draft.upsert' | 'draft.delete' }>;

export const handleDraftRequest = async (request: Request, root: CompositionRoot) => {
  const id = request.payload.id ?? draftId(request.payload);
  if (request.type === 'draft.get') return (await root.repositories.drafts.get(id)) ?? null;
  if (request.type === 'draft.delete') {
    await root.repositories.drafts.delete(id);
    broadcastEntityChange('draft', id, Date.now());
    return null;
  }
  const draft = {
    ...request.payload,
    id,
    updatedAt: root.clock.now().toISOString(),
  } as FormDraftSnapshot;
  await root.repositories.drafts.upsert(draft);
  broadcastEntityChange('draft', id, Math.max(1, Date.now()));
  return { id, updatedAt: draft.updatedAt };
};

const draftId = (context: Request['payload']) =>
  [context.surface, context.formKind, context.intent, context.entityId, context.contextKey]
    .filter(Boolean)
    .join(':');
