import { useCallback, useEffect, useState } from 'react';
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
import { ChromeSidePanelAdapter } from '@/infrastructure/chrome/side-panel-adapter';
import { flushFormDrafts } from '@/ui/hooks/useFormDraft';

type Destination = 'diary' | 'projects' | 'settings';
const items = [
  { key: 'diary', icon: <BookOutlined />, label: 'Diário' },
  { key: 'projects', icon: <FolderOpenOutlined />, label: 'Projetos' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Configurações' },
];
const sidePanel = new ChromeSidePanelAdapter();

export function App() {
  const [destination, setDestination] = useState<Destination>('diary');
  const [menuOpen, setMenuOpen] = useState(false);
  const [newRecordSignal, setNewRecordSignal] = useState(0);
  const handleNewRecordSignal = useCallback(() => setNewRecordSignal(0), []);
  const navigate = async (value: string) => {
    await flushFormDrafts();
    const next = value as Destination;
    setDestination(next);
    void sidePanel.saveDestination(next);
    setMenuOpen(false);
  };
  useEffect(() => {
    void sidePanel.getDestination().then(setDestination);
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
          onClick={({ key }) => void navigate(key)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            void flushFormDrafts().then(() => {
              setDestination('diary');
              setNewRecordSignal((value) => value + 1);
            });
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
          onClick={({ key }) => void navigate(key)}
        />
      </Drawer>
      <Layout.Content id="main-content" className="app-content">
        {destination === 'diary' && (
          <DiaryPage
            newRecordSignal={newRecordSignal}
            onNewRecordSignalHandled={handleNewRecordSignal}
          />
        )}
        {destination === 'projects' && <ProjectsPage />}
        {destination === 'settings' && <SettingsPage />}
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
