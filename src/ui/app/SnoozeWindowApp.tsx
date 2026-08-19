import { Alert, Button } from 'antd';
import { SnoozeForm } from '@/ui/features/records/SnoozeForm';
import '@/ui/theme/reminder.css';

interface SnoozeContext {
  targetLocalDate: string;
  slotId: string;
  parentWindowId: number;
}

const readContext = (): SnoozeContext | undefined => {
  const params = new URLSearchParams(location.search);
  const targetLocalDate = params.get('targetLocalDate');
  const slotId = params.get('slotId');
  const parentWindowId = Number(params.get('parentWindowId'));
  return targetLocalDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(targetLocalDate) &&
    slotId &&
    parentWindowId > 0
    ? { targetLocalDate, slotId, parentWindowId }
    : undefined;
};

export function SnoozeWindowApp() {
  const context = readContext();
  const closeReminderFamily = async () => {
    if (context) await chrome.windows.remove(context.parentWindowId).catch(() => undefined);
    window.close();
  };

  return (
    <main className="snooze-window-shell">
      {context ? (
        <SnoozeForm
          targetLocalDate={context.targetLocalDate}
          slotId={context.slotId}
          onCompleted={closeReminderFamily}
        />
      ) : (
        <div className="reminder-invalid">
          <Alert type="error" showIcon message="Não foi possível abrir as opções de adiamento." />
          <Button onClick={() => window.close()}>Fechar</Button>
        </div>
      )}
    </main>
  );
}
