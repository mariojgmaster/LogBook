import { useMemo, useState } from 'react';
import { Alert, Button, Card, Radio, Space } from 'antd';
import type { MonthViewMode, UserSettingsProps } from '@/domain/entities/user-settings';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { AppError } from '@/domain/errors/app-error';
import { useFormDraft } from '@/ui/hooks/useFormDraft';
import type { FormDraftSnapshot } from '@/application/ports/repositories';

export function MonthViewSettings({
  settings,
  onSaved,
  onDirtyChange,
}: {
  settings: UserSettingsProps;
  onSaved: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [mode, setMode] = useState<MonthViewMode>(settings.monthViewMode ?? 'notice');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const draftContext = useMemo(
    () => ({
      id: 'sidepanel:settings:month-view',
      surface: 'sidepanel' as const,
      formKind: 'settings' as const,
      intent: 'update' as const,
      contextKey: 'month-view',
    }),
    [],
  );
  const draft = useFormDraft<FormDraftSnapshot>({
    initial: draftContext,
    onRestore: (snapshot) => {
      if (snapshot.values.formKind === 'settings' && snapshot.values.section === 'month-view') {
        const restored = snapshot.values.fields.monthViewMode;
        if (restored === 'notice' || restored === 'eventRange') setMode(restored);
      }
    },
  });
  const change = (value: MonthViewMode) => {
    setMode(value);
    setError(undefined);
    onDirtyChange(true);
    draft.protect({
      formKind: 'settings',
      section: 'month-view',
      fields: { monthViewMode: value },
    });
  };
  const save = async () => {
    setSaving(true);
    try {
      await sendAppMessage({
        type: 'settings.updateMonthView',
        payload: { mode, expectedRevision: settings.revision },
      });
      await draft.complete();
      onDirtyChange(false);
      setError(undefined);
      await onSaved();
    } catch (cause) {
      setError(AppError.fromUnknown(cause).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card title="Visualização mensal">
      <Space orientation="vertical" size="middle">
        <Radio.Group
          aria-label="Modo da visualização mensal"
          value={mode}
          onChange={(event) => change(event.target.value as MonthViewMode)}
        >
          <Radio value="notice">Notice Calendar</Radio>
          <Radio value="eventRange">Event Range</Radio>
        </Radio.Group>
        <span className="field-help">
          Notice organiza por dia; Event Range destaca atividades que atravessam datas.
        </span>
        {error ? <Alert type="error" showIcon message={error} role="alert" /> : null}
        <Button type="primary" loading={saving} onClick={() => void save()}>
          Salvar visualização
        </Button>
      </Space>
    </Card>
  );
}
