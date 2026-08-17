# Relatório de validação — Logbook por projeto

**Data**: 2026-08-17
**Ambiente**: Windows, Node.js, Chromium fornecido pelo Playwright, fuso `America/Sao_Paulo`

## Readiness

A checklist foi revisada antes da implementação. Permanecem 15 lacunas de requisitos aceitas explicitamente para início do trabalho: CHK006, CHK013, CHK023–CHK026, CHK028, CHK030–CHK031, CHK033–CHK034, CHK036 e CHK042–CHK044. Resultado: 29/44 itens verificados.

## Verificações automatizadas

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Formatação | Aprovada | Todos os arquivos selecionados seguem Prettier |
| TypeScript strict | Aprovada | `tsc -b --pretty false` sem erros |
| ESLint e fronteiras | Aprovada | Zero erros e zero avisos |
| Testes Vitest | Aprovada | 23 arquivos, 47 testes aprovados |
| Cobertura | Aprovada | 84,30% statements; 77,09% branches; 91,02% functions; 89,20% lines |
| Build de produção | Aprovada com observação | Manifest, SPA e service worker gerados; chunk principal de 1.061,17 kB (337,24 kB gzip) excede o aviso de 500 kB do Vite |
| Auditoria de dependências | Aprovada | `npm audit`: 0 vulnerabilidades |
| Benchmark de 10 mil registros | Aprovada | média 4,1162 ms; p99 9,3958 ms; orçamento 2 s |
| Layout real da extensão | Aprovada | 4/4 cenários: 360×600, 640×700, 960×720 e 1440×900 |
| E2E com mensageria MV3 | Aprovada | 10/10 cenários aprovados, sem testes ignorados |

## Correção de inicialização da service worker

O erro inicialmente atribuído à mensageria do Chromium foi identificado como uma falha de inicialização: `chrome.alarms` é indisponível enquanto a permissão opcional não foi concedida, e o acesso direto a `chrome.alarms.onAlarm` encerrava a service worker com status 15. O listener passou a ser registrado de forma síncrona e condicional, com anexação e remoção também nos eventos `permissions.onAdded` e `permissions.onRemoved`. A solicitação da permissão foi movida para o gesto explícito do usuário na interface. Um teste de regressão remove o namespace `chrome.alarms` e comprova que a extensão continua inicializando.

## Dataset de feriados

O bundle contém manifesto, checksums, 27 UFs, 5.571 municípios e arquivos anuais de 2021 a 2028. A geração atual cobre feriados nacionais e estaduais fornecidos por `date-holidays` e usa a malha de municípios do IBGE. O provider e a importação transacional suportam escopo municipal, duplicidade e preservação do catálogo anterior, mas os arquivos gerados ainda não possuem a lista efetiva de feriados municipais.

## Itens ainda não comprovados integralmente

O acompanhamento final registra 82 de 96 tarefas concluídas em `tasks.md`; os 14 itens restantes continuam desmarcados.

- Recuperação E2E real para quota, dados malformados e restart da service worker.
- Catálogo efetivo e completo de feriados municipais nos arquivos distribuídos.
- Matriz integral de consulta com paginação e 10 mil registros, além do benchmark do classificador.
- Auditoria assistiva completa de teclado, foco, estados e contraste; os quatro layouts e a navegação básica foram exercitados.
- Execução manual de todos os passos do `quickstart.md` em uma instalação Chrome não automatizada.

## Referências consultadas antes da entrega

- Chrome Extensions: `chrome.alarms` e limite mínimo de 30 segundos no Chrome 120+.
- Chrome Extensions: ciclo de vida de service workers e necessidade de listeners no escopo superior.
- Modern Web Guidance: dark mode, formulários, navegação responsiva, validação após interação, acessibilidade e container queries.
