import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('extension entry packaging v2', () => {
  it.each([
    ['sidepanel.html', '/src/ui/sidepanel-main.tsx'],
    ['reminder.html', '/src/ui/reminder-main.tsx'],
    ['audio.html', '/src/offscreen/audio-main.ts'],
  ])('packages %s with its local entry module', (htmlPath, entryPath) => {
    const html = read(htmlPath);
    expect(html).toContain(`src="${entryPath}"`);
    expect(html).not.toMatch(/https?:\/\//u);
    expect(html).not.toMatch(/<script(?![^>]*type="module")/u);
  });

  it('declares only the three pages and service worker as Vite inputs', () => {
    const config = read('vite.config.ts');
    expect(config).toContain("sidepanel: path.resolve(import.meta.dirname, 'sidepanel.html')");
    expect(config).toContain("reminder: path.resolve(import.meta.dirname, 'reminder.html')");
    expect(config).toContain("audio: path.resolve(import.meta.dirname, 'audio.html')");
    expect(config).not.toContain("app: path.resolve(import.meta.dirname, 'index.html')");
  });
});
