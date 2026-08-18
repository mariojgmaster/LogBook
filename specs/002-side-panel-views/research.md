# Research — Side Panel e Visualizações Aprimoradas

**Date**: 2026-08-17
**Baseline**: implementação e artefatos de `specs/001-project-logbook`

## Stack e dependências

**Decision**: manter as versões já instaladas: TypeScript 5.9.2, React 19.2.8, Ant Design 6.6.1, Vite 8.2.1, Zod 4.4.3, `idb` 8.0.3, Day.js 1.11.23, Vitest/RTL e Playwright. Não adicionar biblioteca de calendário, áudio, estado ou formulário.

**Rationale**: o código atual já possui camadas, calendário próprio, mensageria, persistência e testes. CSS Grid, container queries, `HTMLAudioElement` e APIs MV3 cobrem a versão 002 sem elevar bundle, superfície de atualização ou acoplamento.

**Alternatives considered**: FullCalendar/React Big Calendar para Event Range; biblioteca de áudio; store global. Rejeitadas porque duplicariam infraestrutura existente para um escopo pequeno.

## Side Panel como entrada principal

**Decision**: declarar `side_panel.default_path` apontando para `sidepanel.html`, adicionar permissão `sidePanel` e configurar `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`. Remover da action o caminho que abre a janela principal. Manter `chrome.windows.create({ type: 'popup' })` apenas no disparo de lembrete, apontando para `reminder.html`.

**Rationale**: a documentação oficial oferece Side Panel desde Chrome 114 e abertura por action como comportamento nativo. Entradas HTML separadas tornam impossível abrir acidentalmente Diário/Projetos/Configurações em popup e deixam o popup de lembrete mínimo.

**Alternatives considered**: chamar `sidePanel.open()` em todo clique; reutilizar `index.html` com query string; manter uma janela como fallback. O comportamento nativo reduz listeners e `open()` exige gesto; entradas compartilhadas aumentam risco de expor o shell errado; fallback em janela viola a spec.

**Sources**: [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel), [Manifest](https://developer.chrome.com/docs/extensions/reference/manifest), consultados em 2026-08-17.

## Som do lembrete

**Decision**: fornecer pelo menos cinco WAVs curtos em `public/audio`, identificados por catálogo estático. Preview usa `HTMLAudioElement.play()` no Side Panel após clique. No disparo, o service worker garante um documento offscreen `audio.html` com motivo `AUDIO_PLAYBACK` e envia `{ soundId, playbackId }`; o documento resolve somente IDs allowlisted e reproduz uma vez. `runtime.getContexts()` evita duplicatas no Chrome 120.

**Rationale**: service workers não têm DOM. A política geral de autoplay pode rejeitar `play()` sem gesto em uma janela recém-aberta, enquanto a Offscreen API documenta explicitamente `AUDIO_PLAYBACK` e encerra o documento após 30 segundos sem áudio. WAV elimina codec ou dependência adicional. Preview sob gesto permanece simples.

**Alternatives considered**: tocar apenas em `reminder.html`; Web Audio no popup; biblioteca externa; notificação do sistema. A primeira não garante reprodução automática, as duas seguintes não resolvem a política ou agregam dependência, e notificação não atende ao popup dedicado.

**Sources**: [Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen), [runtime.getContexts](https://developer.chrome.com/docs/extensions/reference/api/runtime/), [Autoplay policy](https://developer.chrome.com/blog/autoplay/), consultados em 2026-08-17.

## Permissões

**Decision (revisada após validação do disparo)**: `storage`, `sidePanel` e `offscreen` serão declaradas; somente `alarms` ficará em `optional_permissions` e será solicitada ao ativar lembretes. Popup e agenda dependem apenas de `alarms`; falha de áudio é recuperável. A cópia usa `navigator.clipboard.writeText()` no documento do Side Panel com foco e dentro da ativação transitória do botão, sem declarar `clipboardRead` ou `clipboardWrite`. Nenhum host permission, `tabs`, `activeTab`, `notifications` ou `audio` será solicitado.

**Rationale**: Side Panel é o contêiner central e armazenamento é indispensável. No Chromium, a escrita pode ser autorizada pela ativação transitória, enquanto a permissão persistente `clipboardWrite` amplia a capacidade e exibe aviso; a ação contextual não precisa dessa ampliação. Alarmes e áudio pertencem a um recurso opcional e devem ser explicados no momento de ativação. `chrome.audio` controla dispositivos no ChromeOS e não é necessário para reproduzir um arquivo.

**Alternatives considered**: tornar `offscreen` obrigatório; declarar `clipboardWrite`; copiar via `execCommand` legado; pedir `tabs`. Rejeitadas por privilégio mínimo, API obsoleta ou falta de necessidade.

**Sources**: [Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions), [Permissions API](https://developer.chrome.com/docs/extensions/reference/api/permissions), [permission list](https://developer.chrome.com/docs/extensions/reference/permissions-list) e [Clipboard API](https://www.w3.org/TR/clipboard-apis/), consultados em 2026-08-17.

## Responsividade do Side Panel

**Decision**: definir o conteúdo principal como contêiner de `inline-size`; abaixo de 480 px usar fluxo mestre→detalhe em uma coluna e agenda mensal vertical; a partir de 480 px usar mestre–detalhe e calendário. O DOM mantém ordem lógica e o fallback sem suporte é sempre a coluna estreita. Testar 320, 479, 480 e 800 px de largura útil.

**Rationale**: container queries respondem ao espaço real do Side Panel, não ao viewport da página visitada. São Baseline desde 2023 e suportadas antes do Chrome mínimo. Grid atende calendários; Flex atende toolbars; `min-inline-size:0` evita estouro.

**Alternatives considered**: media queries de viewport, redimensionamento observado em JavaScript e ocultação progressiva de conteúdo. Rejeitadas por acoplamento ao contêiner errado, complexidade e perda de informação.

**Guides**: `size-aware-styling`, `css-layout`, `accessibility` do `modern-web-guidance`, consultados em 2026-08-17.

## Células mensais roláveis

**Decision**: a partir de 480 px, a área de conteúdo de cada dia tem altura estável, `overflow-y:auto`, foco programático/teclado, rótulo acessível e affordance por sombra/gradiente quando houver conteúdo além do limite. Não conter a cadeia de rolagem: ao alcançar início/fim, a página deve continuar rolando conforme a spec.

**Rationale**: a API do Calendar Ant Design aceita conteúdo e classes customizados, mas não promete a interação pedida. O controle explícito mantém a grade estável, suporta teclado e satisfaz a continuidade da rolagem.

**Alternatives considered**: expandir linhas, `+N mais`, scrollbars customizadas e `overscroll-behavior:contain`. Todas contradizem a decisão de UX ou a continuidade exigida.

**Sources**: [Ant Design Calendar](https://ant.design/components/calendar/); guias `scrollability-affordance-hints`, `css-layout` e `accessibility`, consultados em 2026-08-17.

## Notice Calendar e Event Range

**Decision**: manter um `MonthlyView` orquestrador e duas renderizações sem dependência nova. Notice Calendar segmenta visualmente um registro por cada dia civil intersectado; Event Range calcula faixas semiabertas e usa CSS Grid para atravessar colunas, dividindo visualmente apenas nas bordas de semana. Ambas reutilizam a mesma consulta, seleção, cores e totais. Abaixo de 480 px, Notice agrupa por dia e Event Range mostra um cartão único por registro com início e fim.

**Rationale**: uma faixa não pode atravessar a quebra semanal de uma grid sem segmentos visuais, mas todos os segmentos apontam para a mesma identidade. O modelo semiaberto evita item de duração zero no dia final e duplicação de totais.

**Alternatives considered**: persistir segmentos diários; duplicar registros na consulta; usar componente externo. Rejeitadas por risco de integridade e dependência desnecessária.

## Cor estável por projeto

**Decision**: adicionar `colorSlot` persistido ao projeto, com paleta fixa baseada nos tokens do tema e pelo menos 12 slots contrastantes. A migração atribui slots por `createdAt,id`; novo projeto recebe o slot menos usado. Após esgotar a paleta, slots podem repetir, sempre acompanhados pelo nome do projeto.

**Rationale**: hash puro admite colisões precoces e alocação derivada da lista muda após exclusões. Persistência garante estabilidade entre consultas, e texto preserva acessibilidade.

**Alternatives considered**: hash do UUID, escolha manual e cor calculada pela ordem visível. Rejeitadas por colisão, escopo excluído ou instabilidade.

## Duração em horas sem perda

**Decision**: manter minutos inteiros em entidades, armazenamento, cálculos e mensagens internas. Criar na camada de aplicação um codec com `formatDurationHours(minutes)` e `parseDurationHours(text)`: o formatador usa pt-BR e até quatro casas; o parser normaliza vírgula e primeiro aceita valores cujo produto por 60 seja exatamente inteiro. Para frações recorrentes, consulta o mapa reverso das strings canônicas geradas para cada minuto válido, tolerando somente zeros finais. Exemplos: `120→2 h`, `30→0,5 h`, `1→0,0167 h`.

**Rationale**: minutos são a fonte exata existente. Horas decimais finitas não representam 1 minuto exatamente; o mapa canônico reverso permite entrada em horas sem mudar o minuto persistido nem arredondar silenciosamente. `Temporal` e `Intl.DurationFormat` não estão disponíveis no Chrome 120 e não resolvem o decimal canônico solicitado; portanto não há polyfill nem dependência nova.

**Alternatives considered**: converter o domínio para `number` de horas; aceitar arredondamento; limitar a incrementos de 6 minutos. Rejeitadas por erro binário, violação da spec ou redução do intervalo válido.

## Registro atravessando meia-noite

**Decision**: manter `localDate` como data inicial e acrescentar `endLocalDate`; `startMinute` e `endMinute` ficam entre 0 e 1439. O intervalo é `[início,fim)`, maior que zero, no máximo 1.440 minutos e termina no mesmo dia ou no seguinte. Consultas de período leem desde o dia anterior ao início e filtram interseção; classificações dividem a duração por data antes de aplicar feriado/jornada.

**Rationale**: a janela máxima de 24 horas limita o lookback a um dia e evita novo índice. Data final explícita resolve meia-noite sem `24:00` ambíguo.

**Alternatives considered**: `endMinute` até 2879; timestamps UTC; segmentos persistidos. Rejeitadas por semântica menos clara, quebra de data civil e duplicação.

## Concorrência e operações de projeto

**Decision**: `record.update` passa a ser last-write-wins: em transação, lê o registro atual, aplica o payload completo, preserva `createdAt` e grava `revision=current+1`, ignorando a revisão observada pelo editor. `record.delete`, configurações e projetos mantêm revisão esperada. Restaurar projeto revalida nome ativo; remover abre transação sobre projetos+records e só exclui se continuar arquivado e sem vínculo.

**Rationale**: implementa exatamente a clarificação sem enfraquecer ações irreversíveis. A revisão continua útil para eventos e exclusão.

**Alternatives considered**: remover revisões por completo, merge de campos e diálogo de conflito. Rejeitadas por impacto amplo ou decisão explícita do usuário.

## Rascunhos

**Decision**: criar store IndexedDB `formDrafts`, acessada por `DraftRepository` e casos de uso/mensagens. Registro, projeto, seções de Configurações e snooze usam contextos/valores discriminados e allowlisted. Cada alteração entra imediatamente, sem debounce, em uma fila coalescente: no máximo uma escrita em voo e o valor mais recente pendente. Navegação interna aguarda a fila; fechamento externo recupera o último snapshot confirmado. Salvar ou descartar remove o rascunho; consultas, totais e lembretes nunca leem essa store.

**Rationale**: a mensagem já enviada sobrevive ao fechamento da view e o service worker conclui a escrita. Coalescência evita fila por tecla sem depender de debounce que poderia perder os últimos caracteres.

**Alternatives considered**: `localStorage` direto na UI, debounce com flush em `pagehide`, estado apenas em React. Rejeitadas por violar camadas ou não garantir recuperação.

## Migração e compatibilidade

**Decision**: elevar IndexedDB para v2. Em uma única transação, criar `formDrafts`, atribuir `colorSlot` a projetos e adicionar `endLocalDate` a registros; `endMinute=1440` vira dia seguinte/0, demais registros mantêm data final igual à inicial. `chrome.storage.local` passa a envelopes v2 com defaults `monthViewMode='notice'` e primeiro `reminderSoundId`, aceitando e migrando envelopes v1.

**Rationale**: mudança incremental preserva todos os dados e permite rollback natural pela atomicidade do upgrade. Defaults não alteram registros ou lembretes existentes.

**Alternatives considered**: limpar/reimportar banco e migração preguiçosa por leitura. Rejeitadas por risco de perda e estados mistos.
