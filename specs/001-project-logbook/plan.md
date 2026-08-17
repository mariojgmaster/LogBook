# Implementation Plan: Logbook por projeto

**Branch**: `master` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-logbook/spec.md`

## Summary

Construir uma extensão Chrome Manifest V3, local-first, para registrar tarefas por projeto, consultar o diário por dia, quinzena ou mês e calcular horas normais, extras de 50% e extras de 100%. Toda a interface será uma janela de navegador do tipo `popup`, aberta ou reutilizada pelo ícone da extensão e pelos lembretes, com React, TypeScript e Ant Design em tema escuro por padrão.

Os lembretes poderão ser diários ou associados a dias da semana, com um ou mais horários locais e snooze personalizado de 1 minuto a 48 horas. Enquanto houver snooze pendente, recorrências intermediárias serão suprimidas; o snooze preservará a data original e será cancelado quando essa data for preenchida. Depois do disparo adiado, a agenda normal será retomada na próxima ocorrência futura. O catálogo de feriados será estático, versionado, cobrirá uma janela móvel de oito anos e será empacotado sem rede em runtime.

A aplicação será um único projeto modular, sem backend: a interface chama casos de uso; casos de uso aplicam regras do domínio; repositórios isolam IndexedDB e `chrome.storage.local`; e o service worker apenas coordena eventos Chrome, alarmes, mensagens e a janela. Registros e configurações usam revisão otimista para detectar edições concorrentes antes de sobrescrever dados.

## Technical Context

**Language/Version**: TypeScript em modo `strict`, React 19.2 e Node.js 22 LTS para desenvolvimento

**Primary Dependencies**: React 19.2, Ant Design 6.6, Vite 8, `@vitejs/plugin-react` 6, Zod 4 para validação de contratos, `idb` para encapsular IndexedDB e Day.js apenas na borda de apresentação

**Storage**: IndexedDB para projetos, registros e catálogo regional de feriados; `chrome.storage.local` para configurações, versão de schema e metadados leves da janela; ambos acessados exclusivamente por repositórios

**Testing**: Vitest para domínio e integrações, React Testing Library para componentes e fluxos, `fake-indexeddb` para repositórios, e Playwright com Chromium para E2E da extensão empacotada

**Target Platform**: Google Chrome desktop 120+ em Windows, macOS e Linux, Manifest V3

**Project Type**: Extensão de navegador com uma SPA React e service worker

**Performance Goals**: 95% das consultas de período com até 10.000 registros prontas para interação em até 2 segundos; feedback visual de ações locais em até 100 ms; listas longas virtualizadas ou paginadas quando necessário

**Constraints**: Local-first; sem autenticação, sincronização ou backend; código executável empacotado; CSP restritiva; data/hora civil local imutável no registro; lembretes acompanham o fuso atual; janela redimensionável; idioma pt-BR; tema escuro padrão; permissões mínimas e solicitadas no contexto de uso

**Scale/Scope**: Um usuário e um perfil local por navegador; até 10.000 registros, centenas de projetos, visualizações diária/quinzenal/mensal, cadastro/edição, configurações, lembretes e totais por categoria/projeto

**Modern Web Guidance**: `accessibility`, `dark-mode`, `validate-input-after-interaction`, `size-aware-styling`, `forms`, `css-layout`, `component-specific-light-dark-theme`, `brand-consistent-forms`, `light-dismiss-a-dialog`; consultados em 2026-08-17. Aplicação: HTML semântico, foco visível e restaurado, rótulos explícitos, erros textuais anunciados, validação após interação/submit, contraste WCAG AA, layout estreito seguro e container queries como melhoria progressiva.

**Official Chrome Documentation**: [Manifest V3](https://developer.chrome.com/docs/extensions/reference/manifest), [permissions](https://developer.chrome.com/docs/extensions/reference/api/permissions), [windows API](https://developer.chrome.com/docs/extensions/reference/api/windows), [extension popups](https://developer.chrome.com/docs/extensions/develop/ui/add-popup), [alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms), [service worker events](https://developer.chrome.com/docs/extensions/get-started/tutorial/service-worker-events), [service worker lifecycle/storage](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers), [message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) e [remote code/CSP](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security), consultados em 2026-08-17

**Minimum Chrome Version/Fallbacks**: Chrome 120+. Container queries estão disponíveis desde Chrome 105; o layout estreito continua funcional sem elas. Alarmes são recriados no início do service worker e em `runtime.onInstalled`, sem depender de `persistAcrossSessions` (Chrome 150+). Falhas ou negação da permissão opcional `alarms` mantêm lembretes desativados sem afetar o logbook.

## Constitution Check

*GATE: aprovado antes da pesquisa e revalidado após o design da Fase 1.*

- **Simplicity — PASS**: uma extensão, uma SPA e um service worker; não há backend, sincronização, Redux ou abstração distribuída.
- **Layering — PASS**: dependência `ui -> application -> domain`; `infrastructure` implementa portas do domínio/aplicação e é injetada na composição.
- **Validation and errors — PASS**: formulários, mensagens e dados persistidos têm schemas; casos de uso repetem invariantes; respostas usam erros tipados e cada tela prevê vazio, carregamento, falha, retry e conflito.
- **Critical tests — PASS**: cálculos de hora, período, feriado, validações temporais, alarmes e compare-and-swap têm testes unitários/integrados; fluxos essenciais têm E2E.
- **Extension security — PASS**: MV3, sem código remoto, CSP padrão/restrita, `alarms` opcional, sem `tabs`/host permissions, mensagens validadas, dados renderizados como texto e service worker sem estado volátil essencial.
- **Current guidance — PASS**: guias modernos e documentação oficial Google estão registrados acima e refletidos em `research.md`, contratos e quickstart.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-logbook/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── holiday-dataset.md
│   ├── messages.md
│   ├── storage.md
│   └── ui.md
└── tasks.md                 # criado posteriormente por /speckit-tasks
```

### Source Code (repository root)

```text
manifest.json
package.json
tsconfig.json
vite.config.ts
public/
├── icons/
└── data/holidays/
scripts/
└── update-holidays.mjs
src/
├── background/
│   ├── service-worker.ts
│   ├── alarms.ts
│   ├── messages.ts
│   └── popup-window.ts
├── ui/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── records/
│   │   └── settings/
│   ├── hooks/
│   └── theme/
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
└── unit/
```

**Structure Decision**: projeto único por ser uma extensão local e pequena, com módulos por responsabilidade. O domínio não importa React, Ant Design, Chrome nem IndexedDB. A UI é organizada por feature, enquanto contratos e repositórios preservam os limites entre processo da janela e service worker.

## Complexity Tracking

Nenhuma violação constitucional identificada. O uso combinado de IndexedDB e `chrome.storage.local` é encapsulado por uma única camada de persistência: IndexedDB atende consultas/indexação de dados volumosos; `chrome.storage.local` atende configurações pequenas e integração natural com eventos da extensão.
