import { useEffect, useState } from 'react';
import {
  App as AntApp,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  TimePicker,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';

interface Values {
  projectId: string;
  date: Dayjs;
  start: Dayjs;
  mode: 'end' | 'duration';
  end?: Dayjs;
  duration?: number;
  details: string;
}
export interface RecordDraft {
  projectId: string;
  localDate: string;
  startMinute: number;
  endMinute?: number;
  durationMinutes?: number;
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
  const mode = Form.useWatch('mode', form) ?? 'end';
  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      record
        ? {
            projectId: record.projectId,
            date: dayjs(record.localDate),
            start: dayjs().startOf('day').add(record.startMinute, 'minute'),
            mode: 'end',
            end: dayjs()
              .startOf('day')
              .add(record.endMinute === 1440 ? 1439 : record.endMinute, 'minute'),
            details: record.details,
          }
        : { date: dayjs(initialDate), start: dayjs().startOf('hour'), mode: 'end', details: '' },
    );
  }, [form, initialDate, open, record]);
  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const payload: RecordDraft = {
      projectId: values.projectId,
      localDate: values.date.format('YYYY-MM-DD'),
      startMinute: values.start.hour() * 60 + values.start.minute(),
      ...(values.mode === 'end'
        ? { endMinute: values.end!.hour() * 60 + values.end!.minute() }
        : { durationMinutes: values.duration! }),
      details: values.details,
    };
    try {
      if (record)
        await sendAppMessage({
          type: 'record.update',
          payload: { id: record.id, expectedRevision: record.revision, record: payload },
        });
      else await sendAppMessage({ type: 'record.create', payload });
      await onSaved();
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
      onCancel={onCancel}
      onOk={() => void submit()}
      confirmLoading={saving}
      okText="Salvar registro"
      cancelText="Cancelar"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark="optional">
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
              { value: 'duration', label: 'Duração em minutos' },
            ]}
          />
        </Form.Item>
        {mode === 'end' ? (
          <Form.Item
            name="end"
            label="Fim"
            dependencies={['start']}
            rules={[
              { required: true, message: 'Informe o fim.' },
              ({ getFieldValue }) => ({
                validator(_, value?: Dayjs) {
                  const start = getFieldValue('start') as Dayjs | undefined;
                  return !start || !value || value.isAfter(start)
                    ? Promise.resolve()
                    : Promise.reject(new Error('O fim deve ser posterior ao início.'));
                },
              }),
            ]}
          >
            <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          <Form.Item
            name="duration"
            label="Duração (minutos)"
            rules={[
              { required: true, message: 'Informe a duração.' },
              { type: 'number', min: 1, max: 1440, message: 'Use de 1 a 1.440 minutos.' },
            ]}
          >
            <InputNumber min={1} max={1440} style={{ width: '100%' }} />
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
          extra="Campo obrigatório. Não há campo de título."
        >
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} maxLength={2000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
