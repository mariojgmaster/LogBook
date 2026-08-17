# Contrato de persistência

## IndexedDB

Banco `logbook`, versão inicial `1`.

| Store | Chave | Índices |
|---|---|---|
| `projects` | `id` | `normalizedName`, `status` |
| `records` | `id` | `localDate`, `[projectId, localDate]`, `updatedAt` |
| `holidayCatalogs` | `version` | `generatedAt` |
| `holidays` | `[catalogVersion, date, scope, regionKey]` | `[catalogVersion, date]`, `[catalogVersion, regionKey, date]` |

Escritas validam schema antes da transação e entidades lidas são validadas antes de retornar. Falha de validação persistida produz `STORAGE`, não dados parciais.

Update/delete de entidade abre transação `readwrite`, lê a revisão, compara com `expectedRevision`, grava/incrementa ou aborta com `CONFLICT`. Criação usa `add`, nunca `put`, para não sobrescrever ID existente.

## chrome.storage.local

Chaves versionadas:

- `app.schemaVersion`
- `settings.current`
- `window.lastKnownId`
- `window.lastBounds`
- `reminder.nextOccurrence`
- `migration.lastSuccessfulVersion`

O ID da janela e o próximo lembrete são caches reconstruíveis. Configurações usam revisão otimista através de um adaptador que serializa alterações no processo responsável.

## Migrações e recuperação

- Cada migração é incremental, idempotente e testada com fixture da versão anterior.
- Backup lógico é feito apenas dentro da transação quando necessário.
- Erro mantém a versão anterior utilizável ou bloqueia escrita com mensagem de recuperação; nunca limpa dados automaticamente.
- O service worker não mantém fonte de verdade em memória.
