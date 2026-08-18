# Contrato de persistência v2

## IndexedDB

Banco `logbook`, versão `2`.

| Store        | Chave | Índices                                    | Alteração                                                  |
| ------------ | ----- | ------------------------------------------ | ---------------------------------------------------------- |
| `projects`   | `id`  | `by-status`, `by-normalized-name`          | Valores ganham `colorSlot`                                 |
| `records`    | `id`  | `by-date`, `by-project`, `by-date-project` | Valores ganham `endLocalDate`; `endMinute` vira `0..1439`  |
| `formDrafts` | `id`  | `by-updated-at`                            | Nova store, nunca usada por consultas, totais ou lembretes |
| `holidays`   | `id`  | `by-date`, `by-scope`                      | Sem alteração                                              |
| `metadata`   | `key` | —                                          | `schemaVersion=2`                                          |

Toda leitura passa por Zod/entidade. Um valor v2 inválido produz `STORAGE_UNAVAILABLE`; a aplicação não corrige nem apaga silenciosamente conteúdo de usuário.

## Transações críticas

### `record.update` last-write-wins

1. Abrir `records` em `readwrite`.
2. Ler por ID; ausente → `NOT_FOUND`.
3. Validar o payload completo contra projeto/data/intervalo.
4. Construir valor com `revision=current.revision+1`, `createdAt=current.createdAt` e novo `updatedAt`.
5. `put` e concluir.

A revisão do editor não participa. A transação serializa commits e garante revisão monotônica mesmo com dois contextos.

### `record.delete`

Mantém compare-and-swap com `expectedRevision`; conflito não exclui.

### `project.restore`

Abrir `projects` em `readwrite`, reler alvo/revisão e índice de nome, exigir arquivado e inexistência de ativo equivalente, então gravar ativo com revisão incrementada.

### `project.remove`

Abrir `projects` e `records` na mesma transação `readwrite`, reler projeto/revisão/status e consultar `records.by-project`. Qualquer registro bloqueia; caso contrário excluir apenas o projeto. Nenhuma exclusão em cascata.

### Rascunho

`upsert` substitui o snapshot parcial inteiro por ID e atualiza `updatedAt`. Escritas vindas de uma mesma instância são coalescidas: uma em voo e apenas o snapshot mais recente aguardando. `delete` é idempotente.

## Consulta de períodos com interseção

Para `[start,end]` inclusivo de dias:

1. Consultar índice `by-date` de `start-1 dia` até `end`.
2. Restaurar/validar cada registro.
3. Manter apenas intervalos com `record.end > start@00:00` e `record.start < (end+1)@00:00`.
4. Ordenar por início civil e criação; retornar cada `id` uma vez.

O lookback de um dia é suficiente devido ao máximo de 24 horas. Filtros de projeto/texto são aplicados depois da interseção e antes da paginação.

## Migração 1 → 2

A migração ocorre na transação `versionchange`:

- criar `formDrafts` e índice;
- percorrer e validar todos os projetos, atribuindo `colorSlot` determinístico;
- percorrer registros, acrescentar `endLocalDate` e normalizar `endMinute=1440` para dia seguinte/0;
- confirmar que a duração calculada não mudou;
- gravar `metadata.schemaVersion=2` por último.

Qualquer erro aborta integralmente o upgrade. Nenhum store v1 é apagado ou recriado. Fixtures cobrem banco vazio, dados típicos, `24:00`, centenas de projetos, valor malformado e interrupção.

## chrome.storage.local

Chaves versionadas relevantes:

- `settings.current`: envelope v2 com `monthViewMode` e `reminderSoundId`;
- `reminder.schedule`: mantém agenda v1, mas o fluxo de ativação exige somente a permissão opcional `alarms`;
- `reminder.windowId`: substitui o antigo `mainWindowId` e referencia exclusivamente `reminder.html`;
- `audio.lastPlayback`: somente `{ playbackId, playedAt }`, sem conteúdo do usuário, para deduplicação recuperável;
- `app.schemaVersion`: valor 2.

Metadados antigos de janela principal deixam de ser lidos e são removidos somente após a migração confirmar que nenhum dado funcional depende deles.

## Envelope v2 e recuperação

```ts
type EnvelopeV2<T> = {
  version: 2;
  value: T;
};
```

- Leitor aceita v1 ou v2; v1 recebe defaults controlados e é regravado como v2 após validação.
- `monthViewMode` inválido → `notice`; `reminderSoundId` desconhecido → primeiro som do catálogo, com indicação recuperável em Configurações.
- Falha de quota mantém envelope anterior e retorna erro; não reporta sucesso.
- Preferências preservam compare-and-swap por revisão.

## Limites e privacidade

- Rascunhos: máximo serializado de 8 KiB; detalhes de registro até 2.000 caracteres, nome de projeto até 120, duração textual até 32 e IDs/contextos limitados pelo contrato. Campos são allowlisted por `formKind`/seção.
- Áudio e catálogo não entram em armazenamento como blobs; somente ID.
- Nenhum diagnóstico inclui nomes, detalhes, rascunhos ou região.
- Side Panel, popup e offscreen não acessam armazenamento diretamente; passam por casos de uso/repositórios.
