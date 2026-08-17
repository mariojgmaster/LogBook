import { describe, expect, it } from 'vitest';
import { requestSchema, responseSchema } from '@/shared/contracts/messages';
describe('message contracts', () => {
  it('accepts allowlisted request shapes', () =>
    expect(requestSchema.parse({ type: 'project.create', payload: { name: 'Projeto' } }).type).toBe(
      'project.create',
    ));
  it('rejects unknown routes and malformed payloads', () => {
    expect(requestSchema.safeParse({ type: 'admin.erase', payload: {} }).success).toBe(false);
    expect(
      requestSchema.safeParse({ type: 'record.delete', payload: { id: 'x', expectedRevision: 0 } })
        .success,
    ).toBe(false);
  });
  it('accepts only safe error envelopes', () =>
    expect(
      responseSchema.safeParse({ ok: false, error: { code: 'CONFLICT', message: 'Conflito' } })
        .success,
    ).toBe(true));
});
