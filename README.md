# LogBook por Projeto

Extensão Chrome Manifest V3, local-first, para registrar atividades por projeto, consultar o diário por dia, quinzena ou mês, calcular horas normais/extras e exibir lembretes sonoros.

## Requisitos e instalação

- Node.js 22+
- npm 11+
- Google Chrome ou Chromium 120+

```powershell
npm install
npm run build
```

O pacote carregável fica em `dist/`. Abra `chrome://extensions`, ative **Modo do desenvolvedor**, escolha **Carregar sem compactação** e selecione essa pasta.

O ícone da extensão abre o LogBook no Side Panel. A aplicação principal nunca cria uma janela popup; apenas uma ocorrência de lembrete pode abrir/reutilizar `reminder.html`. Confirmações, formulários e detalhes são overlays internos do Ant Design.

## Permissões

- `storage` e `sidePanel`: obrigatórias para dados/configurações locais e para abrir a aplicação.
- `offscreen`: obrigatória e local, usada somente para reproduzir o som selecionado; falhas de áudio não bloqueiam o popup.
- `alarms`: opcional, solicitada ao ativar lembretes; controla exclusivamente o agendamento e o disparo do popup.

Se uma permissão opcional for negada ou revogada, os lembretes ficam desativados, mas projetos, registros e configurações continuam disponíveis. Não há permissões de host, abas ou clipboard persistente. A cópia de descrição usa somente `navigator.clipboard.writeText` durante o gesto do usuário.

## Recursos da versão 002

- Todas as durações visíveis são apresentadas em horas pt-BR (`120` minutos internos → `2 h`; `30` → `0,5 h`). Horários civis continuam em `HH:mm`.
- Projetos arquivados podem ser restaurados. A remoção definitiva exige confirmação e só é permitida sem registros vinculados.
- No Dia, o botão **Copiar** transfere somente a descrição do registro.
- Na Quinzena, dias vazios usam o estado compacto **Sem registros**.
- Em Configurações, o mês pode usar **Notice Calendar** ou **Event Range**. O primeiro organiza segmentos por dia; o segundo mantém uma identidade lógica para atividades que atravessam dias/semanas.
- Cada projeto recebe um dos 12 slots de cor, sempre acompanhado do nome.
- O layout mensal usa agenda abaixo de 480 px úteis e grade de sete colunas a partir de 480 px.
- Há cinco sons locais, cada um com preview. A escolha só é confirmada ao salvar.

## Dados, migração e privacidade

Projetos, registros e rascunhos ficam no IndexedDB do perfil; configurações ficam em `chrome.storage.local`. Nenhum dado é enviado pela rede durante o uso.

Na primeira abertura, a migração atômica v1→v2:

- atribui `colorSlot` aos projetos;
- converte o fim legado `24:00` para `00:00` do dia seguinte sem alterar a duração;
- adiciona preferências de modo mensal/som e a store de rascunhos;
- aborta integralmente se encontrar dados inválidos.

Esta versão não possui exportação, sincronização ou backup. Desinstalar a extensão, limpar seus dados ou trocar de perfil pode apagar o histórico definitivamente.

## Desenvolvimento e validação

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:coverage
npm run test:security
npm run build
npm run test:e2e
npx vitest bench tests/performance/month-query-v2.bench.ts --run
```

Os E2E usam Chromium com perfil isolado e cobrem Side Panel, popup de lembrete, migração/restart, concorrência, clipboard e layouts de 320, 479, 480 e 800 px.

## Catálogo de feriados

O catálogo empacotado cobre uma janela móvel de `ano atual - 5` até `ano atual + 2`. A extensão não consulta fontes externas em runtime.

```powershell
npm run holidays:update
npm test -- tests/contract/holiday-dataset.test.ts
```

O script valida janela e checksums antes de substituir os assets. Se a atualização falhar, preserva o último catálogo local válido.
