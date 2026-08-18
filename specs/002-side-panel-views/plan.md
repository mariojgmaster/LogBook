# Implementation Plan: Side Panel e Visualizações Aprimoradas

**Branch**: `master` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-side-panel-views/spec.md`

## Summary

Evoluir a extensão existente sem trocar stack, arquitetura ou bibliotecas: a SPA React principal passa de uma janela popup para o Side Panel global do Chrome, enquanto lembretes continuam abrindo uma janela `popup` dedicada. A interface passa a apresentar durações em horas, permite restaurar e remover com segurança projetos arquivados, preserva rascunhos, copia descrições e oferece os modos mensais Notice Calendar e Event Range com layout responsivo por largura do contêiner.

O domínio continua armazenando duração como minutos inteiros para preservar exatidão, e a camada de aplicação ganha um codec pt-BR canônico consumido pela borda de apresentação. Registros passam a ter data final explícita e intervalo civil semiaberto de até 24 horas, permitindo atravessar uma meia-noite sem duplicação. Projetos recebem um slot de cor persistido; preferências mensais e de som ficam nas configurações; rascunhos ficam em uma store IndexedDB própria. A versão 2 do banco migra registros e projetos existentes de forma transacional.

O service worker deixa de abrir a aplicação principal e configura o clique da action para o Side Panel. Apenas alarmes criam/reutilizam `reminder.html` como janela popup. Cinco ou mais arquivos WAV empacotados formam o catálogo de sons; preview ocorre no Side Panel sob gesto do usuário e o disparo usa um documento offscreen com motivo `AUDIO_PLAYBACK`, acionado por mensagem validada. O calendário usa React, componentes/tokens Ant Design, Day.js na apresentação e CSS Grid/container queries, sem nova dependência.

## Technical Context

**Language/Version**: TypeScript 5.9.2 em modo `strict`, React 19.2.8 e Node.js 22 LTS para desenvolvimento

**Primary Dependencies**: Ant Design 6.6.1, `@ant-design/icons` 6.1.0, Vite 8.2.1, `@vitejs/plugin-react` 6.0.5, Zod 4.4.3, `idb` 8.0.3 e Day.js 1.11.23; nenhuma dependência nova

**Storage**: IndexedDB `logbook` v2 para projetos, registros, rascunhos de formulário e feriados; `chrome.storage.local` para configurações, lembretes e metadados leves, sempre atrás de repositórios e schemas versionados

**Testing**: Vitest 4.1.10 para domínio/integração/contratos, React Testing Library 16.3 e User Event 14.6 para UI, `fake-indexeddb` 6.2.2 para migração/repositórios e Playwright 1.62.1 com Chromium para E2E da extensão empacotada

**Target Platform**: Google Chrome desktop 120+ em Windows, macOS e Linux, Manifest V3

**Project Type**: Extensão de navegador local-first com duas entradas React visíveis (Side Panel e popup de lembrete), um documento offscreen de áudio e um service worker

**Performance Goals**: em build de produção no Chromium do Playwright, Node 22 LTS, máquina de referência com 4 CPUs lógicas e 8 GB de RAM disponíveis, medir 5 aquecimentos e 20 amostras sobre IndexedDB semeado com 10.000 registros. O p95 da consulta mensal completa — lookback, interseção, filtros, cores, totais e projeções Notice/Event Range — MUST ser ≤2 s; feedback local medido do evento até o primeiro estado visual MUST ser ≤100 ms. Persistência de rascunho começa a cada alteração, sem debounce, com uma escrita em voo e somente o último snapshot pendente; calendário com 20 itens por célula permanece operável sem deslocar a grade. Ambientes mais lentos registram resultado informativo, mas o gate oficial usa essa referência reproduzível.

**Constraints**: local-first; sem backend, autenticação ou rede em runtime; CSP MV3 restritiva; código e cinco ou mais sons empacotados; duração exata em minutos no domínio e horas somente na apresentação; último salvamento vence apenas para edição de registro; exclusões e configurações continuam protegidas por revisão; pt-BR; tema escuro padrão; sem rolagem horizontal da página; popup de navegador exclusivo para lembretes

**Scale/Scope**: um usuário e perfil local; até 10.000 registros, centenas de projetos, rascunhos de formulários ativos, duas visualizações mensais e quatro larguras de referência (320, 479, 480 e 800 px úteis)

**Modern Web Guidance**: `size-aware-styling`, `css-layout`, `scrollability-affordance-hints`, `forms`, `accessibility`, `format-human-readable-durations`, `security` e `privacy`, consultados/revalidados em 2026-08-17. Aplicação: container queries sobre largura útil; fallback estreito em uma coluna; Grid/Flex sem reordenar o DOM; `min-inline-size: 0`; `overflow:auto` apenas nas células; indicação de conteúdo rolável; controles nativos, nomes acessíveis, foco visível/restaurado, erros anunciados e contraste WCAG AA. A especificação exige continuidade da rolagem no limite da célula, portanto não será aplicado `overscroll-behavior: contain`. Como Chrome 120 não oferece `Temporal` nem `Intl.DurationFormat`, o codec de horas será manual, determinístico, local e sem polyfill ou dependência nova.

**Official Platform and Chrome Documentation**: [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), [Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen), [Runtime contexts](https://developer.chrome.com/docs/extensions/reference/api/runtime/), [Windows API](https://developer.chrome.com/docs/extensions/reference/api/windows), [permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions), [permission list](https://developer.chrome.com/docs/extensions/reference/permissions-list), [autoplay policy](https://developer.chrome.com/blog/autoplay/), [Manifest](https://developer.chrome.com/docs/extensions/reference/manifest), [service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms) e a especificação [Clipboard API](https://www.w3.org/TR/clipboard-apis/), consultados em 2026-08-17. No Chromium, a escrita pode ser autorizada pela ativação transitória do documento com foco; por isso a ação contextual não recebe permissão persistente da extensão. Também foi consultada a [API oficial do Calendar do Ant Design](https://ant.design/components/calendar/) para confirmar que células são customizáveis, mas intervalos entre dias e a política de rolagem continuam sob responsabilidade da aplicação.

**Minimum Chrome Version/Fallbacks**: Chrome 120 permanece o mínimo. `sidePanel` existe desde 114, `sidePanel.open()` e `runtime.getContexts()` desde 116, Offscreen desde 109 e container queries desde Chrome 105. O layout padrão é a coluna estreita mesmo sem container queries. Não usar `sidePanel.onOpened/onClosed` (141/142), `offscreen.hasDocument()` (150) nem `alarms.persistAcrossSessions` (150); detectar o offscreen com `runtime.getContexts()` e reconstruir alarmes no ciclo já existente.

## Constitution Check

_GATE: aprovado antes da Fase 0 e revalidado após o desenho da Fase 1._

- **Simplicity — PASS**: mantém um projeto, o mesmo stack e a mesma separação modular; não adiciona biblioteca de calendário ou estado global. O documento offscreen é a menor solução oficial para áudio iniciado pelo service worker sem depender de autoplay na janela recém-aberta.
- **Layering — PASS**: UI chama casos de uso por contratos; o codec exato minutos↔horas, interseção civil, cores, restauração/remoção e último-salvamento-válido ficam no domínio/aplicação. A UI apenas adiciona apresentação localizada e usa controles; IndexedDB, Side Panel, Clipboard API contextual, popup e áudio implementam portas de infraestrutura.
- **Validation and errors — PASS**: mensagens, rascunhos, configurações, IDs de som, horas localizadas, intervalos entre dias e dados migrados têm schemas; falha de áudio não bloqueia lembrete; migração falha atomicamente; remoção revalida vínculos.
- **Critical tests — PASS**: migração v1→v2, intervalos na meia-noite, último salvamento, remoção irreversível, rascunhos, permissões, áudio e contratos entre contextos possuem cobertura unitária/integrada; fluxos e responsividade possuem E2E.
- **Extension security — PASS**: MV3, CSP sem código remoto, nenhum host permission, mensagens em allowlist e sons locais. `storage`, `sidePanel` e `offscreen` são declaradas; somente `alarms` é opcional e solicitada ao ativar lembretes. Falha de áudio não bloqueia o popup. A cópia exige documento com foco e ativação transitória, sem `clipboardRead` ou `clipboardWrite` persistentes.
- **Current guidance — PASS**: guias modernos e documentação oficial atual do Chrome estão registrados e refletidos em `research.md`, contratos e quickstart.

## Project Structure

### Documentation (this feature)

```text
specs/002-side-panel-views/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── messages.md
│   ├── platform.md
│   ├── storage.md
│   └── ui.md
└── tasks.md                 # criado posteriormente por /speckit-tasks
```

### Source Code (repository root)

```text
manifest.json
sidepanel.html
reminder.html
audio.html
vite.config.ts
public/
├── audio/                   # cinco ou mais WAVs locais + catálogo estático
└── data/holidays/
src/
├── background/
│   ├── service-worker.ts
│   ├── alarms.ts
│   ├── messages.ts
│   ├── reminder-window.ts
│   ├── side-panel.ts
│   ├── audio.ts
│   └── handlers/
├── offscreen/
│   └── audio-player.ts
├── ui/
│   ├── sidepanel-main.tsx
│   ├── reminder-main.tsx
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── DailyView.tsx
│   │   │   ├── FortnightView.tsx
│   │   │   ├── MonthlyView.tsx
│   │   │   ├── NoticeCalendar.tsx
│   │   │   └── EventRangeCalendar.tsx
│   │   ├── projects/
│   │   ├── records/
│   │   └── settings/
│   ├── hooks/
│   ├── theme/
│   └── utils/
├── application/
│   ├── ports/
│   ├── queries/
│   └── use-cases/
├── domain/
│   ├── entities/
│   ├── errors/
│   ├── services/
│   └── value-objects/
├── infrastructure/
│   ├── chrome/
│   ├── holidays/
│   └── persistence/
└── shared/
    ├── contracts/
    └── validation/
tests/
├── contract/
├── e2e/
├── fixtures/
├── integration/
├── performance/
└── unit/
```

**Structure Decision**: preservar o projeto modular atual. `sidepanel.html` e `reminder.html` montam shells React distintos que reutilizam componentes e casos de uso; o popup não expõe a navegação completa. `audio.html` contém somente o player offscreen e recebe mensagens validadas. O antigo `popup-window.ts` torna-se `reminder-window.ts`; a action deixa de chamá-lo. Nenhuma regra de domínio importa React, Ant Design ou APIs Chrome.

## Complexity Tracking

Nenhuma violação constitucional. O contexto offscreen adicional é isolado e justificado: o service worker não tem DOM e a reprodução automática em uma página recém-aberta não é garantida pela política do Chrome. A alternativa de tocar apenas no popup poderia falhar silenciosamente; a alternativa de uma biblioteca de áudio seria mais complexa e desnecessária. A Clipboard API não é elevada por permissão de extensão: roda somente no documento do Side Panel com foco e ativação transitória, portanto a descrição não é enviada ao service worker e nenhuma capacidade persistente é concedida.

## Revalidação pós-design

- Os modelos v2 mantêm datas civis e minutos inteiros como fonte de verdade; o codec decimal reversível pertence à aplicação e a UI apenas apresenta seu resultado.
- A migração IndexedDB é única, transacional e não destrutiva; rascunhos têm store separada e não entram em consultas ou totais.
- O último salvamento aplica-se somente a `record.update`; remoção de registro/projeto e configurações preservam compare-and-swap ou revalidação transacional.
- Side Panel, popup e offscreen usam contratos de mensagem discriminados e validação de remetente; nenhum conteúdo de usuário vira HTML ou diagnóstico.
- Permissões não incluem `tabs`, `activeTab` ou hosts. `offscreen` é declarada para áudio local e `alarms` é a única permissão opcional solicitada no gesto de ativar lembretes.

## Revalidação final de APIs e decisões (2026-08-17)

- A referência atual do [Chrome Side Panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) mantém `sidePanel` disponível em MV3 desde o Chrome 114, `open()` desde o 116 e `setPanelBehavior({ openPanelOnActionClick: true })` como fluxo oficial da action. Eventos de abertura/fechamento exigem Chrome mais recente que o mínimo 120; por isso a implementação continua sem depender deles e usa rascunhos persistidos para recuperação.
- A referência de [documentos offscreen](https://developer.chrome.com/docs/extensions/reference/api/offscreen) confirma URL HTML local, apenas `chrome.runtime` para integração, uma instância por perfil e encerramento após 30 segundos de inatividade para `AUDIO_PLAYBACK`. `hasDocument()` permanece Chrome 150+; o código mantém `runtime.getContexts()` (Chrome 116+) e promessa apenas para deduplicar criação em voo.
- A referência de [alarmes](https://developer.chrome.com/docs/extensions/reference/api/alarms) confirma atraso arbitrário, disparo perdido único após suspensão e `persistAcrossSessions` somente no Chrome 150+. O mínimo segue 120, portanto instalação, startup, retomada e disparo reconciliam o estado persistido sem depender dessa propriedade.
- O guia oficial do [ciclo de vida do service worker](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) reafirma que variáveis globais são perdidas ao encerrar o worker. IndexedDB/`chrome.storage.local` continuam como fonte de verdade; promises globais apenas coordenam trabalho concorrente na execução atual. O E2E v2 encerra o worker e prova reconstrução do schema/preferências.
- A especificação W3C da [Clipboard API](https://www.w3.org/TR/clipboard-apis/) mantém ativação transitória no algoritmo de escrita. O adaptador chama exclusivamente `writeText()` no handler imediato, exige documento focado/ativação e não declara permissão persistente, leitura ou fallback legado.
- A especificação W3C de [CSS Containment Level 3](https://www.w3.org/TR/css-contain-3/) define `inline-size` pela content box do container. O breakpoint de 480 px permanece no wrapper `container-type: inline-size`; `ResizeObserver` escolhe a estrutura acessível agenda/grade usando a mesma largura útil, enquanto a `@container` estabiliza a densidade visual.

**Impacto da revalidação**: nenhuma troca de biblioteca, permissão ou arquitetura foi necessária. Foram mantidos os fallbacks já planejados para Chrome 120 e adicionados gates automatizados de restart, ativação do clipboard, overflow encadeado, forced colors, reduced motion e larguras úteis.
