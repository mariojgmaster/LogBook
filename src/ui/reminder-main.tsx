import { ReminderApp } from './app/ReminderApp';
import { mountReactApp } from './bootstrap';

document.body.classList.add('reminder-body');
mountReactApp(ReminderApp);
