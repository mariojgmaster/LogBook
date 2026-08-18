import { useEffect, useMemo, useState } from 'react';
import {
  App as AntApp,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Switch,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { useFormDraft } from '@/ui/hooks/useFormDraft';
import type { FormDraftSnapshot } from '@/application/ports/repositories';
import { DurationHoursField } from '@/ui/components/DurationHoursField';
import {
  formatDurationHours,
  parseDurationHours,
} from '@/application/services/duration-hours-codec';

interface Values {
  projectId: string;
  date: Dayjs;
  start: Dayjs;
  mode: 'end' | 'duration';
  endDate?: Dayjs;
  end?: Dayjs;
  duration?: string;
  withoutLunchBreak: boolean;
  details: string;
}
export interface RecordDraft {
  projectId: string;
  localDate: string;
  startMinute: number;
  endMinute?: number;
  durationMinutes?: number;
  withoutLunchBreak: boolean;
  details: string;
}
export function RecordForm({
  open,
  projects,
  record,
  initialDate,
  onCancel,
  onSaved,
  onConflict,
}: {
  open: boolean;
  projects: ProjectProps[];
  record?: LogRecordProps;
  initialDate: string;
  onCancel: () => void;
  onSaved: () => Promise<void>;
  onConflict?: (draft: RecordDraft) => Promise<void>;
}) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);
  const draftContext = useMemo(
    () => ({
      id: record ? `sidepanel:record:edit:${record.id}` : `sidepanel:record:create:${initialDate}`,
      surface: 'sidepanel' as const,
      formKind: 'record' as const,
      intent: record ? ('edit' as const) : ('create' as const),
      entityId: record?.id,
      contextKey: record?.id ?? initialDate,
    }),
    [initialDate, record],
  );
  const draft = useFormDraft<FormDraftSnapshot>({
    initial: draftContext,
    onRestore: (snapshot) => {
      if (snapshot.values.formKind !== 'record') return;
      const values = snapshot.values;
      form.setFieldsValue({
        projectId: values.projectId,
        date: values.localDate ? dayjs(values.localDate) : undefined,
        start: values.startTime ? dayjs(values.startTime, 'HH:mm') : undefined,
        mode: values.mode,
        end: values.endTime ? dayjs(values.endTime, 'HH:mm') : undefined,
        endDate: values.endLocalDate ? dayjs(values.endLocalDate) : undefined,
        duration: values.durationHours,
        withoutLunchBreak: values.withoutLunchBreak ?? false,
        details: values.details,
      });
    },
  });
  const mode = Form.useWatch('mode', form) ?? 'end';
  const withoutLunchBreak = Form.useWatch('withoutLunchBreak', form) ?? false;
  const watchedDate = Form.useWatch('date', form);
  const watchedStart = Form.useWatch('start', form);
  const watchedDuration = Form.useWatch('duration', form);
  const calculatedEnd = useMemo(() => {
    if (mode !== 'duration' || !watchedDate || !watchedStart || !watchedDuration) return undefined;
    try {
      const durationMinutes = parseDurationHours(
        String(watchedDuration),
        withoutLunchBreak ? 1440 : 1380,
      );
      return watchedDate
        .startOf('day')
        .add(watchedStart.hour(), 'hour')
        .add(watchedStart.minute(), 'minute')
        .add(durationMinutes + (withoutLunchBreak ? 0 : 60), 'minute')
        .format('DD/MM/YYYY [às] HH:mm');
    } catch {
      return undefined;
    }
  }, [mode, watchedDate, watchedDuration, watchedStart, withoutLunchBreak]);
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      record
        ? {
            projectId: record.projectId,
            date: dayjs(record.localDate),
            start: dayjs().startOf('day').add(record.startMinute, 'minute'),
            mode: 'end',
            endDate: dayjs(record.endLocalDate ?? record.localDate),
            end: dayjs()
              .startOf('day')
              .add(record.endMinute === 1440 ? 1439 : record.endMinute, 'minute'),
            duration: formatDurationHours(record.durationMinutes),
            withoutLunchBreak: record.withoutLunchBreak ?? true,
            details: record.details,
          }
        : {
            date: dayjs(initialDate),
            start: dayjs().startOf('hour'),
            mode: 'end',
            endDate: dayjs(initialDate),
            withoutLunchBreak: false,
            details: '',
          },
    );
  }, [form, initialDate, open, record]);
  const submit = async () => {
    let values: Values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    const payload: RecordDraft = {
      projectId: values.projectId,
      localDate: values.date.format('YYYY-MM-DD'),
      startMinute: values.start.hour() * 60 + values.start.minute(),
      withoutLunchBreak: values.withoutLunchBreak === true,
      ...(values.mode === 'end'
        ? {
            endLocalDate: values.endDate!.format('YYYY-MM-DD'),
            endMinute: values.end!.hour() * 60 + values.end!.minute(),
          }
        : {
            durationMinutes: parseDurationHours(
              values.duration!,
              values.withoutLunchBreak ? 1440 : 1380,
            ),
          }),
      details: values.details,
    };
    try {
      if (record)
        await sendAppMessage({
          type: 'record.update',
          payload: { id: record.id, record: payload },
        });
      else await sendAppMessage({ type: 'record.create', payload });
      await onSaved();
      await draft.complete();
      form.resetFields();
    } catch (cause) {
      const error =
        cause instanceof Error && 'code' in cause ? (cause as Error & { code: string }) : undefined;
      if (error?.code === 'CONFLICT' && onConflict) await onConflict(payload);
      else message.error(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      width={640}
      title={record ? 'Editar registro' : 'Novo registro'}
      open={open}
      onCancel={() => void draft.flush().finally(onCancel)}
      onOk={() => void submit()}
      confirmLoading={saving}
      okText="Salvar registro"
      cancelText="Cancelar"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onValuesChange={(_, values) =>
          draft.protect({
            formKind: 'record',
            projectId: values.projectId,
            localDate: values.date?.format('YYYY-MM-DD'),
            startTime: values.start?.format('HH:mm'),
            mode: values.mode,
            endLocalDate: values.endDate?.format('YYYY-MM-DD'),
            endTime: values.end?.format('HH:mm'),
            durationHours: values.duration === undefined ? undefined : String(values.duration),
            withoutLunchBreak: values.withoutLunchBreak ?? false,
            details: values.details,
          })
        }
      >
        <Form.Item
          name="projectId"
          label="Projeto"
          validateTrigger="onBlur"
          rules={[{ required: true, message: 'Selecione um projeto.' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={projects
              .filter((project) => project.status === 'active' || project.id === record?.projectId)
              .map((project) => ({
                value: project.id,
                label: `${project.name}${project.status === 'archived' ? ' (arquivado)' : ''}`,
                disabled: project.status === 'archived' && project.id !== record?.projectId,
              }))}
          />
        </Form.Item>
        <Form.Item
          name="date"
          label="Data"
          rules={[{ required: true, message: 'Informe a data.' }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            disabledDate={(date) => date.startOf('day').isAfter(dayjs().startOf('day'))}
          />
        </Form.Item>
        <Form.Item
          name="start"
          label="Início"
          rules={[{ required: true, message: 'Informe o início.' }]}
        >
          <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="mode" label="Como informar o término">
          <Radio.Group
            options={[
              { value: 'end', label: 'Horário final' },
              { value: 'duration', label: 'Duração em horas' },
            ]}
          />
        </Form.Item>
        <div className="record-lunch-toggle">
          <div>
            <Typography.Text id="without-lunch-label">Sem hora de almoço?</Typography.Text>
            <Typography.Text type="secondary">
              Ative somente quando não houver intervalo.
            </Typography.Text>
          </div>
          <Form.Item name="withoutLunchBreak" valuePropName="checked" noStyle>
            <Switch size="small" aria-labelledby="without-lunch-label" />
          </Form.Item>
        </div>
        {mode === 'end' ? (
          <>
            <Form.Item
              name="endDate"
              label="Data final"
              dependencies={['date']}
              rules={[
                { required: true, message: 'Informe a data final.' },
                ({ getFieldValue }) => ({
                  validator(_, value?: Dayjs) {
                    const startDate = getFieldValue('date') as Dayjs | undefined;
                    return !startDate ||
                      !value ||
                      value.isSame(startDate, 'day') ||
                      value.isSame(startDate.add(1, 'day'), 'day')
                      ? Promise.resolve()
                      : Promise.reject(new Error('Use a mesma data ou o dia seguinte.'));
                  },
                }),
              ]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="end"
              label="Fim"
              dependencies={['date', 'start', 'endDate', 'withoutLunchBreak']}
              rules={[
                { required: true, message: 'Informe o fim.' },
                ({ getFieldValue }) => ({
                  validator(_, value?: Dayjs) {
                    const start = getFieldValue('start') as Dayjs | undefined;
                    const startDate = getFieldValue('date') as Dayjs | undefined;
                    const endDate = getFieldValue('endDate') as Dayjs | undefined;
                    const skipsLunch = Boolean(getFieldValue('withoutLunchBreak'));
                    if (!start || !value || !startDate || !endDate) return Promise.resolve();
                    const startInstant = startDate
                      .startOf('day')
                      .add(start.hour(), 'hour')
                      .add(start.minute(), 'minute');
                    const endInstant = endDate
                      .startOf('day')
                      .add(value.hour(), 'hour')
                      .add(value.minute(), 'minute');
                    const minutes = endInstant.diff(startInstant, 'minute');
                    const minimum = skipsLunch ? 1 : 61;
                    return minutes >= minimum && minutes <= 1440
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error(
                            skipsLunch
                              ? 'O intervalo deve durar até 24 horas.'
                              : 'Com almoço, o intervalo deve ser maior que 1h e durar até 24h.',
                          ),
                        );
                  },
                }),
              ]}
            >
              <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            name="duration"
            label="Duração (horas)"
            rules={[
              { required: true, message: 'Informe a duração.' },
              {
                validator: (_, value?: string) => {
                  if (!value) return Promise.resolve();
                  try {
                    parseDurationHours(value, withoutLunchBreak ? 1440 : 1380);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(
                      new Error(
                        'Informe uma duração em horas válida, com até quatro casas decimais.',
                      ),
                    );
                  }
                },
              },
            ]}
            extra={
              <span>
                Use vírgula e até quatro casas decimais. Ex.: 0,5 h.
                {calculatedEnd && (
                  <Typography.Text className="calculated-end" type="secondary">
                    Término calculado: <strong>{calculatedEnd}</strong>
                  </Typography.Text>
                )}
              </span>
            }
          >
            <DurationHoursField />
          </Form.Item>
        )}
        <Form.Item
          name="details"
          label="Detalhes"
          validateTrigger="onBlur"
          rules={[
            { required: true, whitespace: true, message: 'Descreva a atividade realizada.' },
            { max: 2000, message: 'Use no máximo 2.000 caracteres.' },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} maxLength={2000} showCount />
        </Form.Item>
      </Form>
      <span className="draft-status" role="status">
        {draft.state === 'protecting'
          ? 'Protegendo rascunho…'
          : draft.state === 'saved'
            ? 'Rascunho protegido'
            : draft.state === 'failed'
              ? 'Não foi possível proteger o rascunho'
              : ''}
      </span>
    </Modal>
  );
}
