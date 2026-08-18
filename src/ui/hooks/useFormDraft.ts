import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormDraftSnapshot } from '@/application/ports/repositories';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';

export type DraftProtectionState = 'idle' | 'protecting' | 'saved' | 'failed';

export interface FormDraftClient {
  get(id: string): Promise<FormDraftSnapshot | undefined>;
  upsert(draft: FormDraftSnapshot): Promise<void>;
  delete(id: string): Promise<void>;
}

const activeFlushes = new Set<() => Promise<void>>();
export const flushFormDrafts = () => Promise.all([...activeFlushes].map((flush) => flush()));

const messageClient: FormDraftClient = {
  get: async (id) =>
    (await sendAppMessage<FormDraftSnapshot | null>({
      type: 'draft.get',
      payload: draftContextFromId(id),
    })) ?? undefined,
  upsert: async (draft) => {
    await sendAppMessage({ type: 'draft.upsert', payload: draft });
  },
  delete: async (id) => {
    await sendAppMessage({ type: 'draft.delete', payload: draftContextFromId(id) });
  },
};

export function useFormDraft<T extends FormDraftSnapshot>({
  initial,
  client = messageClient,
  onRestore,
}: {
  initial: Omit<T, 'values' | 'updatedAt'>;
  client?: FormDraftClient;
  onRestore?: (draft: T) => void;
}) {
  const [state, setState] = useState<DraftProtectionState>('idle');
  const pending = useRef<T | undefined>(undefined);
  const running = useRef<Promise<void> | undefined>(undefined);
  const mounted = useRef(true);
  const lastConfirmed = useRef<T | undefined>(undefined);
  const restoreCallback = useRef(onRestore);

  useEffect(() => {
    restoreCallback.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    mounted.current = true;
    void client
      .get(initial.id)
      .then((draft) => {
        if (draft && mounted.current) {
          lastConfirmed.current = draft as T;
          restoreCallback.current?.(draft as T);
          setState('saved');
        }
      })
      .catch(() => mounted.current && setState('failed'));
    return () => {
      mounted.current = false;
    };
  }, [client, initial.id]);

  const drain = useCallback(async () => {
    try {
      while (pending.current) {
        const snapshot = pending.current;
        pending.current = undefined;
        await client.upsert(snapshot);
        lastConfirmed.current = snapshot;
      }
      if (mounted.current) setState('saved');
    } catch {
      if (mounted.current) setState('failed');
      throw new Error('DRAFT_UNAVAILABLE');
    } finally {
      running.current = undefined;
    }
  }, [client]);

  const protect = useCallback(
    (values: T['values']) => {
      pending.current = {
        ...initial,
        values,
        updatedAt: new Date().toISOString(),
      } as T;
      if (mounted.current) setState('protecting');
      running.current ??= drain();
      void running.current.catch(() => undefined);
    },
    [drain, initial],
  );

  const flush = useCallback(async () => {
    if (pending.current && !running.current) running.current = drain();
    await running.current;
  }, [drain]);

  const complete = useCallback(async () => {
    await flush();
    try {
      await client.delete(initial.id);
      lastConfirmed.current = undefined;
      if (mounted.current) setState('idle');
      return { saved: true, cleanupPending: false } as const;
    } catch {
      if (mounted.current) setState('failed');
      return { saved: true, cleanupPending: true } as const;
    }
  }, [client, flush, initial.id]);

  useEffect(() => {
    activeFlushes.add(flush);
    return () => {
      activeFlushes.delete(flush);
    };
  }, [flush]);

  return { state, protect, flush, complete, lastConfirmed };
}

const draftContextFromId = (id: string) => {
  const [surface, formKind, intentOrContext, ...rest] = id.split(':');
  const intent = ['create', 'edit', 'update'].includes(intentOrContext ?? '')
    ? (intentOrContext as 'create' | 'edit' | 'update')
    : formKind === 'settings' || formKind === 'snooze'
      ? 'update'
      : 'create';
  const contextKey = rest.join(':') || intentOrContext || 'default';
  return {
    id,
    surface: surface as 'sidepanel' | 'reminder',
    formKind: formKind as 'record' | 'project' | 'settings' | 'snooze',
    intent,
    contextKey,
  };
};
