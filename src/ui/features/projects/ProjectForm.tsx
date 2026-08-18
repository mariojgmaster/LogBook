import { Form, Input, Modal } from 'antd';
import { useEffect, useMemo } from 'react';
import type { ProjectProps } from '@/domain/entities/project';
import { useFormDraft } from '@/ui/hooks/useFormDraft';
import type { FormDraftSnapshot } from '@/application/ports/repositories';

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
  const draftContext = useMemo(
    () => ({
      id: project ? `sidepanel:project:edit:${project.id}` : 'sidepanel:project:create',
      surface: 'sidepanel' as const,
      formKind: 'project' as const,
      intent: project ? ('edit' as const) : ('create' as const),
      entityId: project?.id,
      contextKey: project?.id ?? 'create',
    }),
    [project],
  );
  const draft = useFormDraft<FormDraftSnapshot>({
    initial: draftContext,
    onRestore: (snapshot) => {
      if (snapshot.values.formKind === 'project') form.setFieldsValue(snapshot.values);
    },
  });
  useEffect(() => {
    if (open) form.setFieldsValue({ name: project?.name ?? '' });
  }, [form, open, project]);
  return (
    <Modal
      title={project ? 'Renomear projeto' : 'Novo projeto'}
      open={open}
      confirmLoading={confirmLoading}
      onCancel={() => void draft.flush().finally(onCancel)}
      okText="Salvar"
      cancelText="Cancelar"
      destroyOnHidden
      onOk={() =>
        void form.validateFields().then(async ({ name }) => {
          await onSubmit(name);
          await draft.complete();
        })
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onValuesChange={(_, values) => draft.protect({ formKind: 'project', name: values.name })}
      >
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
