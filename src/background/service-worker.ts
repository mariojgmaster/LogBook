import { createCompositionRoot } from '@/application/composition-root';
import { dispatchMessage } from './messages';
import { attachAlarmListener, detachAlarmListener, handleAlarm } from './alarms';
import { forgetPopupWindow, openOrFocusPopupWindow } from './popup-window';

const root = createCompositionRoot();

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  void dispatchMessage(message, sender, root).then(sendResponse);
  return true;
});
chrome.action.onClicked.addListener(() => {
  void openOrFocusPopupWindow();
});
chrome.windows.onRemoved.addListener((windowId) => {
  void forgetPopupWindow(windowId);
});
chrome.runtime.onInstalled.addListener(() => {
  void root.reconcileReminders.execute();
});
chrome.runtime.onStartup.addListener(() => {
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

void root.reconcileReminders.execute();
