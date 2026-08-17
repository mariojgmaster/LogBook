<!--
Sync Impact Report
- Version change: template (unratified) -> 1.0.0
- Added principles:
  - I. Clareza e simplicidade
  - II. Camadas separadas e baixo acoplamento
  - III. Segurança, validação e erros por padrão
  - IV. Testes automatizados para regras críticas
  - V. Orientação técnica atual e oficial
- Added sections:
  - Restrições para Chrome Extension
  - Fluxo de desenvolvimento e gates de qualidade
- Removed sections: none (template placeholders were concretized)
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ AGENTS.md
  - ✅ .specify/templates/commands/ (directory contains no command files)
- Follow-up TODOs: none
-->
# LogBook Constitution

## Core Principles

### I. Clareza e simplicidade
O código MUST expressar intenção com nomes precisos, funções pequenas e fluxos explícitos. A solução
MUST adotar a arquitetura mais simples que satisfaça os requisitos atuais; abstrações, dependências e
generalizações especulativas MUST NOT ser adicionadas. Complexidade inevitável MUST ser documentada no
plano com a alternativa mais simples considerada e a razão objetiva para sua rejeição.

### II. Camadas separadas e baixo acoplamento
Toda funcionalidade MUST separar interface, regra de negócio e persistência. A interface MUST apenas
coletar/apresentar dados e orquestrar casos de uso; regras de negócio MUST ser independentes de DOM e de
APIs do Chrome; persistência MUST ser acessada por contratos explícitos e substituíveis. Dependências MUST
apontar para contratos da camada de negócio, e comunicação entre contextos da extensão MUST usar mensagens
tipadas e limitadas ao caso de uso. Atalhos que façam a UI acessar armazenamento diretamente ou que
incorporem regra de negócio em listeners de interface são proibidos.

### III. Segurança, validação e erros por padrão
Nenhuma funcionalidade pode ser implementada sem validação de entrada, tratamento de erro e comportamento
seguro definido. Todos os dados externos à camada que os recebe — inclusive DOM, formulários, mensagens,
armazenamento e respostas de rede — MUST ser tratados como não confiáveis, validados contra esquema e
normalizados antes do uso. Falhas MUST produzir resultado controlado, mensagem útil ao usuário quando
aplicável e diagnóstico sem segredos ou dados pessoais. Operações privilegiadas MUST permanecer no service
worker, com validação do remetente e allowlist de ações e argumentos. Conteúdo não confiável MUST ser
inserido com APIs seguras de DOM, nunca por sinks como `innerHTML`, `eval` ou `new Function`.

### IV. Testes automatizados para regras críticas
Regras críticas — perda ou corrupção de dados, permissões, segurança, migração, integridade do log e ações
irreversíveis — MUST ter testes automatizados determinísticos antes de serem consideradas concluídas.
Cada correção de defeito em uma regra crítica MUST incluir um teste de regressão. Contratos entre interface,
negócio, persistência e mensageria MUST ser testados quando alterados. Testes MUST cobrir sucesso, limites,
entradas inválidas e falhas das dependências; uma justificativa explícita no plano é obrigatória para qualquer
regra crítica que não possa ser automatizada.

### V. Orientação técnica atual e oficial
Antes de planejar ou implementar HTML, CSS, JavaScript client-side ou APIs de extensão, o responsável MUST
consultar a skill `modern-web-guidance` para o caso de uso concreto e registrar no plano os guias relevantes.
Para decisões de Chrome Extension, a documentação atual do Google em `developer.chrome.com/docs/extensions`
MUST ser consultada no mesmo ciclo de trabalho e prevalece sobre exemplos, memória do agente ou orientações
genéricas conflitantes. Decisões dependentes de versão MUST registrar a fonte, a data da consulta e o impacto
em `minimum_chrome_version` ou em fallback.

## Restrições para Chrome Extension

- A extensão MUST usar Manifest V3. Todo JavaScript, WebAssembly e CSS executável MUST estar empacotado na
  extensão; código hospedado remotamente é proibido.
- Permissões e host permissions MUST seguir privilégio mínimo. Recursos opcionais MUST usar permissões
  opcionais quando suportado; `<all_urls>` exige justificativa aprovada no plano.
- O service worker MUST ser projetado como efêmero: listeners são registrados no escopo superior e estado
  necessário entre execuções MUST ser persistido. Variáveis globais não podem ser fonte de verdade.
- `chrome.storage` MUST ficar atrás da camada de persistência. Dados armazenados MUST ter esquema, versão,
  valores padrão, validação de leitura, tratamento de quota/falha e migração quando o formato mudar.
- Content scripts MUST permanecer no mundo isolado salvo requisito documentado. Dados vindos da página e
  mensagens MUST ser validados; dados sensíveis e capacidades privilegiadas não podem ser expostos a eles.
- Requisições de rede MUST usar HTTPS, destinos restritos e timeouts/cancelamento quando aplicável. Um content
  script MUST NOT conseguir fazer o service worker buscar uma URL arbitrária.
- CSP MUST permanecer compatível com Manifest V3 e não pode ser relaxada para permitir execução remota ou
  strings executáveis.

## Fluxo de desenvolvimento e gates de qualidade

Cada especificação MUST declarar critérios de aceitação para entrada inválida, falhas esperadas, impacto nas
três camadas, dados persistidos e permissões necessárias. Cada plano MUST passar pela Constitution Check antes
da pesquisa e novamente após o desenho, incluindo evidências da `modern-web-guidance` e da documentação oficial
do Google. Cada lista de tarefas MUST incluir validação, tratamento de erro e testes das regras críticas antes
da implementação correspondente.

Uma mudança somente está concluída quando lint, checagem de tipos (se disponível), testes automatizados e
validação do fluxo afetado passam. Revisões MUST rejeitar acoplamento entre camadas, permissões excessivas,
entrada não validada, erros engolidos, logs sensíveis e complexidade sem justificativa. Exceções MUST ser
registradas em Complexity Tracking com risco, mitigação, responsável e prazo de remoção.

## Governance

Esta constituição prevalece sobre convenções, planos e práticas conflitantes do projeto. Emendas exigem uma
proposta documentada, análise de impacto nos templates e artefatos ativos, aprovação do mantenedor e plano de
migração quando alterarem código existente. A versão segue SemVer: MAJOR para remoção ou redefinição
incompatível de princípios, MINOR para novo princípio ou ampliação material e PATCH para esclarecimentos sem
mudança normativa.

Toda revisão de especificação, plano, tarefas e código MUST verificar conformidade. Violações não justificadas
bloqueiam a implementação ou entrega. A cada emenda, o Sync Impact Report e a data de alteração MUST ser
atualizados, e os templates dependentes MUST ser sincronizados no mesmo change set.

**Version**: 1.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
