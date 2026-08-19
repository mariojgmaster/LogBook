import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');
const sourceFiles = readdirSync('src', { recursive: true })
  .map(String)
  .filter((path) => ['.ts', '.tsx', '.css'].includes(extname(path)))
  .map((path) => join('src', path));

describe('release v2 audit', () => {
  it('contains no legacy main popup, remote code or unsafe HTML/code sinks', () => {
    expect(existsSync('index.html')).toBe(false);
    expect(existsSync(join('src', 'ui', 'main.tsx'))).toBe(false);
    const source = sourceFiles.map(read).join('\n');
    expect(source).not.toMatch(/\b(?:innerHTML|outerHTML|insertAdjacentHTML)\b/u);
    expect(source).not.toMatch(/\beval\s*\(|new\s+Function\b/u);
    expect(source).not.toMatch(/(?:import\s+.*from\s*|src=)["']https?:\/\//u);
  });

  it('keeps manifest permissions minimal and clipboard write transient', () => {
    const manifest = JSON.parse(read('manifest.json')) as Record<string, unknown>;
    expect(manifest).not.toHaveProperty('host_permissions');
    expect(manifest).not.toHaveProperty('action.default_popup');
    expect(manifest.permissions).toEqual(['storage', 'sidePanel', 'offscreen']);
    expect(manifest.optional_permissions).toEqual(['alarms']);
    expect(JSON.stringify(manifest)).not.toMatch(/clipboard(?:Read|Write)/u);
    expect(read('src/infrastructure/browser/clipboard-adapter.ts')).not.toMatch(
      /readText|execCommand/u,
    );
  });

  it('contains no visible UI duration labels in minutes or personal-data logging', () => {
    const uiSource = sourceFiles
      .filter((path) => path.includes(`${join('src', 'ui')}`))
      .map(read)
      .join('\n');
    expect(uiSource).not.toMatch(/["'`]\s*[^"'`\n]*\bminutos?\b/iu);
    const executableSource = sourceFiles
      .filter((path) => extname(path) !== '.css')
      .map(read)
      .join('\n');
    expect(executableSource).not.toMatch(/console\.(?:log|info|debug)\s*\(/u);
  });
});
