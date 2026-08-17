import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Select, Space, Typography } from 'antd';
import type { Region, UserSettingsProps } from '@/domain/entities/user-settings';
import { sendAppMessage } from '@/infrastructure/chrome/message-client';
import { RegionChangeConfirmDialog } from './RegionChangeConfirmDialog';

interface Municipality {
  code: string;
  name: string;
  uf: string;
}
interface Catalog {
  municipalities: Municipality[];
}
const states = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export function RegionSettings({
  settings,
  coverage,
  onSaved,
  onDirtyChange,
}: {
  settings: UserSettingsProps;
  coverage?: { minYear: number; maxYear: number; revision: string };
  onSaved: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [form] = Form.useForm<Region>();
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [pending, setPending] = useState<Region>();
  const [saving, setSaving] = useState(false);
  const uf = Form.useWatch('uf', form);
  useEffect(() => {
    const url = chrome.runtime?.getURL
      ? chrome.runtime.getURL('data/holidays/municipalities.json')
      : '/data/holidays/municipalities.json';
    void fetch(url)
      .then((response) => response.json() as Promise<Catalog>)
      .then((catalog) => setMunicipalities(catalog.municipalities));
  }, []);
  useEffect(() => {
    form.setFieldsValue(settings.region ?? {});
  }, [form, settings]);
  const save = async () => {
    const values = await form.validateFields();
    setPending(values);
  };
  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      await sendAppMessage({
        type: 'settings.updateRegion',
        payload: { ...pending, expectedRevision: settings.revision, confirmed: true },
      });
      setPending(undefined);
      onDirtyChange(false);
      await onSaved();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card title="Região e feriados">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {coverage ? (
          <Alert
            type="info"
            showIcon
            message={`Catálogo ${coverage.revision}`}
            description={`Cobertura de ${coverage.minYear} a ${coverage.maxYear}. Fora desse intervalo, totais dependentes de feriados ficam indisponíveis.`}
          />
        ) : (
          <Alert type="warning" showIcon message="Catálogo de feriados indisponível" />
        )}
        <Form form={form} layout="vertical" onValuesChange={() => onDirtyChange(true)}>
          <Form.Item
            name="uf"
            label="Estado (UF)"
            rules={[{ required: true, message: 'Selecione a UF.' }]}
          >
            <Select showSearch options={states.map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item
            name="municipalityCode"
            label="Município"
            extra="Opcional; usado quando houver feriado municipal no catálogo."
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={municipalities
                .filter((item) => item.uf === uf)
                .map((item) => ({ value: item.code, label: item.name }))}
            />
          </Form.Item>
          <Button type="primary" onClick={() => void save()}>
            Salvar região
          </Button>
        </Form>
        <Typography.Text type="secondary">
          O catálogo é local e atualizado somente junto com novas versões da extensão.
        </Typography.Text>
      </Space>
      <RegionChangeConfirmDialog
        open={Boolean(pending)}
        regionLabel={
          pending
            ? `${pending.municipalityCode ? municipalities.find((item) => item.code === pending.municipalityCode)?.name + ' / ' : ''}${pending.uf}`
            : ''
        }
        onConfirm={() => void confirm()}
        onCancel={() => setPending(undefined)}
        loading={saving}
      />
    </Card>
  );
}
