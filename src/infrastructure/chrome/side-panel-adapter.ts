import { AppError } from '@/domain/errors/app-error';
import type { SidePanelPort } from '@/application/ports/platform';

const DESTINATION_KEY = 'sidepanel.destination';
const DESTINATIONS = ['diary', 'projects', 'settings'] as const;
export type SidePanelDestination = (typeof DESTINATIONS)[number];

export class ChromeSidePanelAdapter implements SidePanelPort {
  async enableActionClick(): Promise<void> {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }

  async open(windowId?: number): Promise<void> {
    try {
      if (windowId === undefined) throw new AppError('VALIDATION');
      const target = await chrome.windows.get(windowId);
      if (target.type !== 'normal') throw new AppError('VALIDATION');
      await chrome.sidePanel.open({ windowId });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }

  async getDestination(): Promise<SidePanelDestination> {
    const stored = await chrome.storage.local.get(DESTINATION_KEY);
    const value: unknown = stored[DESTINATION_KEY];
    return typeof value === 'string' && isDestination(value) ? value : 'diary';
  }

  async saveDestination(destination: SidePanelDestination): Promise<void> {
    if (!DESTINATIONS.includes(destination)) throw new AppError('VALIDATION');
    await chrome.storage.local.set({ [DESTINATION_KEY]: destination });
  }
}

const isDestination = (value: string): value is SidePanelDestination =>
  DESTINATIONS.some((destination) => destination === value);
