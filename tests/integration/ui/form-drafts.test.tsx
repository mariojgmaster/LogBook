// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFormDraft, type FormDraftClient } from '@/ui/hooks/useFormDraft';
import { buildProjectDraft } from '../../fixtures/storage-v2';

const initial = (() => {
  const draft = buildProjectDraft();
  return {
    id: draft.id,
    surface: draft.surface,
    formKind: draft.formKind,
    intent: draft.intent,
    contextKey: draft.contextKey,
  };
})();

describe('useFormDraft', () => {
  it('writes immediately with one request in flight and only the latest pending snapshot', async () => {
    let release!: () => void;
    const firstWrite = new Promise<void>((resolve) => {
      release = resolve;
    });
    const upsert = vi.fn().mockReturnValueOnce(firstWrite).mockResolvedValue(undefined);
    const client: FormDraftClient = {
      get: vi.fn(async () => undefined),
      upsert,
      delete: vi.fn(async () => undefined),
    };
    const { result } = renderHook(() => useFormDraft({ initial, client }));
    act(() => {
      result.current.protect({ formKind: 'project', name: 'A' });
      result.current.protect({ formKind: 'project', name: 'AB' });
      result.current.protect({ formKind: 'project', name: 'ABC' });
    });
    expect(upsert).toHaveBeenCalledTimes(1);
    release();
    await act(async () => result.current.flush());
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ values: { formKind: 'project', name: 'ABC' } }),
    );
    expect(result.current.state).toBe('saved');
  });

  it('restores the confirmed snapshot and keeps it when external close occurs during a write', async () => {
    const confirmed = buildProjectDraft({ values: { formKind: 'project', name: 'Confirmado' } });
    let release!: () => void;
    const client: FormDraftClient = {
      get: vi.fn(async () => confirmed as any),
      upsert: vi.fn(
        async () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      ),
      delete: vi.fn(async () => undefined),
    };
    const restored = vi.fn();
    const { result, unmount } = renderHook(() =>
      useFormDraft({ initial, client, onRestore: restored }),
    );
    await waitFor(() => expect(restored).toHaveBeenCalledWith(confirmed));
    act(() => result.current.protect({ formKind: 'project', name: 'Novo' }));
    unmount();
    release();
    await Promise.resolve();
    expect(result.current.lastConfirmed.current).toEqual(confirmed);
  });

  it('reports failure and distinguishes saved data from pending draft cleanup', async () => {
    const client: FormDraftClient = {
      get: vi.fn(async () => undefined),
      upsert: vi.fn(async () => undefined),
      delete: vi.fn(async () => Promise.reject(new Error('quota'))),
    };
    const { result } = renderHook(() => useFormDraft({ initial, client }));
    act(() => result.current.protect({ formKind: 'project', name: 'Salvo' }));
    await act(async () => result.current.flush());
    await expect(result.current.complete()).resolves.toEqual({
      saved: true,
      cleanupPending: true,
    });
    await waitFor(() => expect(result.current.state).toBe('failed'));
  });
});
