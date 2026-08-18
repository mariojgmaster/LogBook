import { AppError } from '@/domain/errors/app-error';
import type { DraftRepository, FormDraftSnapshot } from '@/application/ports/repositories';
import { requestSchema } from '@/shared/contracts/messages';
import { getDatabase, type StoredFormDraft } from './database';

interface PendingWrite {
  latest?: FormDraftSnapshot;
  promise: Promise<void>;
}

export class IndexedDbDraftRepository implements DraftRepository {
  private readonly pending = new Map<string, PendingWrite>();

  async get(id: string): Promise<FormDraftSnapshot | undefined> {
    try {
      const stored = await (await getDatabase()).get('formDrafts', id);
      return stored ? validateDraft(stored) : undefined;
    } catch (error) {
      throw draftError(error);
    }
  }

  async upsert(draft: FormDraftSnapshot): Promise<void> {
    const validated = validateDraft(draft);
    const active = this.pending.get(validated.id);
    if (active) {
      active.latest = validated;
      return active.promise;
    }

    const state = {} as PendingWrite;
    state.latest = validated;
    state.promise = this.flush(validated.id, state);
    this.pending.set(validated.id, state);
    return state.promise;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.pending.get(id)?.promise;
      await (await getDatabase()).delete('formDrafts', id);
    } catch (error) {
      throw draftError(error);
    }
  }

  private async flush(id: string, state: PendingWrite): Promise<void> {
    try {
      while (state.latest) {
        const snapshot = state.latest;
        state.latest = undefined;
        await (await getDatabase()).put('formDrafts', snapshot as StoredFormDraft);
      }
    } catch (error) {
      throw draftError(error);
    } finally {
      this.pending.delete(id);
    }
  }
}

const validateDraft = (value: StoredFormDraft | FormDraftSnapshot): FormDraftSnapshot => {
  const parsed = requestSchema.safeParse({ type: 'draft.upsert', payload: value });
  if (!parsed.success || parsed.data.type !== 'draft.upsert') {
    throw new AppError('DRAFT_UNAVAILABLE');
  }
  const draft = parsed.data.payload;
  if (!draft.id || !draft.updatedAt) throw new AppError('DRAFT_UNAVAILABLE');
  return draft as FormDraftSnapshot;
};

const draftError = (error: unknown): AppError =>
  error instanceof AppError && error.code === 'DRAFT_UNAVAILABLE'
    ? error
    : new AppError('DRAFT_UNAVAILABLE');
