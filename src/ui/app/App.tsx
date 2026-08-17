import { useEffect, useState } from 'react';
import {
  BookOutlined,
  FolderOpenOutlined,
  MenuOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Layout, Menu, Typography } from 'antd';
import { DiaryPage } from '@/ui/features/dashboard/DiaryPage';
import { ProjectsPage } from '@/ui/features/projects/ProjectsPage';
import { SettingsPage } from '@/ui/features/settings/SettingsPage';
import { reminderOpenedEventSchema } from '@/shared/contracts/messages';

type Destination = 'diary' | 'projects' | 'settings';
const items = [
  { key: 'diary', icon: <BookOutlined />, label: 'Diário' },
  { key: 'projects', icon: <FolderOpenOutlined />, label: 'Projetos' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Configurações' },
];

export function App() {
  const initialParams = new URLSearchParams(location.search);
  const [destination, setDestination] = useState<Destination>(() =>
    initialParams.has('reminder') ? 'settings' : 'diary',
  );
  const [reminderContext, setReminderContext] = useState(() => {
    const targetLocalDate = initialParams.get('targetLocalDate');
    const slotId = initialParams.get('slotId');
    return targetLocalDate && slotId ? { targetLocalDate, slotId } : undefined;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [newRecordSignal, setNewRecordSignal] = useState(0);
  const navigate = (value: string) => {
    setDestination(value as Destination);
    setMenuOpen(false);
  };
  useEffect(() => {
    const listener = (raw: unknown) => {
      const event = reminderOpenedEventSchema.safeParse(raw);
      if (event.success) {
        setReminderContext(event.data);
        setDestination('settings');
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);
  return (
    <Layout className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Layout.Header className="app-header">
        <Button
          className="mobile-only"
          type="text"
          icon={<MenuOutlined />}
          aria-label="Abrir navegação"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        />
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">
            <BookOutlined />
          </span>
          <span>LogBook</span>
        </div>
        <Menu
          className="desktop-only"
          theme="dark"
          mode="horizontal"
          selectedKeys={[destination]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setDestination('diary');
            setNewRecordSignal((value) => value + 1);
          }}
        >
          <span className="desktop-only">Novo registro</span>
        </Button>
      </Layout.Header>
      <Drawer
        title="Navegação"
        placement="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        width="min(20rem, 80vw)"
      >
        <Menu
          mode="inline"
          selectedKeys={[destination]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Drawer>
      <Layout.Content id="main-content" className="app-content">
        {destination === 'diary' && <DiaryPage newRecordSignal={newRecordSignal} />}
        {destination === 'projects' && <ProjectsPage />}
        {destination === 'settings' && <SettingsPage reminderContext={reminderContext} />}
      </Layout.Content>
      <Typography.Text
        aria-live="polite"
        id="polite-announcer"
        style={{
          position: 'fixed',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
        }}
      />
    </Layout>
  );
}
