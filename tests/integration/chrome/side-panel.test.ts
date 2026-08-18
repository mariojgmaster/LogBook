import { beforeEach, describe, expect, it } from 'vitest';
import { ChromeSidePanelAdapter } from '@/infrastructure/chrome/side-panel-adapter';

describe('ChromeSidePanelAdapter', () => {
  const adapter = new ChromeSidePanelAdapter();

  beforeEach(() => {
    (chrome as any).__windows.set(7, { id: 7, type: 'normal', focused: true });
    (chrome as any).__windows.set(8, { id: 8, type: 'popup', focused: true });
  });

  it('configures the action to open the global panel', async () => {
    await adapter.enableActionClick();
    expect(chrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it('opens and reopens in a compatible window without creating a popup', async () => {
    await adapter.open(7);
    await adapter.open(7);
    expect(chrome.sidePanel.open).toHaveBeenNthCalledWith(1, { windowId: 7 });
    expect(chrome.sidePanel.open).toHaveBeenCalledTimes(2);
    expect(chrome.windows.create).not.toHaveBeenCalled();
  });

  it('rejects incompatible windows without falling back to a main popup', async () => {
    await expect(adapter.open(8)).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(chrome.sidePanel.open).not.toHaveBeenCalled();
    expect(chrome.windows.create).not.toHaveBeenCalled();
  });

  it('persists and restores an allowlisted destination', async () => {
    await adapter.saveDestination('projects');
    expect(await adapter.getDestination()).toBe('projects');
    await chrome.storage.local.set({ 'sidepanel.destination': 'unsafe' });
    expect(await adapter.getDestination()).toBe('diary');
  });
});
