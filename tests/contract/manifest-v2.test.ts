import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8')) as Record<string, any>;

describe('v2 extension manifest', () => {
  it('declares the global side panel and no toolbar popup', () => {
    expect(manifest.side_panel).toEqual({ default_path: 'sidepanel.html' });
    expect(manifest.action.default_popup).toBeUndefined();
  });

  it('uses only the required and optional capabilities in the platform contract', () => {
    expect(manifest.permissions).toEqual(['storage', 'sidePanel', 'offscreen']);
    expect(manifest.optional_permissions).toEqual(['alarms']);
    expect(manifest.host_permissions).toBeUndefined();
  });
});
