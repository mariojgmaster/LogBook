import { SnoozeWindowApp } from './app/SnoozeWindowApp';
import { mountReactApp } from './bootstrap';

document.body.classList.add('snooze-body');
mountReactApp(SnoozeWindowApp);
