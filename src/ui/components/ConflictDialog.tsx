import { Button, Descriptions, Modal, Space } from 'antd';

export function ConflictDialog({
  open,
  local,
  current,
  onReload,
  onReapply,
  onCancel,
}: {
  open: boolean;
  local?: Record<string, unknown>;
  current?: Record<string, unknown>;
  onReload: () => void;
  onReapply: () => void;
  onCancel: () => void;
}) {
  const fields = [...new Set([...Object.keys(local ?? {}), ...Object.keys(current ?? {})])].filter(
    (field) => JSON.stringify(local?.[field]) !== JSON.stringify(current?.[field]),
  );
  const display = (value: unknown) =>
    value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value);
  return (
    <Modal
      title="Alterações em conflito"
      open={open}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onReload}>Recarregar versão atual</Button>
          <Button type="primary" onClick={onReapply}>
            Reaplicar minhas alterações
          </Button>
        </Space>
      }
    >
      <p>Outra janela alterou este item. Nenhum dado foi sobrescrito.</p>
      <Descriptions column={1} bordered size="small">
        {fields.map((field) => (
          <Descriptions.Item key={field} label={field}>
            <div>Atual: {display(current?.[field])}</div>
            <div>Seu valor: {display(local?.[field])}</div>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Modal>
  );
}
