import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { ProjectProps } from '@/domain/entities/project';

export function ProjectForm({
  open,
  project,
  confirmLoading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  project?: ProjectProps;
  confirmLoading?: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [form] = Form.useForm<{ name: string }>();
  useEffect(() => {
    if (open) form.setFieldsValue({ name: project?.name ?? '' });
  }, [form, open, project]);
  return (
    <Modal
      title={project ? 'Renomear projeto' : 'Novo projeto'}
      open={open}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      okText="Salvar"
      cancelText="Cancelar"
      destroyOnHidden
      onOk={() => void form.validateFields().then(({ name }) => onSubmit(name))}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="name"
          label="Nome"
          validateTrigger="onBlur"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome do projeto.' },
            { max: 100, message: 'Use no máximo 100 caracteres.' },
          ]}
          extra="Entre 1 e 100 caracteres; espaços repetidos serão normalizados."
        >
          <Input maxLength={100} showCount autoComplete="off" autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}
