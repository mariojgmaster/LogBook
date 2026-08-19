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
        <Descriptions.Item label="Horário padrão">08:00–17:00</Descriptions.Item>
        <Descriptions.Item label="Hora normal">Até 8 h dentro do horário padrão</Descriptions.Item>
        <Descriptions.Item label="Extra 50%">
          Fora do horário padrão, após 8 h e sábados
        </Descriptions.Item>
        <Descriptions.Item label="Extra 100%">Domingos e feriados</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
