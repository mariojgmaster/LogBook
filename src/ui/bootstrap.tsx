import React, { type ComponentType } from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp, ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { logbookTheme } from './theme/theme';
import './theme/global.css';

class RootErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="app-content">
          <h1>O LogBook encontrou um problema</h1>
          <p>Reabra esta superfície. Seus dados locais não foram apagados.</p>
          <button onClick={() => location.reload()}>Recarregar</button>
        </main>
      );
    return this.props.children;
  }
}

export const mountReactApp = (Application: ComponentType) => {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <ConfigProvider locale={ptBR} theme={logbookTheme}>
          <AntApp>
            <Application />
          </AntApp>
        </ConfigProvider>
      </RootErrorBoundary>
    </React.StrictMode>,
  );
};
