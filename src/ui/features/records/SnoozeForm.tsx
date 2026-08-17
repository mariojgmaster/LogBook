import { useState } from 'react';
import { Button, Card, Form, InputNumber, Space, Typography } from 'antd';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';

export function SnoozeForm({
  targetLocalDate,
  slotId,
}: {
  targetLocalDate: string;
  slotId: string;
}) {
  const [minutes, setMinutes] = useState(10);
  const [saving, setSaving] = useState(false);
  const snooze = async () => {
    setSaving(true);
    try {
      await sendAppMessage({
        type: 'reminder.snooze',
        payload: { slotId, when: Date.now(), targetLocalDate, minutes },
      });
      window.close();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card title="Lembrete do logbook" style={{ marginBottom: 20 }}>
      <Space direction="vertical">
        <Typography.Text>
          O dia original deste lembrete é{' '}
          <strong>{targetLocalDate.split('-').reverse().join('/')}</strong>.
        </Typography.Text>
        <Form.Item
          label="Adiar por (minutos)"
          extra="De 1 minuto a 48 horas; sem limite oculto menor."
        >
          <InputNumber
            value={minutes}
            onChange={(value) => setMinutes(value ?? 10)}
            min={1}
            max={2880}
          />
        </Form.Item>
        <Button onClick={() => void snooze()} loading={saving}>
          Adiar lembrete
        </Button>
      </Space>
    </Card>
  );
}
