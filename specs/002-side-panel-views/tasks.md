---

description: "Tarefas de implementação da spec 002 — Side Panel e visualizações aprimoradas"
---

# Tasks: Side Panel e Visualizações Aprimoradas

**Input**: documentos de design em `specs/002-side-panel-views/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: obrigatórios antes da implementação correspondente para contratos alterados, migração, permissões, concorrência, integridade de dados, ações irreversíveis, responsividade e regras críticas de calendário.

**Organization**: tarefas agrupadas por história para permitir implementação e validação independentes, preservando a stack e as camadas atuais.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: fixar primeiro os contratos críticos de empacotamento e depois preparar entradas, fixtures e diretórios compartilhados.

- [X] T001 Escrever teste de contrato inicialmente falho para as três entradas Vite, shells locais, ausência de entrada principal legada e proibição de código remoto em `tests/contract/entry-packaging-v2.test.ts`
- [X] T002 Configurar `sidepanel.html`, `reminder.html` e `audio.html` no `vite.config.ts` e criar os três shells HTML locais, preservando React 19, Ant Design 6 e TypeScript strict
- [X] T003 [P] Criar builders de dados v1/v2, variantes de `FormDraft` e snapshots inválidos em `tests/fixtures/storage-v2.ts`
- [X] T004 [P] Ampliar doubles de Chrome para Side Panel, offscreen, permissões, janelas, áudio e clipboard em `tests/fixtures/chrome.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: estabelecer contratos, migração e adaptadores compartilhados.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

### Tests for Foundational Infrastructure

- [X] T005 [P] Escrever testes de domínio para intervalo de até 24 horas atravessando no máximo uma meia-noite, `Project.colorSlot`, preferências v2 e entradas inválidas em `tests/unit/domain/v2-entities.test.ts`
- [X] T006 [P] Escrever testes de contrato para envelopes v2, remetente confiável, allowlists, limites e rascunhos de registro/projeto/configurações/snooze em `tests/contract/messages-v2.test.ts`
- [X] T007 Escrever testes de migração atômica v1→v2, incluindo `endMinute=1440`, defaults, metadados legados, dados inválidos e rollback em `tests/integration/persistence/migrations.test.ts`
- [X] T008 [P] Escrever testes de persistência das variantes de `FormDraft`, limite de 8 KiB, último snapshot confirmado e recuperação após falha/quota em `tests/integration/persistence/draft-repository.test.ts`
- [X] T009 [P] Escrever testes de contrato para CSP, código local, permissões mínimas/opcionais e ausência de `clipboardRead`/`clipboardWrite` em `tests/contract/manifest-security.test.ts`

### Implementation for Foundational Infrastructure

- [X] T010 Implementar `LogRecord` v2, intervalo semiaberto, `Project.colorSlot` e preferências v2 com validação Zod em `src/domain/entities/log-record.ts`, `src/domain/value-objects/time-range.ts`, `src/domain/entities/project.ts` e `src/domain/entities/user-settings.ts`
- [X] T011 [P] Definir portas substituíveis para rascunhos e capacidades de Side Panel, áudio, permissões e clipboard em `src/application/ports/repositories.ts` e `src/application/ports/platform.ts`
- [X] T012 Implementar esquemas discriminados v2, limites e erros controlados em `src/shared/contracts/messages.ts`
- [X] T013 Implementar upgrade IndexedDB v2 atômico, store `formDrafts` e defaults determinísticos em `src/infrastructure/persistence/indexeddb/database.ts` e `src/infrastructure/persistence/indexeddb/migrations.ts`
- [X] T014 Implementar persistência validada de `FormDraft` discriminado por superfície/formulário/entidade/seção, com allowlist e limite de 8 KiB, em `src/infrastructure/persistence/indexeddb/draft-repository.ts`
- [X] T015 [P] Implementar envelope de configurações v2 com recuperação e falhas controladas em `src/infrastructure/persistence/chrome-storage/settings-store.ts` e `src/infrastructure/persistence/chrome-storage/settings-repository.ts`
- [X] T016 Atualizar repositórios de projetos, registros e consultas para campos v2 sem acesso direto da UI em `src/infrastructure/persistence/indexeddb/project-repository.ts`, `src/infrastructure/persistence/indexeddb/log-record-repository.ts` e `src/infrastructure/persistence/indexeddb/record-query-repository.ts`
- [X] T017 Validar remetente/payload, manter delete/projetos/configurações com CAS e aplicar last-write-wins somente a `record.update` em `src/background/messages.ts`, `src/background/handlers/records.ts` e `src/application/use-cases/records/update-record.ts`
- [X] T018 Registrar listeners no escopo superior e compor portas/repositórios v2 sem estado global como fonte de verdade em `src/background/service-worker.ts` e `src/application/composition-root.ts`

**Checkpoint**: migração, contratos, validação e composição v2 estão prontos.

---

## Phase 3: User Story 1 — Aplicação no Side Panel e lembrete sonoro (Priority: P1) 🎯 MVP

**Goal**: abrir a aplicação no Side Panel, reservar popup ao lembrete e oferecer som configurável com preview, rascunhos e responsividade.

**Independent Test**: a ação abre Diário/Projetos/Configurações no Side Panel; um alarme cria ou reutiliza somente o popup restrito, toca uma vez o som salvo e mantém formulário recuperável em 320, 479, 480 e 800 px.

### Tests for User Story 1

> Escrever primeiro e confirmar falha relevante antes da implementação.

- [X] T019 [P] [US1] Escrever teste do manifest para `side_panel.default_path`, somente `storage`/`sidePanel` obrigatórias, opcionais `alarms`/`offscreen` e ausência de popup principal em `tests/contract/manifest-v2.test.ts`
- [X] T020 [P] [US1] Escrever testes de abertura global do Side Panel, janela incompatível, reabertura e destino persistido em `tests/integration/chrome/side-panel.test.ts`
- [X] T021 [P] [US1] Escrever testes de permissões para concessão total/parcial, negação, revogação e reativação em `tests/integration/chrome/reminder-permissions-v2.test.ts`
- [X] T022 [P] [US1] Escrever testes de playback único por ocorrência, reuso do offscreen, snooze e falha de asset/dispositivo em `tests/integration/chrome/reminder-audio.test.ts`
- [X] T023 [P] [US1] Escrever testes de UI para cinco previews, interrupção do anterior, seleção não salva e erro junto ao item em `tests/integration/ui/reminder-sound-settings.test.tsx`
- [X] T024 [P] [US1] Escrever testes de rascunho sem debounce, fila coalescente, `flush()` na navegação, fechamento durante escrita, último snapshot confirmado e falha de limpeza após salvar em `tests/integration/ui/form-drafts.test.tsx`
- [X] T025 [US1] Escrever fluxo E2E distinguindo Side Panel, overlays Ant Design e popup restrito em `tests/e2e/us1-side-panel-reminder.spec.ts`

### Implementation for User Story 1

- [X] T026 [P] [US1] Criar entradas React independentes em `src/ui/sidepanel-main.tsx`, `src/ui/reminder-main.tsx` e `src/offscreen/audio-main.ts`
- [X] T027 [US1] Declarar Side Panel global, permissões mínimas/opcionais, CSP MV3 e páginas empacotadas em `manifest.json`
- [X] T028 [P] [US1] Implementar abertura/foco do Side Panel com falhas controladas em `src/infrastructure/chrome/side-panel-adapter.ts`
- [X] T029 [US1] Substituir a ação do ícone pelo Side Panel e retirar o fluxo de janela principal em `src/background/service-worker.ts` e `src/background/popup-window.ts`
- [X] T030 [US1] Restringir criação/reuso de popup ao lembrete, atualizando ocorrência e foco em `src/background/popup-window.ts` e `src/ui/app/ReminderApp.tsx`
- [X] T031 [P] [US1] Empacotar catálogo tipado com IDs estáveis/default e cinco sons locais em `src/shared/reminder-sounds.ts`, `public/sounds/reminder-01.wav`, `public/sounds/reminder-02.wav`, `public/sounds/reminder-03.wav`, `public/sounds/reminder-04.wav` e `public/sounds/reminder-05.wav`
- [X] T032 [US1] Implementar preview iniciado pelo usuário, cancelamento do anterior e tratamento de falha em `src/infrastructure/browser/audio-preview-adapter.ts`
- [X] T033 [US1] Implementar documento offscreen, deduplicação e encerramento seguro sem bloquear popup em `src/background/audio-playback.ts` e `src/offscreen/audio-main.ts`
- [X] T034 [US1] Implementar ativação/revogação de lembretes e mensagens allowlisted de som em `src/background/handlers/reminders.ts`, `src/infrastructure/chrome/alarm-adapter.ts` e `src/background/alarms.ts`
- [X] T035 [US1] Adicionar som salvo independentemente e preview às configurações em `src/application/use-cases/settings/update-reminder-sound.ts`, `src/background/handlers/settings.ts` e `src/ui/features/settings/ReminderSettings.tsx`
- [X] T036 [US1] Implementar hook sem debounce com uma escrita em voo, último snapshot pendente, `flush()` e estados protegendo/salvo/falhou em `src/ui/hooks/useFormDraft.ts`
- [X] T037 [US1] Separar apps, preservar destino/seleção/filtros/scroll/foco no breakpoint e integrar rascunhos nos formulários em `src/ui/app/SidePanelApp.tsx`, `src/ui/app/ReminderApp.tsx`, `src/ui/features/records/RecordForm.tsx`, `src/ui/features/records/SnoozeForm.tsx`, `src/ui/features/projects/ProjectForm.tsx`, `src/ui/features/settings/SettingsPage.tsx` e `src/ui/theme/global.css`

**Checkpoint**: o MVP funciona no Side Panel e o único popup do navegador é o lembrete.

---

## Phase 4: User Story 2 — Durações visíveis e editáveis em horas (Priority: P1)

**Goal**: manter minutos inteiros internamente e apresentar/aceitar horas pt-BR sem perda.

**Independent Test**: 120 e 30 minutos aparecem/editam como `2 h` e `0,5 h`; frações usam até quatro casas, entrada inválida não altera dados e nenhuma duração visível usa `min`.

### Tests for User Story 2

- [X] T038 [P] [US2] Escrever testes do codec de aplicação para conversão reversível, limites, vírgula, quatro casas, mapa canônico de frações recorrentes e entradas não canônicas em `tests/unit/application/duration-hours-codec.test.ts`
- [X] T039 [P] [US2] Escrever testes de contrato garantindo minutos nas mensagens e horas apenas na borda da UI em `tests/contract/duration-messages.test.ts`
- [X] T040 [P] [US2] Escrever testes dos formulários criar/editar/snooze e erros sem mutação persistida em `tests/integration/ui/duration-hour-forms.test.tsx`
- [X] T041 [US2] Escrever auditoria E2E de todas as telas, totais e mensagens sem duração em minutos em `tests/e2e/us2-hours-everywhere.spec.ts`

### Implementation for User Story 2

- [X] T042 [US2] Implementar o codec exato minutos↔horas pt-BR, incluindo produto inteiro e mapa reverso das strings canônicas, em `src/application/services/duration-hours-codec.ts`
- [X] T043 [P] [US2] Criar controle Ant Design acessível que consuma o codec por contrato, com sufixo `h`, teclado decimal, exemplo e validação em `src/ui/components/DurationHoursField.tsx`
- [X] T044 [US2] Substituir entradas de duração por horas nos formulários e invocar o codec da aplicação somente no submit em `src/ui/features/records/RecordForm.tsx` e `src/ui/features/records/SnoozeForm.tsx`
- [X] T045 [P] [US2] Atualizar cards, detalhes e totais do Diário/Quinzena/Mês em `src/ui/features/dashboard/DailyView.tsx`, `src/ui/features/dashboard/FortnightView.tsx` e `src/ui/features/dashboard/MonthlyView.tsx`
- [X] T046 [P] [US2] Atualizar detalhes, projetos, configurações e lembrete para a unidade `h` em `src/ui/features/records/RecordDetailsPanel.tsx`, `src/ui/features/projects/ProjectList.tsx`, `src/ui/features/settings/ReminderSettings.tsx` e `src/ui/app/ReminderApp.tsx`
- [X] T047 [US2] Garantir minutos inteiros em mensagens, rascunhos e casos de uso apesar da entrada em horas em `src/shared/contracts/messages.ts`, `src/application/use-cases/records/create-record.ts` e `src/application/use-cases/records/update-record.ts`

**Checkpoint**: a unidade visível é hora em todas as superfícies.

---

## Phase 5: User Story 3 — Restaurar ou remover projetos arquivados (Priority: P2)

**Goal**: restaurar projetos com histórico ou remover definitivamente somente arquivados sem vínculos.

**Independent Test**: restauração preserva registros; remoção de vazio exige confirmação; nome duplicado, vínculo tardio, revisão antiga e falha mantêm o card com erro contextual.

### Tests for User Story 3

- [X] T048 [P] [US3] Escrever testes de domínio para restauração, nome ativo duplicado, remoção apenas arquivada e cor preservada em `tests/unit/domain/project-lifecycle-v2.test.ts`
- [X] T049 [P] [US3] Escrever testes transacionais para projeto vazio/com vínculos e criação tardia de registro em `tests/integration/persistence/project-removal.test.ts`
- [X] T050 [P] [US3] Escrever testes de contrato para restaurar/remover, revisão antiga, payload inválido e falha dependente em `tests/contract/project-lifecycle-messages.test.ts`
- [X] T051 [US3] Escrever testes de UI para confirmação irreversível, bloqueio explicado, foco/scroll e anúncios em `tests/integration/ui/archived-projects.test.tsx`
- [X] T052 [US3] Escrever fluxo E2E inicialmente falho de restauração/remoção com vínculos, conflitos e retry em `tests/e2e/us3-archived-projects.spec.ts`

### Implementation for User Story 3

- [X] T053 [P] [US3] Implementar restauração com unicidade ativa e CAS em `src/application/use-cases/projects/restore-project.ts`
- [X] T054 [P] [US3] Implementar remoção definitiva com pré-condições e erro tipado em `src/application/use-cases/projects/remove-project.ts`
- [X] T055 [US3] Implementar transações atômicas e revalidar vínculos no commit em `src/infrastructure/persistence/indexeddb/project-repository.ts`
- [X] T056 [US3] Expor handlers validados e publicar `entity.changed` somente após commit em `src/background/handlers/projects.ts` e `src/shared/contracts/messages.ts`
- [X] T057 [US3] Adicionar Restaurar/Remover, erros junto ao card e confirmação com nome em `src/ui/features/projects/ProjectList.tsx` e `src/ui/features/projects/ProjectsPage.tsx`
- [X] T058 [US3] Integrar rascunho de projeto e proteger formulário sujo de evento externo em `src/ui/features/projects/ProjectForm.tsx`

**Checkpoint**: projetos arquivados têm ciclo de vida completo e seguro.

---

## Phase 6: User Story 4 — Cópia no Dia e Quinzena minimalista (Priority: P2)

**Goal**: copiar descrição no Dia e simplificar dias vazios da Quinzena.

**Independent Test**: copiar transfere somente `details`, não abre o card e anuncia resultado; dias vazios mostram data e “Sem registros”, sem resumo nem botão local.

### Tests for User Story 4

- [X] T059 [P] [US4] Escrever testes do clipboard para sucesso sob foco/ativação transitória, ausência de gesto, rejeição, indisponibilidade, ausência de leitura e ausência de permissão persistente em `tests/unit/infrastructure/clipboard-adapter.test.ts`
- [X] T060 [US4] Escrever testes de UI para copiar por clique/teclado, propagação bloqueada, nome acessível e quinzena vazia/preenchida em `tests/integration/ui/day-fortnight-v2.test.tsx`
- [X] T061 [US4] Escrever fluxo E2E de cópia, estados minimalistas e ação Novo registro global em `tests/e2e/us4-day-fortnight.spec.ts`

### Implementation for User Story 4

- [X] T062 [P] [US4] Implementar `navigator.clipboard.writeText` somente no gesto imediato e documento com foco, com erro controlado, sem leitura, permissão persistente ou fallback legado, em `src/infrastructure/browser/clipboard-adapter.ts`
- [X] T063 [US4] Adicionar ícone Copiar ao lado de Detalhes, nome contextual, clique isolado e anúncio em `src/ui/features/dashboard/DailyView.tsx`
- [X] T064 [US4] Renderizar dia vazio compacto sem `DailyView`, totais ou botão local em `src/ui/features/dashboard/FortnightView.tsx`
- [X] T065 [US4] Ajustar alvos de 44×44, foco visível e quebra de toolbar em `src/ui/theme/global.css`

**Checkpoint**: Dia e Quinzena funcionam independentemente das visões mensais.

---

## Phase 7: User Story 5 — Notice Calendar e Event Range configuráveis (Priority: P3)

**Goal**: oferecer dois modos mensais persistidos, cores, registros noturnos e grade/agenda responsivas.

**Independent Test**: o modo persiste; projetos distinguíveis têm cores; registro noturno ocupa dias corretos e mantém uma identidade; 320/479 px usam agenda e 480/800 px usam grade com scroll interno acessível.

### Tests for User Story 5

- [X] T066 [P] [US5] Escrever testes de projeção para limites do mês, todos os inícios de semana, meia-noite, 24 horas, quebra semanal, filtros e intervalo semiaberto em `tests/unit/domain/month-projection.test.ts`
- [X] T067 [P] [US5] Escrever testes de classificação/totais por interseção diária sem duplicar registros noturnos em `tests/unit/domain/hour-classifier-v2.test.ts`
- [X] T068 [P] [US5] Escrever testes da consulta com lookback de um dia, overlap, ordenação, filtros e inválidos em `tests/integration/queries/month-overlap-query.test.ts`
- [X] T069 [P] [US5] Escrever testes de UI dos modos, cores com nome e Event Range com um `recordId`, nome acessível, seleção e destino lógicos compartilhados entre segmentos, sem tabulação/totais duplicados, em `tests/integration/ui/month-views-v2.test.tsx`
- [X] T070 [US5] Escrever E2E de responsividade e overflow com 1, 4 e 20 itens, teclado/wheel, foco e scroll chaining em `tests/e2e/us5-month-overflow.spec.ts`
- [X] T071 [P] [US5] Criar benchmark no ambiente de referência com 5 aquecimentos/20 amostras, 10.000 registros, consulta completa e gate p95 ≤2 s, incluindo medição de feedback local ≤100 ms, em `tests/performance/month-query-v2.bench.ts`

### Implementation for User Story 5

- [X] T072 [P] [US5] Implementar segmentação por dia e faixa semanal mantendo um `recordId` lógico em `src/domain/services/month-projection.ts`
- [X] T073 [US5] Dividir classificação/totais por dia sem alimentar domínio com segmentos visuais em `src/domain/services/hour-classifier.ts` e `src/application/queries/get-hour-summary.ts`
- [X] T074 [US5] Consultar registros que intersectam o mês com lookback e filtros validados em `src/infrastructure/persistence/indexeddb/record-query-repository.ts` e `src/application/queries/list-records-by-period.ts`
- [X] T075 [P] [US5] Implementar atribuição determinística dos 12 slots, reutilização e contraste em `src/domain/services/project-color-assignment.ts` e `src/ui/theme/project-colors.ts`
- [X] T076 [US5] Implementar persistência independente do modo mensal em `src/application/use-cases/settings/update-month-view.ts` e `src/ui/features/settings/SettingsPage.tsx`
- [X] T077 [P] [US5] Criar Notice Calendar para grade e agenda, omitindo dias vazios na agenda e segmento vazio às 00:00 em `src/ui/features/dashboard/NoticeCalendar.tsx`
- [X] T078 [P] [US5] Criar Event Range em CSS Grid e cartão estreito, segmentando somente o desenho em semanas e preservando `recordId`, nome acessível, seleção, tabulação única e destino compartilhado em `src/ui/features/dashboard/EventRangeCalendar.tsx`
- [X] T079 [US5] Orquestrar modo, mês, filtros, detalhes e loading/vazio/falha/retry sem trocar para Dia em `src/ui/features/dashboard/MonthlyView.tsx`
- [X] T080 [US5] Implementar container query de 480 px, grade de sete colunas, altura estável, affordance e scroll nativo encadeado em `src/ui/theme/month-calendar.css`

**Checkpoint**: ambos os modos atendem intervalos, cores, persistência e responsividade.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T081 [P] Documentar instalação, Side Panel, permissões, sons, horas, migração e modos mensais em `README.md`
- [X] T082 [P] Atualizar fixture E2E e jornadas do quickstart para `sidepanel.html`/`reminder.html` em `tests/e2e/extension-fixture.ts` e `specs/002-side-panel-views/quickstart.md`
- [X] T083 Executar/corrigir acessibilidade em 320, 479, 480 e 800 px, zoom 200%, teclado, tema escuro, reduced motion e forced colors em `tests/e2e/accessibility-responsive-v2.spec.ts`
- [X] T084 Executar/corrigir migração, restart do service worker, last-write-wins de registros e CAS das demais operações em `tests/e2e/storage-concurrency-v2.spec.ts`
- [X] T085 Auditar ausência de duração em minutos, popup principal legado, sinks inseguros, código remoto, logs pessoais, host permissions, `clipboardRead` e `clipboardWrite` em `tests/contract/release-v2-audit.test.ts`
- [X] T086 Revalidar decisões client-side e APIs MV3 com as fontes obrigatórias, registrando impactos em `specs/002-side-panel-views/plan.md`
- [X] T087 Executar lint, typecheck, testes unitários/integrados/E2E e benchmarks, registrando o resultado em `specs/002-side-panel-views/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup não tem dependências.
- Foundational depende de Setup e bloqueia todas as histórias.
- US1 e US2 (P1) podem começar após Foundational.
- US3 e US4 (P2) podem começar após Foundational e são independentes entre si.
- US5 (P3) usa os campos v2 fundacionais, sem depender da conclusão funcional das demais histórias.
- Polish depende de todas as histórias incluídas na entrega.

### User Story Dependencies

- **US1**: depende de T001–T018. Testes T019–T025 vêm primeiro; T027 depende de T001/T002/T009/T019; T029 de T027/T028; T030 de T026/T029; T032/T033 de T031; T034 de T021/T022/T033; T037 de T024/T026/T036.
- **US2**: depende de T010/T012/T016. Testes T038–T041 vêm primeiro; T043 depende de T042; T044–T046 de T042/T043; T047 consolida após T044.
- **US3**: depende de T010/T012/T016/T017. Testes T048–T052 vêm primeiro; T055 depende de T053/T054; T056 de T055; T057 de T056; T058 pode avançar após T014/T036 sem substituir formulário sujo.
- **US4**: depende de T009/T011 e do shell comum. Testes T059–T061 vêm primeiro; T063 depende de T062; T065 sucede T063/T064.
- **US5**: depende de T010/T013/T015/T016. Testes T066–T071 vêm primeiro; T073 depende de T072; T076 de T015; T079 de T072–T078; T080 sucede os componentes.

### Rules Within Each Story

- Escrever e executar os testes listados, confirmando falha relevante antes do código de produção.
- Implementar domínio/projeções antes de casos de uso; repositórios/handlers antes da integração da UI.
- Cobrir entrada inválida, dependência indisponível e recuperação junto ao sucesso.
- Validar o critério independente antes de avançar de prioridade.

### Parallel Opportunities

- Setup: T001 antecede T002; T003 e T004 podem avançar em paralelo enquanto o contrato de entrada é preparado.
- Foundation: T005, T006, T008 e T009 em paralelo; T011 e T015 usam arquivos distintos.
- Após Foundation, histórias diferentes podem avançar em paralelo, evitando edição simultânea de arquivos compartilhados.
- Dentro de cada história, somente tarefas marcadas `[P]` são candidatas diretas a paralelismo.

## Parallel Execution Examples

- **US1**: T019–T024 em paralelo; após T031, separar T032 e T033 antes de T034.
- **US2**: T038–T040 em paralelo; após T042/T043, separar T045 e T046.
- **US3**: T048–T050 em paralelo; após todos os testes T048–T052 falharem pelo motivo esperado, T053 e T054 podem avançar em paralelo antes de T055.
- **US4**: T059 e T060 podem ser preparadas em paralelo; após falharem, T062 e T064 avançam separadamente.
- **US5**: T066–T069 e T071 em paralelo; depois T075, T077 e T078 antes de T079.

## Implementation Strategy

### MVP First

1. Concluir Setup (T001–T004).
2. Concluir Foundation (T005–T018).
3. Implementar US1 (T019–T037).
4. Parar e validar Side Panel + popup de lembrete + som + rascunho.
5. Entregar/demonstrar o MVP, se desejado.

### Incremental Delivery

1. Setup + Foundation → base v2 migrável e segura.
2. US1 → superfície principal e lembrete (MVP).
3. US2 → horas em toda a aplicação.
4. US3 → projetos arquivados.
5. US4 → Dia/Quinzena.
6. US5 → modos mensais.
7. Polish → gates integrados.

## Notes

- A aplicação principal nunca cria janela popup; dialogs/drawers Ant Design são overlays internos.
- Last-write-wins vale somente para atualização do mesmo registro; demais mutações mantêm CAS.
- Minutos inteiros permanecem fonte de verdade; horas existem na borda da UI.
- Event Range pode dividir o desenho na quebra semanal, mas mantém uma identidade lógica.
- Rascunhos cobrem registro, projeto, configurações e snooze e nunca substituem formulário já sujo.
