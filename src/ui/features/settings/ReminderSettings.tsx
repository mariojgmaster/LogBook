import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Select,
  Switch,
  Radio,
  Space,
  Typography,
} from 'antd';
import type { ReminderScheduleProps } from '@/domain/entities/reminder-schedule';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import {
  BrowserAudioPreviewAdapter,
  type AudioPreviewAdapter,
} from '@/infrastructure/browser/audio-preview-adapter';
import { REMINDER_SOUNDS } from '@/shared/reminder-sounds';
import { useFormDraft } from '@/ui/hooks/useFormDraft';
import type { FormDraftSnapshot } from '@/application/ports/repositories';
import {
  formatDurationClock,
  parseDurationClock,
} from '@/application/services/duration-clock-codec';

type ReminderFormValues = Omit<ReminderScheduleProps, 'snoozeMinutes'> & {
  snoozeTime: string;
};

const weekdayOptions = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];
export function ReminderSettings({
  reminders,
  reminderSoundId,
  settingsRevision,
  permission,
  nextOccurrence,
  onSaved,
  onDirtyChange,
}: {
  reminders: ReminderScheduleProps;
  reminderSoundId: string;
  settingsRevision: number;
  permission: boolean;
  nextOccurrence?: { when: number; targetLocalDate: string };
  onSaved: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<ReminderFormValues>();
  const [saving, setSaving] = useState(false);
  const draftContext = useMemo(
    () => ({
      id: 'sidepanel:settings:reminders',
      surface: 'sidepanel' as const,
      formKind: 'settings' as const,
      intent: 'update' as const,
      contextKey: 'reminders',
    }),
    [],
  );
  const draft = useFormDraft<FormDraftSnapshot>({
    initial: draftContext,
    onRestore: (snapshot) => {
      if (snapshot.values.formKind === 'settings' && snapshot.values.section === 'reminders') {
        const fields = snapshot.values.fields;
        form.setFieldsValue({
          ...(fields as unknown as Partial<ReminderFormValues>),
          ...(typeof fields.snoozeTime === 'string'
            ? { snoozeTime: fields.snoozeTime }
            : typeof fields.snoozeHours === 'string'
              ? { snoozeTime: formatDurationClock(parseLegacyHours(fields.snoozeHours)) }
              : {}),
        });
      }
    },
  });
  const enabled = Form.useWatch('enabled', form);
  useEffect(() => {
    form.setFieldsValue({
      ...reminders,
      snoozeTime: formatDurationClock(reminders.snoozeMinutes),
    });
  }, [form, reminders]);
  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (values.enabled && !permission) {
        const granted = await chrome.permissions.request({ permissions: ['alarms'] });
        if (!granted) throw new Error('A permissão de alarmes não foi concedida.');
      }
      await sendAppMessage({
        type: 'reminder.update',
        payload: {
          enabled: values.enabled,
          weekdays: values.weekdays,
          times: values.times,
          snoozeMinutes: parseDurationClock(values.snoozeTime, 2880),
          expectedRevision: reminders.revision,
        },
      });
      onDirtyChange(false);
      await draft.complete();
      await onSaved();
    } catch (cause) {
      message.error(
        cause instanceof Error ? cause.message : 'Não foi possível salvar os lembretes.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card title="Lembretes">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(_, values) => {
          onDirtyChange(true);
          const fields = { ...values };
          Reflect.deleteProperty(fields, 'revision');
          draft.protect({ formKind: 'settings', section: 'reminders', fields });
        }}
      >
        {!permission && enabled && (
          <Alert
            type="warning"
            showIcon
            message="A permissão de alarmes será solicitada ao salvar."
            style={{ marginBottom: 16 }}
          />
        )}
        {enabled && permission && (
          <Alert
            type="info"
            showIcon
            message={
              nextOccurrence
                ? `Próximo lembrete: ${new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(nextOccurrence.when)}`
                : 'Nenhuma próxima ocorrência dentro da janela de programação.'
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.Item name="enabled" label="Ativar lembretes" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item
          name="weekdays"
          label="Dias da semana"
          rules={[{ required: true, message: 'Selecione ao menos um dia.' }]}
        >
          <Checkbox.Group options={weekdayOptions} />
        </Form.Item>
        <Form.Item
          name="times"
          label="Horários"
          extra="Digite no formato HH:mm e pressione Enter."
          rules={[
            { required: true, message: 'Informe ao menos um horário.' },
            {
              validator: (_, values?: string[]) =>
                !values || values.every((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
                  ? Promise.resolve()
                  : Promise.reject(new Error('Use horários no formato HH:mm.')),
            },
          ]}
        >
          <Select mode="tags" tokenSeparators={[',', ' ']} placeholder="17:30" />
        </Form.Item>
        <Form.Item
          name="snoozeTime"
          label="Adiamento padrão"
          rules={[
            { required: true },
            {
              validator: (_, value?: string) => {
                if (!value) return Promise.resolve();
                try {
                  parseDurationClock(value, 2880);
                  return Promise.resolve();
                } catch {
                  return Promise.reject(
                    new Error('Informe o adiamento no formato HH:mm, entre 00:01 e 48:00.'),
                  );
                }
              },
            },
          ]}
          extra="Use HH:mm, de 00:01 a 48:00."
        >
          <Input inputMode="numeric" autoComplete="off" placeholder="00:30" />
        </Form.Item>
        <Button type="primary" loading={saving} onClick={() => void save()}>
          Salvar lembretes
        </Button>
        <Typography.Text role="status" type={draft.state === 'failed' ? 'danger' : 'secondary'}>
          {draft.state === 'protecting'
            ? 'Protegendo rascunho…'
            : draft.state === 'failed'
              ? 'Não foi possível proteger o rascunho'
              : ''}
        </Typography.Text>
      </Form>
      <ReminderSoundPicker
        soundId={reminderSoundId}
        expectedRevision={settingsRevision}
        onSaved={onSaved}
      />
    </Card>
  );
}

const parseLegacyHours = (value: string): number => {
  const normalized = Number(value.replace(',', '.'));
  if (!Number.isFinite(normalized)) return 10;
  return Math.min(2_880, Math.max(1, Math.round(normalized * 60)));
};

const defaultPreview = new BrowserAudioPreviewAdapter();

export function ReminderSoundPicker({
  soundId,
  expectedRevision,
  onSaved,
  preview = defaultPreview,
}: {
  soundId: string;
  expectedRevision: number;
  onSaved: () => Promise<void>;
  preview?: AudioPreviewAdapter;
}) {
  const [selected, setSelected] = useState(soundId);
  const [previewError, setPreviewError] = useState<string>();
  const [savingSound, setSavingSound] = useState(false);
  const soundDraftContext = useMemo(
    () => ({
      id: 'sidepanel:settings:reminder-sound',
      surface: 'sidepanel' as const,
      formKind: 'settings' as const,
      intent: 'update' as const,
      contextKey: 'reminder-sound',
    }),
    [],
  );
  const soundDraft = useFormDraft<FormDraftSnapshot>({
    initial: soundDraftContext,
    onRestore: (snapshot) => {
      if (
        snapshot.values.formKind === 'settings' &&
        snapshot.values.section === 'reminder-sound' &&
        typeof snapshot.values.fields.reminderSoundId === 'string'
      ) {
        setSelected(snapshot.values.fields.reminderSoundId);
      }
    },
  });

  const play = async (id: string) => {
    setPreviewError(undefined);
    try {
      await preview.preview(id);
    } catch {
      setPreviewError(id);
    }
  };
  const saveSound = async () => {
    setSavingSound(true);
    try {
      await sendAppMessage({
        type: 'settings.updateReminderSound',
        payload: { soundId: selected as (typeof REMINDER_SOUNDS)[number]['id'], expectedRevision },
      });
      await soundDraft.complete();
      await onSaved();
    } finally {
      setSavingSound(false);
    }
  };

  return (
    <section aria-labelledby="reminder-sound-heading" style={{ marginTop: 24 }}>
      <Typography.Title level={5} id="reminder-sound-heading">
        Som do lembrete
      </Typography.Title>
      <Radio.Group
        value={selected}
        onChange={(event) => {
          const next = event.target.value as string;
          setSelected(next);
          soundDraft.protect({
            formKind: 'settings',
            section: 'reminder-sound',
            fields: { reminderSoundId: next },
          });
        }}
      >
        <Space orientation="vertical">
          {REMINDER_SOUNDS.map((sound) => (
            <div key={sound.id} data-testid={`sound-${sound.id}`}>
              <Radio value={sound.id}>{sound.label}</Radio>
              <Button
                type="link"
                onClick={() => void play(sound.id)}
                aria-label={`Ouvir ${sound.label}`}
              >
                Ouvir
              </Button>
              {previewError === sound.id && (
                <Typography.Text type="danger" role="alert">
                  Não foi possível reproduzir este som.
                </Typography.Text>
              )}
            </div>
          ))}
        </Space>
      </Radio.Group>
      <div style={{ marginTop: 16 }}>
        <Button type="primary" loading={savingSound} onClick={() => void saveSound()}>
          Salvar som
        </Button>
      </div>
    </section>
  );
}
