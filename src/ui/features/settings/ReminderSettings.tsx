import { useEffect, useState } from 'react';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Checkbox,
  Form,
  InputNumber,
  Select,
  Switch,
} from 'antd';
import type { ReminderScheduleProps } from '@/domain/entities/reminder-schedule';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';

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
  permission,
  nextOccurrence,
  onSaved,
  onDirtyChange,
}: {
  reminders: ReminderScheduleProps;
  permission: boolean;
  nextOccurrence?: { when: number; targetLocalDate: string };
  onSaved: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<ReminderScheduleProps>();
  const [saving, setSaving] = useState(false);
  const enabled = Form.useWatch('enabled', form);
  useEffect(() => {
    form.setFieldsValue(reminders);
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
          snoozeMinutes: values.snoozeMinutes,
          expectedRevision: reminders.revision,
        },
      });
      onDirtyChange(false);
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
      <Form form={form} layout="vertical" onValuesChange={() => onDirtyChange(true)}>
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
          name="snoozeMinutes"
          label="Adiamento padrão (minutos)"
          rules={[
            { required: true },
            { type: 'number', min: 1, max: 2880, message: 'Use de 1 minuto a 48 horas.' },
          ]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Button type="primary" loading={saving} onClick={() => void save()}>
          Salvar lembretes
        </Button>
      </Form>
    </Card>
  );
}
