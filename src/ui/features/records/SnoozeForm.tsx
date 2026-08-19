import { useEffect, useMemo, useRef, useState } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Form, Input, Space, Tag, Typography } from 'antd';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { useFormDraft } from '@/ui/hooks/useFormDraft';
import type { FormDraftSnapshot } from '@/application/ports/repositories';
import {
  formatDurationClock,
  parseDurationClock,
} from '@/application/services/duration-clock-codec';

const PRESET_MINUTES = [5, 10, 15, 30, 45, 60, 120, 240, 480, 1_440, 2_880];
const currentTimestamp = () => Date.now();

export function SnoozeForm({
  targetLocalDate,
  slotId,
  onCompleted = () => window.close(),
}: {
  targetLocalDate: string;
  slotId: string;
  onCompleted?: () => void | Promise<void>;
}) {
  const [defaultMinutes, setDefaultMinutes] = useState(10);
  const [customDuration, setCustomDuration] = useState(formatDurationClock(10));
  const [durationError, setDurationError] = useState<string>();
  const [savingMinutes, setSavingMinutes] = useState<number>();
  const hasCustomValue = useRef(false);
  const draftContext = useMemo(
    () => ({
      id: `reminder:snooze:${slotId}:${targetLocalDate}`,
      surface: 'reminder' as const,
      formKind: 'snooze' as const,
      intent: 'update' as const,
      contextKey: `${slotId}:${targetLocalDate}`,
    }),
    [slotId, targetLocalDate],
  );
  const draft = useFormDraft<FormDraftSnapshot>({
    initial: draftContext,
    onRestore: (snapshot) => {
      if (snapshot.values.formKind === 'snooze' && snapshot.values.durationHours) {
        hasCustomValue.current = true;
        setCustomDuration(snapshot.values.durationHours);
      }
    },
  });

  useEffect(() => {
    void sendAppMessage<{ reminders: { snoozeMinutes: number } }>({
      type: 'settings.get',
      payload: {},
    })
      .then(({ reminders }) => {
        setDefaultMinutes(reminders.snoozeMinutes);
        if (!hasCustomValue.current)
          setCustomDuration(formatDurationClock(reminders.snoozeMinutes));
      })
      .catch(() => undefined);
  }, []);

  const presets = useMemo(
    () => [defaultMinutes, ...PRESET_MINUTES.filter((value) => value !== defaultMinutes)],
    [defaultMinutes],
  );

  const snooze = async (minutes: number) => {
    setSavingMinutes(minutes);
    setDurationError(undefined);
    try {
      await sendAppMessage({
        type: 'reminder.snooze',
        payload: { slotId, when: currentTimestamp(), targetLocalDate, minutes },
      });
      await draft.complete();
      await onCompleted();
    } catch {
      setDurationError('Não foi possível adiar. Tente novamente.');
    } finally {
      setSavingMinutes(undefined);
    }
  };

  const submitCustom = () => {
    try {
      void snooze(parseDurationClock(customDuration));
    } catch {
      setDurationError('Use HH:mm, de 00:01 a 48:00.');
    }
  };

  return (
    <section className="snooze-panel" aria-labelledby="snooze-heading">
      <div className="snooze-heading">
        <Flex justify="space-between" align="center" gap="small">
          <Typography.Title level={2} id="snooze-heading">
            Adiar lembrete
          </Typography.Title>
          <Tag color="cyan">Padrão {formatDurationClock(defaultMinutes)}</Tag>
        </Flex>
        <Typography.Text type="secondary">
          Escolha quando deseja ser lembrado novamente.
        </Typography.Text>
      </div>

      <div className="snooze-presets" role="group" aria-label="Opções de adiamento">
        {presets.map((minutes, index) => (
          <Button
            type={index === 0 ? 'primary' : 'default'}
            size="small"
            key={minutes}
            loading={savingMinutes === minutes}
            onClick={() => void snooze(minutes)}
            aria-label={`Adiar por ${formatDurationClock(minutes)}${index === 0 ? ', padrão' : ''}`}
          >
            {formatDurationClock(minutes)}
          </Button>
        ))}
      </div>

      <Divider />

      <Form layout="vertical" onFinish={submitCustom} requiredMark={false}>
        <Form.Item
          label="Outro período"
          validateStatus={durationError ? 'error' : undefined}
          help={durationError}
        >
          <Space.Compact block>
            <Input
              aria-label="Personalizado"
              prefix={<ClockCircleOutlined aria-hidden="true" />}
              value={customDuration}
              maxLength={5}
              placeholder="00:30"
              aria-invalid={Boolean(durationError)}
              onChange={(event) => {
                hasCustomValue.current = true;
                setCustomDuration(event.target.value);
                setDurationError(undefined);
                draft.protect({
                  formKind: 'snooze',
                  slotId,
                  targetLocalDate,
                  durationHours: event.target.value,
                });
              }}
            />
            <Button type="primary" htmlType="submit" loading={savingMinutes !== undefined}>
              Adiar
            </Button>
          </Space.Compact>
        </Form.Item>
      </Form>

      <Typography.Text className="snooze-draft-status" type="secondary" role="status">
        {draft.state === 'protecting'
          ? 'Protegendo rascunho…'
          : draft.state === 'failed'
            ? 'Rascunho indisponível'
            : ''}
      </Typography.Text>
    </section>
  );
}
