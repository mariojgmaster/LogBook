import { useEffect, useRef, useState } from 'react';
import { BellFilled, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Alert, App as AntApp, Button, Flex, Tooltip, Typography } from 'antd';
import { reminderOpenedEventSchema } from '@/shared/contracts/messages';
import { closeSnoozeWindow, openOrFocusSnoozeWindow } from '@/infrastructure/chrome/snooze-window';
import '@/ui/theme/reminder.css';

interface ReminderContext {
  targetLocalDate: string;
  slotId: string;
}

const readContext = (): ReminderContext | undefined => {
  const params = new URLSearchParams(location.search);
  const targetLocalDate = params.get('targetLocalDate');
  const slotId = params.get('slotId');
  return targetLocalDate && /^\d{4}-\d{2}-\d{2}$/.test(targetLocalDate) && slotId
    ? { targetLocalDate, slotId }
    : undefined;
};

export function ReminderApp() {
  const { message } = AntApp.useApp();
  const [context, setContext] = useState(readContext);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const opening = useRef<Promise<number> | undefined>(undefined);

  useEffect(() => {
    const listener = (raw: unknown) => {
      const event = reminderOpenedEventSchema.safeParse(raw);
      if (event.success) {
        void closeSnoozeWindow();
        setContext(event.data);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  const openSnooze = () => {
    if (!context || opening.current) return;
    opening.current = openOrFocusSnoozeWindow(context)
      .catch(() => {
        void message.error('Não foi possível abrir as opções de adiamento.');
        return -1;
      })
      .finally(() => {
        opening.current = undefined;
      });
  };
  const scheduleSnooze = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(openSnooze, 180);
  };
  const cancelScheduledSnooze = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
  };
  const closeReminder = async () => {
    await closeSnoozeWindow();
    window.close();
  };

  return (
    <main className="reminder-shell">
      <header className="reminder-toolbar">
        <Flex align="center" gap="small">
          <span className="reminder-logo" aria-hidden="true">
            L
          </span>
          <Typography.Text strong>LogBook</Typography.Text>
        </Flex>
        <BellFilled className="reminder-bell" aria-hidden="true" />
      </header>
      {context ? (
        <section className="reminder-notification" aria-labelledby="reminder-heading">
          <div className="reminder-message">
            <Typography.Title level={1} id="reminder-heading">
              Hora de atualizar o diário
            </Typography.Title>
            <Typography.Text type="secondary">
              Registre as atividades de{' '}
              <strong>{context.targetLocalDate.split('-').reverse().join('/')}</strong>.
            </Typography.Text>
          </div>
          <Flex className="reminder-actions" align="center" gap="small">
            <Tooltip title="Adiar lembrete" mouseEnterDelay={0.5}>
              <Button
                type="default"
                shape="circle"
                icon={<ClockCircleOutlined />}
                aria-label="Adiar lembrete"
                aria-haspopup="dialog"
                onMouseEnter={scheduleSnooze}
                onMouseLeave={cancelScheduledSnooze}
                onClick={() => {
                  cancelScheduledSnooze();
                  openSnooze();
                }}
              />
            </Tooltip>
            <Tooltip title="Concluir e fechar" mouseEnterDelay={0.5}>
              <Button
                type="primary"
                shape="circle"
                icon={<CheckOutlined />}
                aria-label="Fechar lembrete"
                onClick={() => void closeReminder()}
              />
            </Tooltip>
          </Flex>
        </section>
      ) : (
        <div className="reminder-invalid">
          <Alert type="error" showIcon message="Este lembrete não possui uma ocorrência válida." />
          <Button onClick={() => window.close()}>Fechar</Button>
        </div>
      )}
    </main>
  );
}
