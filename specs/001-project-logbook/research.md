# Pesquisa técnica — Logbook por projeto

**Data da pesquisa**: 2026-08-17

## 1. Stack de frontend e build

**Decisão**: React 19.2 com TypeScript estrito, Vite 8 e Ant Design 6.6, usando versões exatas no lockfile.

**Motivo**: é a linha estável atual, compatível com React 19 e adequada a uma SPA empacotada dentro de Manifest V3. Vite 8 exige Node 20.19+ ou 22.12+; Node 22 LTS será o ambiente de desenvolvimento. Ant Design oferece componentes acessíveis e consistentes sem exigir um design system próprio.

**Alternativas**: React sem biblioteca de componentes aumentaria o trabalho de acessibilidade; Next.js adicionaria servidor/SSR sem benefício; Redux foi descartado porque estado local + casos de uso e consultas bastam.

**Fontes**: [React versions](https://react.dev/versions), [Ant Design introduction](https://ant.design/docs/react/introduce/), [Ant Design changelog](https://ant.design/components/changelog/), [Vite 8](https://vite.dev/blog/announcing-vite8) e [Vite guide](https://vite.dev/guide/).

## 2. Tema, layout e UX

**Decisão**: `ConfigProvider` com `theme.darkAlgorithm` será o padrão; tokens semânticos centralizam cores, espaçamento, raio e foco. O idioma será `pt_BR`. Feedback imperativo usará o contexto de `App`, não APIs estáticas. O layout começa em coluna única e evolui para navegação lateral e painéis paralelos conforme o contêiner.

**Motivo**: dark mode nativo mantém contraste e estados consistentes. Container queries tornam componentes responsivos à janela redimensionável. Labels visíveis, foco restaurado e erros textuais atendem teclado e leitores de tela.

**Alternativas**: CSS totalmente customizado duplicaria comportamentos; apenas `prefers-color-scheme` contrariaria o dark padrão; breakpoints globais isolados acoplariam componentes ao viewport.

**Fontes**: [Ant Design theme](https://ant.design/docs/react/customize-theme/), [Ant Design dark mode](https://ant.design/docs/spec/dark/) e guias `accessibility`, `dark-mode`, `forms`, `validate-input-after-interaction` e `size-aware-styling`.

## 3. Janela da aplicação e lembretes

**Decisão**: o ícone não terá `default_popup`. `chrome.action.onClicked` abre ou foca `chrome.windows.create({ type: "popup" })`, redimensionável, inicialmente em cerca de 1100 × 760 px e funcional a partir de 360 × 600 px. Alarmes diários ou por dias da semana aceitam múltiplos horários, abrem/reutilizam a mesma janela e direcionam ao preenchimento do dia. Snooze personalizado aceita 1 minuto a 48 horas e adia somente a ocorrência atual; recorrências intermediárias são suprimidas até seu disparo, e a agenda normal retorna na próxima ocorrência futura.

**Motivo**: o popup da action fecha ao perder foco. Uma janela `popup` é independente e não exige `tabs` para ser criada/focada. O ID persistido é apenas uma dica e sempre será validado antes do reuso.

**Alternativas**: side panel limita espaço; nova aba mistura a aplicação às abas normais; notificações não entregam o fluxo de preenchimento pedido.

**Fontes**: [windows API](https://developer.chrome.com/docs/extensions/reference/api/windows) e [action popup behavior](https://developer.chrome.com/docs/extensions/develop/ui/add-popup).

## 4. Arquitetura e comunicação

**Decisão**: módulos `domain`, `application`, `infrastructure` e `ui`. O service worker adapta eventos Chrome, sem regras de horas. Mensagens usam união discriminada, `requestId`, schemas Zod e envelope de erro tipado; payloads são validados na origem e no destino.

**Motivo**: regras críticas ficam testáveis sem navegador, o domínio não depende de React/Chrome e nenhum estado essencial depende da memória efêmera do worker.

**Alternativas**: acesso direto ao storage pelos componentes espalharia regras; singleton em memória falharia após suspensão; mensagens genéricas perderiam validação em runtime.

**Fontes**: [message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) e [service workers](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers).

## 5. Persistência e conflitos

**Decisão**: projetos e registros em IndexedDB; configurações pequenas e versão de schema em `chrome.storage.local`. Entidades mutáveis têm `revision`. Atualizações recebem `expectedRevision` e executam read-check-write em transação; divergência retorna `CONFLICT` com a versão atual, sem sobrescrever.

**Motivo**: IndexedDB oferece índices e transações para 10.000 registros. A revisão otimista resolve duas janelas editando o mesmo item sem travas globais. A UI permite revisar, recarregar ou reaplicar mudanças conscientemente.

**Alternativas**: só `chrome.storage.local` regravaria coleções grandes; LocalStorage não atende ao service worker; last-write-wins silencioso viola a especificação.

## 6. Datas, horas e jornada

**Decisão**: armazenar data civil `YYYY-MM-DD`, início/fim em minutos desde 00:00 e duração em minutos inteiros. Agrupamentos operam nesses valores; Day.js fica na apresentação.

**Motivo**: evita troca de dia por UTC ou mudança de fuso. A classificação aplica 8h normais de segunda a sexta, excedente em 50%, sábado em 50% e domingo/feriado em 100%; sobreposições são permitidas e somadas integralmente.

**Alternativas**: timestamps UTC alterariam a data civil ao viajar; horas decimais introduziriam arredondamento; `Date` disperso criaria ambiguidades.

## 7. Catálogo de feriados

**Decisão**: empacotar dataset brasileiro versionado no build, com municípios por código IBGE e feriados nacionais, estaduais e municipais. A fonte candidata é o projeto MIT [feriados-brasil](https://github.com/joaopbini/feriados-brasil). O script de preparação de release registra URL/revisão, licença, checksum e data, valida o schema e não baixa código executável para execução. O provider permanece substituível; a extensão instalada não atualiza o catálogo pela rede em runtime.

**Motivo**: API comercial exige token, impossível de proteger na extensão sem backend. Dataset local dispensa host permissions, funciona offline e mantém simplicidade. Como a fonte comunitária agrega fontes diversas, procedência e versão aparecerão em Configurações e haverá testes de integridade.

**Alternativas**: [Feriados API](https://feriadosapi.com/docs) exige bearer token/cotas; backend ampliaria o escopo; `date-holidays` não garante cobertura municipal completa.

## 8. Permissões e segurança

**Decisão**: MV3, sem host permissions, `tabs`, `notifications` ou código remoto. `storage` é obrigatória; `alarms` é opcional e solicitada só ao ativar lembretes. CSP não permite `unsafe-eval`; conteúdo do usuário nunca é inserido como HTML.

**Motivo**: mínimo privilégio. Negar ou revogar `alarms` apenas desliga lembretes. Alarmes são reconciliados na instalação, inicialização e mudança de configuração.

**Fontes**: [permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions), [alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms) e [extension security](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security).

## 9. Estratégia de testes

**Decisão**: testes unitários tabelados para cálculos; integração com `fake-indexeddb`; componentes por comportamento acessível com React Testing Library; E2E em Chromium para janela, permissões, lembretes e responsividade. Conflitos usam duas instâncias carregando a mesma revisão e salvando em ordem controlada.

**Motivo**: concentra cobertura nas regras de risco e testa a extensão real onde as APIs Chrome importam, sem acoplar testes a detalhes internos.

**Fontes**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [Vitest Browser Mode](https://main.vitest.dev/api/browser/react) e [Playwright Chrome extensions](https://playwright.dev/docs/chrome-extensions).
