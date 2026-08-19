# Checklist de Prontidão dos Requisitos: Side Panel e Visualizações Aprimoradas

**Purpose**: Gate formal para avaliar completude, clareza, consistência e mensurabilidade entre spec, plano, modelo de dados e contratos antes da geração de tarefas
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md)
**Reviewed**: 2026-08-17 — evidências revalidadas após explicitar precedência v1→v2, `FormDraft`, janela/largura úteis, codec reversível, Event Range lógico, durabilidade de snapshots, permissões, áudio e benchmark reproduzível.

**Note**: Este checklist valida a qualidade dos requisitos escritos, não o comportamento da implementação.

## Requirement Completeness

- [x] CHK001 Estão explicitamente enumerados todos os requisitos da versão 001 substituídos pela versão 002 — contêiner principal, conflito de edição e intervalo limitado ao mesmo dia — para eliminar dúvidas de precedência? [Completeness, Gap, Spec §Assumptions, Plan §Revalidação pós-design]
- [x] CHK002 O escopo de rascunho está definido para registros, projetos, Configurações e snooze e refletido pelo `FormDraft` discriminado? [Completeness, Spec §FR-032, Data Model §FormDraft]
- [x] CHK003 Estão documentados estados de carregamento, vazio, falha e recuperação para Side Panel, popup de lembrete, Notice Calendar, Event Range, projetos arquivados e Configurações de som? [Completeness, Spec §QR-002, Contract UI §Estados e acessibilidade]
- [x] CHK004 Os requisitos distinguem completamente janelas popup do navegador, overlays internos, drawers e painéis de detalhe para impedir interpretações diferentes de “somente lembretes abrem popup”? [Completeness, Spec §FR-003, Contract UI §Superfícies]
- [x] CHK005 Estão enumeradas todas as permissões obrigatórias e opcionais, seus motivos, momento de solicitação, recusa e revogação, inclusive a ausência deliberada de `clipboardWrite`, `offscreen` declarada e somente `alarms` opcional? [Completeness, Spec §QR-005, Spec §Accesses and Permissions, Contract Platform §Manifest]
- [x] CHK006 Os requisitos de migração cobrem projetos, registros terminados em `24:00`, configurações v1, metadados da antiga janela principal, falha atômica e dados persistidos inválidos? [Completeness, Spec §FR-028, Data Model §Persistência e migração v1 → v2, Contract Storage §Migração 1 → 2]
- [x] CHK007 O catálogo de sons tem requisitos completos para quantidade mínima, identidade estável, formato local, duração, som padrão, substituição futura e falha de asset? [Completeness, Spec §FR-033, Data Model §ReminderSoundCatalog, Contract UI §Configurações de som]

## Requirement Clarity

- [x] CHK008 O termo “janela compatível” possui uma definição objetiva que identifica contextos suportados e excluídos para abertura do Side Panel? [Clarity, Ambiguity, Spec §SC-001, Spec §FR-004]
- [x] CHK009 “Largura útil” está definida de forma única como largura do contêiner de conteúdo, incluindo como padding, zoom e scrollbar afetam o limiar de 480 px? [Clarity, Ambiguity, Spec §FR-002, Contract UI §Layout responsivo]
- [x] CHK010 A representação canônica em horas esclarece que até quatro casas podem aproximar visualmente frações recorrentes sem alterar o minuto exato, evitando conflito com a proibição de arredondamento silencioso? [Clarity, Conflict, Spec §FR-006–FR-008, Data Model §HourDisplayValue]
- [x] CHK011 A expressão “cores distintas sempre que houver opção distinguível” possui quantidade de slots, regra de esgotamento e expectativa de contraste objetivas? [Clarity, Spec §FR-023–FR-024, Data Model §Project v2]
- [x] CHK012 “Intervalo visual contínuo” está definido para mudanças de semana e de linha da grade, incluindo se segmentos visuais ainda constituem um único intervalo lógico? [Clarity, Ambiguity, Spec §FR-022, Contract UI §Event Range]
- [x] CHK013 A “altura estável” das células e a indicação de conteúdo adicional possuem critérios objetivos suficientes para comparação entre dias, tamanhos e densidades? [Clarity, Spec §FR-031, Spec §SC-011, Contract UI §Overflow de célula]
- [x] CHK014 “Reproduzir uma vez” define início, término, deduplicação por ocorrência, comportamento após snooze e tratamento de reuso do popup? [Clarity, Spec §FR-034, Contract Messages §Mensagem interna de áudio, Contract Platform §Reprodução de áudio]

## Requirement Consistency

- [x] CHK015 O requisito de rascunho para registro, projeto, Configurações e snooze é consistente entre `FormDraft`, mensagens discriminadas e contrato de UI? [Consistency, Spec §FR-032, Data Model §FormDraft, Contract Messages §Rascunhos]
- [x] CHK016 A faixa única e contínua exigida na spec é consistente com a decisão de dividir o desenho do Event Range nas bordas de semana? [Consistency, Conflict, Spec §FR-022, Spec §Assumptions, Contract UI §Event Range]
- [x] CHK017 A escrita contextual está consistentemente limitada a documento com foco e ativação transitória, sem `clipboardRead`, `clipboardWrite`, fallback legado ou contexto intermediário? [Consistency, Spec §Accesses and Permissions, Plan §Constitution Check, Contract Platform §Clipboard]
- [x] CHK018 A regra v2 de último salvamento prevalecer está explicitamente reconciliada com contratos e requisitos v1 de revisão otimista e diálogo de conflito? [Consistency, Spec §FR-029, Plan §Concorrência e operações de projeto, Contract Messages §Atualização de registro]
- [x] CHK019 A permissão de atravessar a meia-noite está reconciliada em todos os artefatos com o limite v1 de terminar no mesmo dia e com a representação anterior de `endMinute=1440`? [Consistency, Spec §FR-026–FR-027, Data Model §LogRecord v2, Contract Storage §Migração 1 → 2]
- [x] CHK020 Side Panel exclusivo para a aplicação principal e popup exclusivo para lembretes estão descritos sem exceções contraditórias em cenários, escopo, plano e contrato de plataforma? [Consistency, Spec §FR-001–FR-004, Plan §Summary, Contract Platform §Entradas empacotadas]
- [x] CHK021 A política de solicitar somente `alarms` é consistente com a exigência de manter o logbook funcional e garantir que falha de áudio/offscreen não impeça o popup? [Consistency, Spec §QR-005, Plan §Permissões, Contract Platform §Ativação e revogação]
- [x] CHK022 A regra de minutos inteiros como fonte interna e horas como unidade visível está consistente entre entidades, mensagens, rascunhos, validações, totais e snooze? [Consistency, Spec §FR-005–FR-008, Plan §Duração em horas sem perda, Data Model §HourDisplayValue]

## Acceptance Criteria Quality

- [x] CHK023 O universo de “todas as telas e mensagens” da auditoria de horas está enumerado para tornar SC-002 reproduzível e impedir omissões? [Measurability, Spec §SC-002]
- [x] CHK024 O denominador e os contextos de “100% dos acionamentos” estão definidos para SC-001, incluindo falha/indisponibilidade do Side Panel? [Measurability, Spec §SC-001, Spec §FR-004]
- [x] CHK025 Os critérios de rolagem em células com 1, 4 e 20 itens definem objetivamente acessibilidade, affordance e transferência da rolagem por mouse, touchpad e teclado? [Measurability, Spec §SC-011, Contract UI §Overflow de célula]
- [x] CHK026 A condição “quando o dispositivo permite áudio” está delimitada para diferenciar falha aceitável de reprodução, dispositivo mudo, política do navegador e defeito funcional? [Measurability, Ambiguity, Spec §SC-012, Contract Platform §Falhas esperadas]
- [x] CHK027 Os critérios de preservação na atualização enumeram todas as classes de dados v1 que precisam permanecer idênticas ou receber default controlado? [Measurability, Spec §SC-008, Spec §FR-028, Contract Storage §Envelope v2 e recuperação]

## Scenario Coverage

- [x] CHK028 Os requisitos primários cobrem separadamente abertura/reabertura do Side Panel, criação/edição no painel e preenchimento/snooze no popup restrito? [Coverage, Spec §User Story 1, Contract UI §Superfícies]
- [x] CHK029 Os requisitos alternativos cobrem a transição dinâmica entre 479 e 480 px com formulário sujo, detalhe selecionado, calendário rolado e foco ativo? [Coverage, Alternate Flow, Spec §FR-002, Spec §SC-009–SC-010]
- [x] CHK030 Os requisitos de exceção abrangem falhas independentes de Side Panel, clipboard, IndexedDB, configuração, permissão, criação/foco de popup, offscreen e playback? [Coverage, Exception Flow, Spec §Edge Cases, Contract Platform §Falhas esperadas]
- [x] CHK031 Os requisitos de recuperação definem o estado posterior quando o registro é salvo mas a limpeza do rascunho falha, evitando reenvio acidental? [Coverage, Recovery, Contract Messages §Rascunhos]
- [x] CHK032 Os cenários concorrentes cobrem restauração com nome duplicado, remoção após criação tardia de vínculo, exclusão com revisão antiga e edição last-write-wins? [Coverage, Concurrency, Spec §FR-011–FR-014, Spec §FR-029]
- [x] CHK033 Os cenários de permissões cobrem concessão total, parcial, negação, revogação de cada permissão e reativação posterior dos lembretes? [Coverage, Recovery, Spec §QR-005, Contract Platform §Ativação e revogação]
- [x] CHK034 Os cenários mensais cobrem primeiro/último dia, mês iniciando em cada dia da semana, quebra semanal, meia-noite, 24 horas exatas, filtros e estado mensal vazio nos dois modos e larguras? [Coverage, Edge Cases, Spec §FR-021–FR-031, Contract UI §Mês — regras comuns]

## Non-Functional Requirements

- [x] CHK035 A meta de consulta com 10.000 registros declara se inclui projeções Notice/Event Range, interseções do dia anterior, filtros, cores e totais, além do ambiente de medição? [Performance, Clarity, Plan §Performance Goals, Spec §SC-006]
- [x] CHK036 A garantia de rascunho ao fechar imediatamente possui requisito temporal/durabilidade mensurável e comportamento definido quando ainda existe escrita em voo? [Reliability, Gap, Spec §FR-032, Plan §Rascunhos]
- [x] CHK037 Os requisitos de acessibilidade cobrem explicitamente foco/teclado em scroll containers, nomes de botões de ícone, zoom 200%, forced colors, contraste dos slots e retorno de foco entre mestre/detalhe? [Accessibility, Coverage, Spec §QR-008, Contract UI §Estados e acessibilidade]
- [x] CHK038 Os requisitos de segurança e privacidade abrangem validação de remetente, allowlist de som, limites de rascunho, ausência de HTML/URL arbitrária, CSP e exclusão de conteúdo pessoal dos diagnósticos? [Security, Completeness, Spec §QR-006–QR-010, Contract Messages §Erros v2, Contract Platform §Mensageria]

## Dependencies & Assumptions

- [x] CHK039 Está explicitamente documentado que customização de célula do Ant Design não fornece Event Range nem a política de overflow, evitando uma dependência implícita em comportamento não garantido pela biblioteca? [Dependency, Plan §Official Chrome Documentation, Plan §Células mensais roláveis]
- [x] CHK040 As premissas de Chrome 120 cobrem todas as APIs usadas, recursos deliberadamente não usados por exigirem versões posteriores e fallback estreito para container queries? [Assumption, Compatibility, Plan §Minimum Chrome Version/Fallbacks, Contract Platform §Side Panel]

## Notes

- Marque um item somente quando os artefatos escritos fornecerem resposta clara e consistente.
- Registre achados e links ao lado do item correspondente.
- Itens com `[Gap]`, `[Ambiguity]` ou `[Conflict]` indicam pontos de maior risco para resolver antes de `/speckit-tasks`.
