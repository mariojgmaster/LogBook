import { AppError } from '@/domain/errors/app-error';
import type { OptionalPermissionPort } from '@/application/ports/platform';

type ReminderPermission = 'alarms';

export class ChromeOptionalPermissionAdapter implements OptionalPermissionPort {
  async contains(permissions: readonly ReminderPermission[]): Promise<boolean> {
    try {
      return await chrome.permissions.contains({ permissions: [...permissions] });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }

  async request(permissions: readonly ReminderPermission[]): Promise<boolean> {
    try {
      return await chrome.permissions.request({ permissions: [...permissions] });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }

  async ensure(permissions: readonly ReminderPermission[]): Promise<boolean> {
    const missing: ReminderPermission[] = [];
    for (const permission of permissions) {
      if (!(await this.contains([permission]))) missing.push(permission);
    }
    if (missing.length > 0) return this.request(missing);
    return true;
  }
}
