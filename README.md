# LogBook por Projeto

Extensão Manifest V3 para registrar atividades por projeto, consultar o diário por dia, quinzena ou mês, calcular horas normais e extras e configurar lembretes locais.

## Requisitos

- Node.js 22+
- npm 11+
- Google Chrome ou Chromium 120+

## Desenvolvimento

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

O pacote carregável fica em `dist/`. Para instalar localmente, abra `chrome://extensions`, ative **Modo do desenvolvedor**, escolha **Carregar sem compactação** e selecione a pasta `dist`.

O ícone da barra abre uma janela popup dedicada. A extensão não usa `default_popup`, servidores remotos, telemetria, código remoto ou permissões de host.

## Permissões

- `storage`: necessária para configurações locais e identificação reconstruível da janela principal.
- `alarms`: opcional; solicitada somente ao ativar lembretes. Se negada ou revogada, registros e configurações continuam disponíveis, mas os lembretes ficam desativados até nova autorização.

## Dados locais e privacidade

Projetos e tarefas ficam no IndexedDB do perfil do Chrome. Configurações ficam em `chrome.storage.local`. Nenhum dado é enviado pela rede durante o uso da extensão.

Esta versão não possui exportação, sincronização ou backup. Desinstalar a extensão, limpar seus dados ou trocar de perfil pode apagar o histórico definitivamente. Faça essas operações somente se aceitar essa perda.

## Catálogo de feriados

O catálogo empacotado cobre uma janela móvel de `ano atual - 5` até `ano atual + 2`. Ele combina regras públicas do pacote MIT `date-holidays` com códigos de municípios da API de Localidades do IBGE. A extensão nunca consulta essas fontes em tempo de execução.

Para atualizar o pacote durante uma release:

```powershell
npm run holidays:update
npm test -- tests/contract/holiday-dataset.test.ts
```

O script valida a janela anual e checksums antes de substituir os assets; se a obtenção de municípios falhar, preserva o último catálogo local válido.

## Testes E2E

```powershell
npm run test:e2e
```

Os testes executam no Chromium com um perfil persistente isolado e cobrem a comunicação entre a página da extensão e a service worker MV3.
