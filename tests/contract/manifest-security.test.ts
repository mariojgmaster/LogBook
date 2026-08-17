import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8')) as Record<string, any>;
describe('manifest security', () => {
  it('uses MV3 and a local module worker', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.minimum_chrome_version).toBe('120');
    expect(manifest.background).toEqual({ service_worker: 'service-worker.js', type: 'module' });
  });
  it('keeps permissions minimal and alarms optional', () => {
    expect(manifest.permissions).toEqual(['storage']);
    expect(manifest.optional_permissions).toEqual(['alarms']);
    expect(manifest.host_permissions).toBeUndefined();
  });
  it('forbids remote scripts and toolbar popup', () => {
    expect(manifest.content_security_policy.extension_pages).toBe(
      "script-src 'self'; object-src 'none';",
    );
    expect(manifest.action.default_popup).toBeUndefined();
  });
});
