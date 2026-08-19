import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8')) as Record<string, any>;

describe('v2 extension manifest', () => {
  it('declares the global side panel and no toolbar popup', () => {
    expect(manifest.side_panel).toEqual({ default_path: 'sidepanel.html' });
    expect(manifest.action.default_popup).toBeUndefined();
  });

  it('declares packaged icons for the extension and toolbar action', () => {
    expect(manifest.icons).toEqual({
      16: 'icons/logbook-16.png',
      32: 'icons/logbook-32.png',
      48: 'icons/logbook-48.png',
      128: 'icons/logbook-128.png',
    });
    expect(manifest.action.default_icon).toEqual({
      16: 'icons/logbook-16.png',
      32: 'icons/logbook-32.png',
    });
  });

  it('uses only the required and optional capabilities in the platform contract', () => {
    expect(manifest.permissions).toEqual(['storage', 'sidePanel', 'offscreen']);
    expect(manifest.optional_permissions).toEqual(['alarms']);
    expect(manifest.host_permissions).toBeUndefined();
  });
});
