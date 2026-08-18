import { createCompositionRoot } from '@/application/composition-root';
import { dispatchMessage } from './messages';
import { attachAlarmListener, detachAlarmListener, handleAlarm } from './alarms';
import { forgetReminderWindow } from './popup-window';
import { forgetSnoozeWindow } from '@/infrastructure/chrome/snooze-window';

const root = createCompositionRoot();

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  void dispatchMessage(message, sender, root).then(sendResponse);
  return true;
});
chrome.windows.onRemoved.addListener((windowId) => {
  void forgetReminderWindow(windowId);
  void forgetSnoozeWindow(windowId);
});
chrome.runtime.onInstalled.addListener(() => {
  void root.sidePanel.enableActionClick().catch(() => undefined);
  void root.reconcileReminders.execute();
});
chrome.runtime.onStartup.addListener(() => {
  void root.sidePanel.enableActionClick().catch(() => undefined);
  void root.reconcileReminders.execute();
});
const onAlarm = (alarm: chrome.alarms.Alarm) => {
  void handleAlarm(alarm, root);
};
chrome.permissions.onAdded.addListener((permissions) => {
  if (permissions.permissions?.includes('alarms')) {
    attachAlarmListener(chrome.alarms, onAlarm);
    void root.reconcileReminders.execute();
  }
});
chrome.permissions.onRemoved.addListener((permissions) => {
  if (permissions.permissions?.includes('alarms')) {
    detachAlarmListener(chrome.alarms, onAlarm);
    void root.reconcileReminders.execute();
  }
});
attachAlarmListener(chrome.alarms, onAlarm);

void root.sidePanel.enableActionClick().catch(() => undefined);
void root.reconcileReminders.execute();
