# Checklist de Prontidão dos Requisitos: Logbook por Projeto

**Purpose**: Avaliar clareza, completude, consistência e mensurabilidade dos requisitos de domínio, dados e UI/UX antes da geração das tarefas
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

**Note**: Esta checklist valida a qualidade dos requisitos escritos; não valida a implementação.

## Completude dos requisitos

- [x] CHK001 As regras de criação, edição e arquivamento sem reativação na v1 estão documentadas, incluindo o comportamento de nomes duplicados em cada estado? [Completeness, Spec §FR-001–FR-003, Data Model §Project]
- [x] CHK002 Os requisitos definem de forma única a ausência de título e os limites de detalhes obrigatórios, início, fim, duração e normalização? [Completeness, Spec §FR-004–FR-005, §FR-021, §FR-031]
- [x] CHK003 Os requisitos de conflito definem detecção, informações apresentadas e resultados possíveis para recarregar, descartar ou reaplicar alterações? [Gap, Spec §Edge Cases, Plan §Summary, UI Contract §Cadastro e edição]
- [x] CHK004 As operações sujeitas a concorrência estão enumeradas — tarefa, projeto e cada seção de configurações — ou a proteção está explicitamente limitada a algumas entidades? [Coverage, Spec §FR-007, §FR-041, Data Model §Estados e transições]
- [x] CHK005 Os requisitos definem o conteúdo e a hierarquia visual dos estados de carregamento, vazio, sucesso, falha recuperável, falha persistente e dados desatualizados em todas as telas? [Completeness, Spec §FR-012, §FR-019, §FR-037, UI Contract §Estados e acessibilidade]
- [ ] CHK006 A primeira utilização sem projetos, região, catálogo ou lembretes possui requisitos completos de onboarding e ações prioritárias? [Coverage, Spec §User Story 1, §User Story 3, §FR-012]
- [x] CHK007 A busca e os filtros citados no contrato de UI têm critérios documentados para campos pesquisados, combinação, limpeza e persistência por período? [Gap, UI Contract §Diário, Spec §FR-028]
- [x] CHK008 Os requisitos de projeto arquivado definem sua presença em filtros, totais, detalhes históricos e seleção durante a edição de tarefa? [Completeness, Spec §FR-003, §FR-007, §User Story 4]

## Clareza das regras de domínio e dados

- [x] CHK009 O conceito de “registro” versus “tarefa” está definido de modo inequívoco, inclusive para IDs, agrupamento diário e operações individuais? [Ambiguity, Spec §FR-004–FR-007, §Key Entities]
- [x] CHK010 A regra que distribui os primeiros 480 minutos entre tarefas sobrepostas e projetos diferentes define inequivocamente a ordem de classificação e a atribuição por projeto? [Clarity, Spec §FR-032–FR-034]
- [x] CHK011 A precedência entre sábado, domingo e feriado está expressa sem permitir classificação dupla dos mesmos minutos? [Clarity, Spec §FR-029–FR-033, §Edge Cases]
- [x] CHK012 O limite de 24 horas distingue claramente a duração máxima de uma tarefa do total diário, que pode exceder 24 horas por sobreposição? [Clarity, Spec §FR-005, §FR-031–FR-032]
- [ ] CHK013 A rejeição de data/hora futura define como “agora” é comparado, inclusive no minuto corrente e durante mudança de fuso ou horário de verão? [Ambiguity, Spec §FR-004, §Edge Cases]
- [x] CHK014 O cálculo quinzenal está definido para navegação entre meses, mês corrente incompleto e seleção de datas dos dias 16 ao último dia? [Clarity, Spec §FR-009–FR-011]
- [x] CHK015 A noção de “dia preenchido” está documentada de maneira consistente para tarefa criada, posteriormente excluída ou movida para outra data? [Clarity, Spec §FR-016, §Assumptions]

## Consistência entre especificação e design

- [x] CHK016 A recorrência diária ou por dias da semana, os múltiplos horários, o snooze de 1 minuto a 48 horas e a supressão de recorrências intermediárias estão consistentes em todos os artefatos? [Consistency, Spec §FR-014–FR-015, §FR-039, Plan §Summary, Data Model §ReminderSchedule]
- [x] CHK017 O limite de 1 a 100 caracteres do nome do projeto está definido de modo uniforme na especificação e no modelo de dados? [Consistency, Spec §FR-001, Data Model §Project]
- [x] CHK018 A obrigatoriedade dos detalhes entre 1 e 2.000 caracteres e a ausência de título estão uniformes entre formulário, exibição e modelo? [Consistency, Spec §FR-005, §FR-021–FR-025, Data Model §LogRecord]
- [x] CHK019 O dataset empacotado e atualizado somente por versões da extensão está consistente com os cenários de carregamento, validação e preservação do catálogo anterior? [Consistency, Spec §FR-020, §FR-036–FR-040, Research §7]
- [x] CHK020 A ausência de rede e de acesso opcional para feriados está consistente com os requisitos de permissões e falhas? [Consistency, Spec §FR-040, Plan §Constraints, Research §8]
- [x] CHK021 Os três destinos globais e o seletor interno Dia/Quinzena/Mês estão definidos de forma uniforme em navegação, responsividade e restauração de contexto? [Consistency, Spec §FR-024, UI Contract §Estrutura global, §Diário]
- [x] CHK022 O significado de “popup dedicado” está consistente com a regra de reutilizar uma única janela principal já aberta? [Ambiguity, Spec §Clarifications, §FR-016–FR-017, §FR-023]

## Qualidade dos critérios de aceitação

- [ ] CHK023 Cada regra crítica de cálculo possui exemplos de entrada e totais esperados, inclusive tarefa que cruza 8h, sobreposição e divisão por projeto? [Acceptance Criteria, Spec §FR-029–FR-034, §SC-007]
- [ ] CHK024 O critério de desempenho especifica equipamento, versão do Chrome, distribuição dos 10.000 registros, período consultado e início/fim da medição? [Measurability, Spec §SC-002, Plan §Performance Goals]
- [ ] CHK025 Os percentuais de sucesso em usabilidade especificam perfil e quantidade mínima de participantes, método e condição de aprovação? [Measurability, Spec §SC-001, §SC-006, §SC-008]
- [ ] CHK026 A tolerância de até cinco minutos para lembretes define como medir disparos após suspensão, reinício, indisponibilidade e mudança de fuso? [Measurability, Spec §SC-003, §Edge Cases]
- [x] CHK027 O requisito de telas responsivas possui critérios objetivos para larguras, rolagem, transformação de tabelas/calendário e visibilidade das ações essenciais? [Acceptance Criteria, Spec §FR-023–FR-028, UI Contract §Critérios responsivos]
- [ ] CHK028 O requisito de dark mode padrão define contraste, estados interativos, superfícies elevadas e comportamento caso um tema alternativo seja introduzido? [Completeness, Plan §Constraints, UI Contract §Estrutura global]

## Cobertura de cenários e recuperação

- [x] CHK029 Os requisitos definem recuperação após quota esgotada, transação interrompida, dado parcialmente incompatível e migração malsucedida sem perda silenciosa? [Coverage, Spec §FR-018–FR-019, §Edge Cases, Storage Contract §Migrações e recuperação]
- [ ] CHK030 A negação e a revogação posterior de `alarms` têm requisitos distintos para estado exibido, configuração preservada e próxima ocorrência? [Coverage, Spec §FR-013, §QR-005, Data Model §Estados e transições]
- [ ] CHK031 Os requisitos tratam mudanças de relógio/fuso entre o cálculo da próxima ocorrência e o disparo, incluindo recorrências duplicadas ou inexistentes? [Edge Case, Spec §FR-009, §FR-014–FR-017]
- [x] CHK032 A atualização do catálogo define cobertura anual, expiração, atualização antecipada e comportamento quando o próximo ano ainda não está disponível? [Gap, Spec §FR-036–FR-040, Holiday Dataset Contract]
- [ ] CHK033 A troca de região durante uma consulta ou edição aberta define quando os totais são invalidados, recalculados e reapresentados? [Coverage, Spec §FR-038, §Edge Cases]
- [ ] CHK034 A recuperação de conflito define o que ocorre se uma terceira alteração chegar enquanto o usuário compara ou reaplica versões? [Edge Case, Spec §Edge Cases, Messages Contract §AppError]

## Requisitos não funcionais, segurança e acessibilidade

- [x] CHK035 Os requisitos de acessibilidade abrangem teclado, ordem/restauração de foco, nomes acessíveis, anúncios de erro, contraste e alternativas ao calendário em largura estreita? [Completeness, Plan §Modern Web Guidance, UI Contract §Estados e acessibilidade]
- [ ] CHK036 Os requisitos definem alvos mínimos, estados hover/focus/active/disabled e interações sem dependência exclusiva de cor ou hover? [Gap, UI Contract §Estados e acessibilidade]
- [x] CHK037 Os limites de confiança e validação estão rastreados para formulário, mensageria, IndexedDB, `chrome.storage.local` e dataset de feriados? [Coverage, Spec §QR-001, §QR-006, Constitution §III]
- [x] CHK038 As mensagens de erro especificam conteúdo útil ao usuário sem expor descrições, projetos, região ou outros dados pessoais em diagnósticos? [Clarity, Spec §QR-002, §QR-007–QR-008]
- [x] CHK039 As permissões obrigatórias e opcionais estão enumeradas com finalidade, momento da solicitação, consequência de recusa e comportamento após revogação? [Completeness, Spec §FR-013, §FR-040, §QR-005, Plan §Extension security]
- [x] CHK040 Os requisitos arquiteturais tornam objetivamente revisável a separação entre UI, casos de uso, domínio, persistência e operações privilegiadas? [Measurability, Spec §QR-003, Constitution §II, Plan §Project Structure]

## Dependências e pressupostos

- [x] CHK041 A procedência comunitária do catálogo de feriados está aceita como pressuposto, com nível de confiabilidade, licença, cobertura e responsabilidade de atualização documentados? [Assumption, Research §7, Holiday Dataset Contract]
- [ ] CHK042 A matriz de compatibilidade entre React, Ant Design, Vite e Chrome 120+ está documentada, incluindo versões suportadas, dark mode padrão e política de atualização? [Dependency, Plan §Technical Context, §Minimum Chrome Version/Fallbacks]
- [ ] CHK043 O escopo local-only esclarece se desinstalação, limpeza de dados do navegador e troca de perfil implicam perda definitiva e como isso deve ser comunicado? [Gap, Spec §FR-008, §Assumptions, §Scope Boundaries]
- [ ] CHK044 A ausência de exportação/backup é consistente com o nível de confiabilidade prometido para o histórico e com os cenários de recuperação definidos? [Assumption, Spec §User Story 1, §SC-004, §Excluded]

## Notes

- Marque itens concluídos com `[x]` somente após ajustar ou justificar o requisito correspondente.
- Registre decisões e links ao lado do item para manter rastreabilidade.
- Itens CHK016–CHK022 representam divergências já observadas entre artefatos e devem ser resolvidos antes de `/speckit-tasks`.
- Revisão realizada em 2026-08-17: 29 de 44 critérios estão sustentados pelos artefatos atuais.
- Lacunas residuais aceitas pelo usuário para início da implementação: CHK006, CHK013, CHK023–CHK026, CHK028, CHK030–CHK031, CHK033–CHK034, CHK036 e CHK042–CHK044. Elas permanecem desmarcadas e não devem ser tratadas como requisitos verificados.
