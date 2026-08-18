import { describe, expect, it } from 'vitest';
import { requestSchema } from '@/shared/contracts/messages';

describe('project lifecycle messages', () => {
  const id = crypto.randomUUID();

  it.each(['project.restore', 'project.remove'] as const)(
    'accepts %s with CAS revision',
    (type) => {
      expect(requestSchema.safeParse({ type, payload: { id, expectedRevision: 2 } }).success).toBe(
        true,
      );
      expect(requestSchema.safeParse({ type, payload: { id, expectedRevision: 0 } }).success).toBe(
        false,
      );
      expect(
        requestSchema.safeParse({ type, payload: { id: 'invalid', expectedRevision: 2 } }).success,
      ).toBe(false);
    },
  );
});
