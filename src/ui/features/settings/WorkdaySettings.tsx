import { Card, Descriptions, Typography } from 'antd';
export function WorkdaySettings() {
  return (
    <Card title="Jornada e categorias">
      <Typography.Paragraph type="secondary">
        Regras fixas nesta versão; somente leitura.
      </Typography.Paragraph>
      <Descriptions column={{ xs: 1, sm: 2 }} bordered>
        <Descriptions.Item label="Jornada">8 horas por dia</Descriptions.Item>
        <Descriptions.Item label="Dias úteis">Segunda a sexta</Descriptions.Item>
        <Descriptions.Item label="Hora normal">Primeiras 8 h em dia útil</Descriptions.Item>
        <Descriptions.Item label="Extra 50%">Após 8h e sábados</Descriptions.Item>
        <Descriptions.Item label="Extra 100%">Domingos e feriados</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
