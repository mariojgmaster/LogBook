import { Modal } from 'antd';
export function RegionChangeConfirmDialog({
  open,
  regionLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  regionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      title="Confirmar troca de região"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Aplicar e recalcular"
      cancelText="Cancelar"
    >
      <p>
        A região será alterada para <strong>{regionLabel}</strong>. Os registros não serão
        modificados, mas totais de horas extras serão recalculados conforme os feriados aplicáveis.
      </p>
    </Modal>
  );
}
