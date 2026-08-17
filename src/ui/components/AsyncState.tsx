import { Alert, Button, Empty, Skeleton, Space } from 'antd';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label}>
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      message="Não foi possível carregar"
      description={
        <Space direction="vertical">
          <span>{message}</span>
          {onRetry && <Button onClick={onRetry}>Tentar novamente</Button>}
        </Space>
      }
    />
  );
}
export function EmptyState({
  description,
  action,
}: {
  description: ReactNode;
  action?: ReactNode;
}) {
  return <Empty description={description}>{action}</Empty>;
}
