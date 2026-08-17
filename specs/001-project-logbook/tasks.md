# Tasks: Logbook por projeto

**Input**: Design documents from `/specs/001-project-logbook/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Obrigatórios para regras de domínio, integridade, persistência, conflitos, permissões, alarmes, migrações e contratos entre camadas. Em cada história, escrever os testes indicados e comprovar que falham antes da implementação correspondente.

**Organization**: Tarefas agrupadas por história de usuário, com infraestrutura compartilhada apenas nas fases iniciais.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: executável em paralelo por atuar em arquivos distintos e não depender de tarefa incompleta.
- **[Story]**: história atendida (`US1`–`US4`); omitida apenas em Setup, Foundation e Polish.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar a extensão React/TypeScript e as ferramentas de qualidade.

- [ ] T001 Inicializar scripts e dependências fixadas de React 19.2, Ant Design 6.6, Vite 8, Zod 4, idb, Day.js, Vitest, Testing Library, fake-indexeddb e Playwright em package.json
- [ ] T002 [P] Configurar TypeScript strict, aliases e targets Chrome 120+ em tsconfig.json e tsconfig.app.json
- [ ] T003 [P] Configurar build multi-entry da SPA e do service worker sem código remoto em vite.config.ts
- [ ] T004 [P] Configurar lint, formatação e regras de fronteira entre camadas em eslint.config.js e .prettierrc.json
- [ ] T005 [P] Configurar ambientes unitário, DOM e cobertura em vitest.config.ts
- [ ] T006 [P] Configurar execução E2E da extensão empacotada no Chromium em playwright.config.ts
- [ ] T007 [P] Criar Manifest V3 com `storage`, `optional_permissions: ["alarms"]`, CSP restrita, action sem `default_popup` e service worker module em manifest.json
- [ ] T008 Criar entradas mínimas da aplicação em index.html, src/ui/main.tsx e src/background/service-worker.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estabelecer limites de arquitetura, contratos, persistência versionada e shell seguros antes das histórias.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase.

### Foundational tests

- [ ] T009 [P] Criar setup de testes, relógio determinístico, UUIDs, mocks Chrome e IndexedDB isolado em tests/setup/unit.ts, tests/fixtures/clock.ts e tests/fixtures/chrome.ts
- [ ] T010 [P] Escrever testes de limites, normalização e data/hora civil independente de fuso em tests/unit/domain/time-values.test.ts
- [ ] T011 [P] Escrever testes contratuais para envelopes, allowlist, payload malformado e erro seguro de mensagens em tests/contract/messages.test.ts
- [ ] T012 [P] Escrever testes de criação/migração do schema, validação de leitura e preservação após falha em tests/integration/persistence/migrations.test.ts

### Foundational implementation

- [ ] T013 [P] Implementar `AppError`, códigos seguros e tipo `Result` sem dados pessoais em src/domain/errors/app-error.ts e src/application/result.ts
- [ ] T014 Implementar value objects de data civil, minuto do dia e duração validados em src/domain/value-objects/local-date.ts e src/domain/value-objects/time-range.ts
- [ ] T015 [P] Definir portas substituíveis para projetos, registros, configurações, feriados, relógio e alarmes em src/application/ports/repositories.ts e src/application/ports/platform.ts
- [ ] T016 Implementar banco IndexedDB v1, stores, índices, transações e migrações idempotentes em src/infrastructure/persistence/indexeddb/database.ts e src/infrastructure/persistence/indexeddb/migrations.ts
- [ ] T017 [P] Implementar adaptador versionado de `chrome.storage.local` com defaults, validação de leitura e erros de quota em src/infrastructure/persistence/chrome-storage/settings-store.ts
- [ ] T018 Implementar schemas Zod e união discriminada de requests, responses e eventos em src/shared/contracts/messages.ts
- [ ] T019 Implementar dispatcher com validação de remetente, allowlist e envelope de falha em src/background/messages.ts e src/infrastructure/chrome/message-client.ts
- [ ] T020 Implementar composition root com injeção explícita de repositórios, relógio e plataforma em src/application/composition-root.ts
- [ ] T021 Implementar criação, validação, foco e persistência reconstruível da janela popup em src/background/popup-window.ts
- [ ] T022 Registrar listeners síncronos de `runtime`, `action`, `windows` e mensagens no escopo superior, sem estado essencial em memória, em src/background/service-worker.ts
- [ ] T023 Implementar shell Ant Design em pt-BR, tema escuro padrão, navegação Diário/Projetos/Configurações, error boundary e feedback `aria-live` em src/ui/app/App.tsx, src/ui/theme/theme.ts e src/ui/components/AsyncState.tsx

**Checkpoint**: build carrega a janela popup segura; contratos, storage e shell estão prontos para as histórias.

---

## Phase 3: User Story 1 — Registrar atividades por projeto (Priority: P1) 🎯 MVP

**Goal**: Criar projetos e tarefas válidas, persistindo-as por data civil e projeto após reiniciar o navegador.

**Independent Test**: Criar um projeto, cadastrar duas tarefas usando hora final e duração, fechar/reabrir a extensão e encontrar ambas na data e no projeto corretos; entradas inválidas não persistem e preservam o formulário.

### Tests for User Story 1

- [ ] T024 [P] [US1] Escrever testes de nome de projeto 1–100, duplicidade normalizada e estados ativo/arquivado em tests/unit/domain/project.test.ts
- [ ] T025 [P] [US1] Escrever testes de detalhes obrigatórios 1–2.000, início/fim/duração equivalentes, mesmo dia, máximo 1.440 minutos e rejeição de futuro em tests/unit/domain/log-record.test.ts
- [ ] T026 [P] [US1] Escrever testes de repositório para criação sem overwrite, índices por data/projeto, quota e leitura malformada em tests/integration/persistence/records-repository.test.ts
- [ ] T027 [P] [US1] Escrever testes de fluxo acessível para criar projeto e tarefa, validação em blur/submit e preservação dos campos em tests/integration/ui/create-record-flow.test.tsx

### Implementation for User Story 1

- [ ] T028 [P] [US1] Implementar entidade e invariantes de `Project` em src/domain/entities/project.ts
- [ ] T029 [P] [US1] Implementar entidade e invariantes de `LogRecord` sem campo de título em src/domain/entities/log-record.ts
- [ ] T030 [US1] Implementar `IndexedDbProjectRepository` com nome normalizado e criação transacional em src/infrastructure/persistence/indexeddb/project-repository.ts
- [ ] T031 [US1] Implementar `IndexedDbLogRecordRepository` com criação por `add` e consultas básicas por data/projeto em src/infrastructure/persistence/indexeddb/log-record-repository.ts
- [ ] T032 [US1] Implementar casos de uso de criar/listar projeto com validação e erros controlados em src/application/use-cases/projects/create-project.ts e src/application/use-cases/projects/list-projects.ts
- [ ] T033 [US1] Implementar caso de uso de criar tarefa calculando fim ou duração e rejeitando futuro/inconsistência antes da persistência em src/application/use-cases/records/create-record.ts
- [ ] T034 [US1] Expor comandos e consultas de criação/listagem com schemas nas rotas allowlisted em src/background/handlers/projects.ts e src/background/handlers/records.ts
- [ ] T035 [P] [US1] Implementar lista e formulário modal de novos projetos com estados vazio/erro/sucesso em src/ui/features/projects/ProjectList.tsx e src/ui/features/projects/ProjectForm.tsx
- [ ] T036 [US1] Implementar formulário responsivo de tarefa com projeto, data, início, fim ou duração e detalhes obrigatórios em src/ui/features/records/RecordForm.tsx
- [ ] T037 [US1] Implementar lista básica do dia e E2E de persistência após reabrir a extensão em src/ui/features/dashboard/TodayRecords.tsx e tests/e2e/us1-create-record.spec.ts

**Checkpoint**: MVP funcional e testável sem consultas avançadas, feriados ou lembretes.

---

## Phase 4: User Story 2 — Consultar o diário por período (Priority: P2)

**Goal**: Consultar dia, quinzena e mês, mantendo contexto e exibindo totais normal/50%/100% gerais e por projeto.

**Independent Test**: Com fixtures em datas/projetos diferentes, cada modo mostra apenas seu período, preserva filtros e posição ao abrir detalhes e calcula exatamente os totais, inclusive sobreposições e divisão na oitava hora.

### Tests for User Story 2

- [ ] T038 [P] [US2] Escrever testes dos intervalos diário, quinzenal 1–15/16–fim e mensal, inclusive navegação entre meses, em tests/unit/domain/period.test.ts
- [ ] T039 [P] [US2] Escrever matriz de cálculo para dia útil, limite de 480 minutos, sábado, domingo, feriado, empate e sobreposição entre projetos em tests/unit/domain/hour-classifier.test.ts
- [ ] T040 [P] [US2] Escrever testes de consultas inclusivas, paginação, filtros e resumos por projeto sobre 10.000 registros em tests/integration/queries/period-queries.test.ts
- [ ] T041 [P] [US2] Escrever testes acessíveis para seletor de período, estados vazios, filtros e restauração de contexto do painel em tests/integration/ui/diary-views.test.tsx

### Implementation for User Story 2

- [ ] T042 [P] [US2] Implementar value objects e navegação de períodos civis em src/domain/value-objects/period.ts
- [ ] T043 [US2] Implementar classificação determinística de minutos normais/50%/100%, incluindo sobreposições e divisão na 8ª hora, em src/domain/services/hour-classifier.ts
- [ ] T044 [US2] Implementar consulta IndexedDB indexada por intervalo, projeto, busca nos detalhes e cursor em src/infrastructure/persistence/indexeddb/record-query-repository.ts
- [ ] T045 [US2] Implementar `ListRecordsByPeriod` e `GetHourSummary` com totais gerais e por projeto em src/application/queries/list-records-by-period.ts e src/application/queries/get-hour-summary.ts
- [ ] T046 [US2] Expor `record.listPeriod` e `summary.getPeriod` com limite máximo de 366 dias em src/background/handlers/period-queries.ts
- [ ] T047 [P] [US2] Implementar visão diária cronológica, ordem estável e estado vazio acionável em src/ui/features/dashboard/DailyView.tsx
- [ ] T048 [P] [US2] Implementar visão quinzenal agrupada por todos os dias do período em src/ui/features/dashboard/FortnightView.tsx
- [ ] T049 [P] [US2] Implementar calendário mensal largo e lista cronológica estreita equivalentes em src/ui/features/dashboard/MonthlyView.tsx
- [ ] T050 [US2] Implementar seletor Dia/Quinzena/Mês, navegação, filtros, resumo por projeto e painel que restaura contexto em src/ui/features/dashboard/DiaryPage.tsx e src/ui/features/records/RecordDetailsPanel.tsx
- [ ] T051 [US2] Cobrir modos de período, cálculos e reuso/foco da janela em tests/e2e/us2-diary-periods.spec.ts

**Checkpoint**: US1 e US2 entregam registro e consulta completa, ainda com calendário de feriados vazio/injetável.

---

## Phase 5: User Story 3 — Configurar o aplicativo e receber lembretes (Priority: P3)

**Goal**: Selecionar região, aplicar feriados empacotados, exibir jornada e configurar lembretes com múltiplos horários e snooze seguro.

**Independent Test**: Ativar região e verificar um feriado no cálculo; negar/conceder `alarms`; programar recorrências diárias e semanais; suprimir dias preenchidos; aplicar snooze 1–2.880 minutos e suprimir recorrências intermediárias sem duplicar janela.

### Tests for User Story 3

- [ ] T052 [P] [US3] Escrever testes de contrato do manifesto, checksum, 27 UFs, códigos IBGE, datas, escopos e cobertura do dataset em tests/contract/holiday-dataset.test.ts
- [ ] T053 [P] [US3] Escrever testes de lookup nacional/estadual/municipal, duplicidade de data e preservação do catálogo anterior inválido em tests/integration/holidays/holiday-catalog.test.ts
- [ ] T054 [P] [US3] Escrever testes de settings por seção, revisão otimista, região pendente e recálculo sem alterar registros em tests/integration/settings/settings-repository.test.ts
- [ ] T055 [P] [US3] Escrever testes determinísticos de recorrência diária/dias da semana, múltiplos horários, fuso atual e supressão de dia preenchido em tests/unit/domain/reminder-schedule.test.ts
- [ ] T056 [P] [US3] Escrever testes de snooze 1–2.880, rejeição fora do limite, supressão intermediária e retomada futura em tests/unit/domain/reminder-snooze.test.ts
- [ ] T057 [P] [US3] Escrever testes de permissão negada/revogada, reconciliação após restart e falhas da API de alarmes em tests/integration/chrome/reminder-alarms.test.ts
- [ ] T058 [P] [US3] Escrever testes acessíveis das três seções, dirty state, validação junto ao controle e próxima ocorrência em tests/integration/ui/settings-page.test.tsx

### Implementation for User Story 3

- [ ] T059 [P] [US3] Implementar script de release que baixa revisão fixada, valida, normaliza e gera checksums sem alterar assets válidos em scripts/update-holidays.mjs
- [ ] T060 [US3] Gerar manifesto, municípios e feriados iniciais versionados em public/data/holidays/manifest.json, public/data/holidays/municipalities.json e public/data/holidays/holidays-2026.json
- [ ] T061 [US3] Implementar schemas, importação transacional e provider regional do catálogo empacotado em src/infrastructure/holidays/catalog-schema.ts e src/infrastructure/holidays/bundled-holiday-provider.ts
- [ ] T062 [US3] Integrar `HolidayProvider` ao classificador e invalidar apenas totais derivados ao trocar região em src/domain/services/hour-classifier.ts e src/application/use-cases/settings/update-region.ts
- [ ] T063 [P] [US3] Implementar entidade `UserSettings`, regras de região e revisão em src/domain/entities/user-settings.ts
- [ ] T064 [US3] Implementar repositório de configurações por seção e compare-and-swap em src/infrastructure/persistence/chrome-storage/settings-repository.ts
- [ ] T065 [P] [US3] Implementar `ReminderSchedule`, cálculo da próxima recorrência e estado de snooze em src/domain/entities/reminder-schedule.ts
- [ ] T066 [US3] Implementar adaptador de permissão opcional e alarmes nomeados/reconstruíveis em src/infrastructure/chrome/alarm-adapter.ts
- [ ] T067 [US3] Implementar casos de uso de atualizar/reconciliar lembretes e snooze com supressão intermediária em src/application/use-cases/reminders/update-reminders.ts, src/application/use-cases/reminders/reconcile-reminders.ts e src/application/use-cases/reminders/snooze-reminder.ts
- [ ] T068 [US3] Tratar `alarms.onAlarm`, restart/instalação, supressão por tarefa existente e abertura/reuso da janela em src/background/alarms.ts e src/background/service-worker.ts
- [ ] T069 [US3] Expor settings, catálogo, permissão, reconciliação e snooze pela allowlist em src/background/handlers/settings.ts e src/background/handlers/reminders.ts
- [ ] T070 [P] [US3] Implementar seleção UF/município, status/versão do catálogo e próximos feriados em src/ui/features/settings/RegionSettings.tsx
- [ ] T071 [P] [US3] Implementar seção somente leitura de jornada e categorias de horas em src/ui/features/settings/WorkdaySettings.tsx
- [ ] T072 [US3] Implementar editor de frequência, dias, múltiplos horários, permissão e próxima ocorrência em src/ui/features/settings/ReminderSettings.tsx
- [ ] T073 [US3] Implementar página rolável com salvamento independente/dirty guard e controle de snooze na janela de lembrete em src/ui/features/settings/SettingsPage.tsx e src/ui/features/records/SnoozeForm.tsx
- [ ] T074 [P] [US3] Cobrir seleção regional, falha de catálogo e recálculo de feriado em tests/e2e/us3-region-settings.spec.ts
- [ ] T075 [US3] Cobrir permissão, múltiplos horários, restart, supressão, snooze, colisão e janela única em tests/e2e/us3-reminders.spec.ts

**Checkpoint**: configurações e lembretes funcionam offline, com mínimo privilégio e regras críticas automatizadas.

---

## Phase 6: User Story 4 — Corrigir e organizar o histórico (Priority: P4)

**Goal**: Editar/excluir tarefas, mover entre projetos e renomear/arquivar/reativar projetos sem perda ou overwrite concorrente.

**Independent Test**: Abrir a mesma revisão em duas janelas, salvar a primeira e receber conflito na segunda; recarregar ou reaplicar conscientemente; editar/mover/excluir tarefa e arquivar projeto preservando histórico.

### Tests for User Story 4

- [ ] T076 [P] [US4] Escrever testes de atualização/exclusão por `expectedRevision`, identidade preservada e conflito com entidade atual em tests/integration/persistence/optimistic-concurrency.test.ts
- [ ] T077 [P] [US4] Escrever testes de mover tarefa, renomear/arquivar/reativar projeto e proteger histórico em tests/unit/application/history-maintenance.test.ts
- [ ] T078 [P] [US4] Escrever testes do diálogo de conflito, diferenças por campo, foco e caminhos recarregar/reaplicar em tests/integration/ui/conflict-resolution.test.tsx
- [ ] T079 [P] [US4] Escrever E2E de duas janelas concorrentes e manutenção do histórico em tests/e2e/us4-history-conflicts.spec.ts

### Implementation for User Story 4

- [ ] T080 [US4] Implementar compare-and-swap transacional para update/delete de projeto e tarefa em src/infrastructure/persistence/indexeddb/project-repository.ts e src/infrastructure/persistence/indexeddb/log-record-repository.ts
- [ ] T081 [P] [US4] Implementar casos de uso de editar, mover e excluir tarefa com confirmação e revisão esperada em src/application/use-cases/records/update-record.ts e src/application/use-cases/records/delete-record.ts
- [ ] T082 [P] [US4] Implementar casos de uso de renomear, arquivar e reativar projeto preservando referências em src/application/use-cases/projects/update-project.ts e src/application/use-cases/projects/archive-project.ts
- [ ] T083 [US4] Expor updates/deletes, `CONFLICT` e eventos `entity.changed` em src/background/handlers/projects.ts e src/background/handlers/records.ts
- [ ] T084 [P] [US4] Implementar detalhes/edição/exclusão com restauração de foco e contexto em src/ui/features/records/RecordDetailsPanel.tsx
- [ ] T085 [P] [US4] Implementar gerenciamento de projetos ativos/arquivados e confirmação explicativa em src/ui/features/projects/ProjectsPage.tsx
- [ ] T086 [US4] Implementar diálogo de comparação e ações recarregar/reaplicar sem overwrite silencioso em src/ui/components/ConflictDialog.tsx
- [ ] T087 [US4] Revalidar telas abertas por eventos de revisão e finalizar o fluxo E2E concorrente em src/ui/hooks/useEntityChanges.ts e tests/e2e/us4-history-conflicts.spec.ts

**Checkpoint**: todas as quatro histórias estão completas e testáveis com integridade concorrente.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validar desempenho, acessibilidade, segurança, restart/migração e entrega completa.

- [ ] T088 [P] Criar benchmark determinístico de 10.000 tarefas e meta p95 de 2 segundos em tests/performance/period-query.bench.ts
- [ ] T089 Otimizar índices, paginação e virtualização somente conforme o benchmark em src/infrastructure/persistence/indexeddb/record-query-repository.ts e src/ui/features/dashboard/DiaryPage.tsx
- [ ] T090 [P] Cobrir teclado, foco, anúncios, ausência de dependência de cor/hover e layouts 360×600, 640×700, 960×720 e 1440×900 em tests/e2e/accessibility-responsive.spec.ts
- [ ] T091 [P] Criar auditoria automatizada de permissões, CSP, ausência de código remoto/tokens e bundle local em tests/contract/manifest-security.test.ts
- [ ] T092 [P] Cobrir migração, quota, dados malformados e restart do service worker sem perda de fonte de verdade em tests/e2e/storage-recovery.spec.ts
- [ ] T093 Revisar mensagens e diagnósticos para excluir detalhes, nomes de projeto e região em src/domain/errors/app-error.ts e src/background/messages.ts
- [ ] T094 Documentar instalação, build, carregamento unpacked, permissões e atualização do dataset em README.md
- [ ] T095 Executar typecheck, lint, cobertura, build, E2E e todos os cenários de quickstart, registrando resultados e exceções em specs/001-project-logbook/validation-report.md
- [ ] T096 Reconsultar `modern-web-guidance` e documentação oficial Chrome antes da entrega e registrar mudanças de suporte/fallback em specs/001-project-logbook/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: sem dependências.
- **Phase 2 — Foundational**: depende da Phase 1 e bloqueia todas as histórias.
- **Phase 3 — US1**: depende da Foundation; entrega o MVP e as entidades persistidas.
- **Phase 4 — US2**: depende da US1 para registros/repositórios; fixtures mantêm seus testes de cálculo isolados.
- **Phase 5 — US3**: depende da US1 para supressão por dia preenchido e da US2 para integrar feriados aos totais.
- **Phase 6 — US4**: depende da US1; pode avançar em paralelo com US2/US3 depois do contrato de revisão estar estável.
- **Phase 7 — Polish**: depende das histórias incluídas na entrega.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 (MVP)
                         ├──> US2 ──> US3
                         └──────────> US4
```

### Within Each User Story

1. Escrever os testes listados e comprovar falha pelo motivo esperado.
2. Implementar entidades/value objects antes de repositórios/casos de uso.
3. Implementar casos de uso antes de handlers e UI.
4. Integrar UI e executar os testes da história.
5. Validar o checkpoint antes da próxima prioridade.

### Parallel Opportunities

- Em Setup, T002–T007 atuam em arquivos independentes.
- Na Foundation, fixtures/testes T009–T012 e contratos T013/T015/T017 podem avançar em paralelo conforme indicado.
- Na US1, testes T024–T027, entidades T028/T029 e componentes T035 podem ser distribuídos.
- Na US2, testes T038–T041 e as três visualizações T047–T049 são paralelizáveis.
- Na US3, testes T052–T058, entidade/configurações T063/T065 e seções visuais T070/T071 são paralelizáveis.
- Na US4, testes T076–T079, casos de uso T081/T082 e telas T084/T085 são paralelizáveis.
- Após US1, US4 pode ocorrer em paralelo com a sequência US2 → US3.

---

## Parallel Examples

### User Story 1

```text
T024 Project domain tests | T025 LogRecord domain tests | T026 repository tests | T027 UI flow tests
T028 Project entity | T029 LogRecord entity
```

### User Story 2

```text
T038 period tests | T039 hour tests | T040 query tests | T041 UI tests
T047 DailyView | T048 FortnightView | T049 MonthlyView
```

### User Story 3

```text
T052 dataset contract | T053 catalog | T054 settings | T055 recurrence | T056 snooze | T057 alarms | T058 UI
T070 RegionSettings | T071 WorkdaySettings
```

### User Story 4

```text
T076 concurrency | T077 maintenance | T078 conflict UI | T079 multi-window E2E
T081 record use cases | T082 project use cases
```

---

## Implementation Strategy

### MVP First

1. Concluir Setup e Foundational.
2. Concluir somente US1.
3. Executar T024–T027 e T037, fechar/reabrir a extensão e validar persistência.
4. Demonstrar o MVP antes de adicionar consultas avançadas.

### Incremental Delivery

1. **US1**: cadastro persistente por projeto/data.
2. **US2**: consultas e cálculos completos.
3. **US3**: região, feriados, configurações e lembretes.
4. **US4**: manutenção e resolução concorrente.
5. **Polish**: gates de entrega e documentação.

### Parallel Team Strategy

Depois da Foundation, priorizar US1 em conjunto. Em seguida, uma frente pode executar US2 → US3 enquanto outra implementa US4; integrar somente por contratos já cobertos por testes.

## Notes

- `[P]` indica ausência de conflito de arquivo e de dependência incompleta, não autorização para ignorar a ordem da fase.
- Tarefas de testes precedem a implementação correspondente e cobrem sucesso, limites, entrada inválida e falha de dependência.
- Nenhuma UI acessa storage diretamente; nenhuma regra de domínio depende de React, DOM ou APIs Chrome.
- Nenhuma tarefa adiciona host permissions, código remoto, token de API ou logging de conteúdo pessoal.
