import { useCallback, useEffect, useState } from 'react';
import { App as AntApp, Spin } from 'antd';
import type { ReminderScheduleProps } from '@/domain/entities/reminder-schedule';
import type { UserSettingsProps } from '@/domain/entities/user-settings';
import { AppError } from '@/domain/errors/app-error';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { ErrorState } from '@/ui/components/AsyncState';
import { SnoozeForm } from '@/ui/features/records/SnoozeForm';
import { RegionSettings } from './RegionSettings';
import { ReminderSettings } from './ReminderSettings';
import { WorkdaySettings } from './WorkdaySettings';

interface SettingsView {
  user: UserSettingsProps;
  reminders: ReminderScheduleProps;
  coverage?: { minYear: number; maxYear: number; revision: string };
  permission: boolean;
  nextOccurrence?: { when: number; targetLocalDate: string };
}
export function SettingsPage({
  reminderContext,
}: {
  reminderContext?: { targetLocalDate: string; slotId: string };
}) {
  const { message } = AntApp.useApp();
  const [data, setData] = useState<SettingsView>();
  const [error, setError] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const load = useCallback(async () => {
    try {
      const values = await sendAppMessage<SettingsView>({ type: 'settings.get', payload: {} });
      setError(undefined);
      setData(values);
    } catch (cause) {
      setError(AppError.fromUnknown(cause).message);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    addEventListener('beforeunload', guard);
    return () => removeEventListener('beforeunload', guard);
  }, [dirty]);
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <Spin fullscreen tip="Carregando configurações" />;
  const saved = async () => {
    message.success('Configuração salva.');
    await load();
  };
  return (
    <section aria-labelledby="settings-heading">
      <div className="page-heading">
        <div>
          <h1 id="settings-heading">Configurações</h1>
          <span className="muted">Cada seção é salva independentemente.</span>
        </div>
      </div>
      <div className="settings-stack">
        {reminderContext && (
          <SnoozeForm
            targetLocalDate={reminderContext.targetLocalDate}
            slotId={reminderContext.slotId}
          />
        )}
        <RegionSettings
          settings={data.user}
          coverage={data.coverage}
          onSaved={saved}
          onDirtyChange={setDirty}
        />
        <WorkdaySettings />
        <ReminderSettings
          reminders={data.reminders}
          permission={data.permission}
          nextOccurrence={data.nextOccurrence}
          onSaved={saved}
          onDirtyChange={setDirty}
        />
      </div>
    </section>
  );
}
