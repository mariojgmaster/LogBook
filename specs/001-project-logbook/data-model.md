# Modelo de dados — Logbook por projeto

Todas as datas de domínio são civis e locais. IDs são UUIDs; instantes de auditoria são strings ISO 8601 com offset. Durações são minutos inteiros.

## Project

| Campo | Tipo | Regras |
|---|---|---|
| `id` | UUID | Imutável |
| `name` | string | Obrigatório, trim, 1–100 caracteres |
| `normalizedName` | string | Derivado para busca/duplicidade |
| `status` | `active \| archived` | Projeto arquivado permanece nos históricos |
| `createdAt`, `updatedAt` | ISO instant | Auditoria |
| `revision` | inteiro >= 1 | Incrementado a cada alteração |

Nome duplicado normalizado é rejeitado entre projetos ativos. Projeto com registros não é removido fisicamente; pode ser arquivado.

## LogRecord

| Campo | Tipo | Regras |
|---|---|---|
| `id` | UUID | Imutável |
| `projectId` | UUID | Deve referenciar projeto existente |
| `localDate` | `YYYY-MM-DD` | Data civil fixa do registro |
| `startMinute` | inteiro 0–1439 | Obrigatório |
| `endMinute` | inteiro 1–1440 | Maior que início; mesmo dia |
| `durationMinutes` | inteiro 1–1440 | Igual a `endMinute - startMinute` |
| `details` | string | Obrigatório, trim, 1–2.000 caracteres |
| `createdAt`, `updatedAt` | ISO instant | Auditoria |
| `revision` | inteiro >= 1 | Controle otimista |

Entrada aceita `endMinute` ou `durationMinutes`. Se ambos forem enviados, devem ser consistentes. Sobreposição com outros registros é permitida e não reduz a soma.

## UserSettings

| Campo | Tipo | Regras |
|---|---|---|
| `id` | literal `current` | Singleton |
| `stateCode` | UF opcional | Obrigatória para feriados regionais |
| `municipalityIbgeCode` | string opcional | Deve pertencer à UF |
| `municipalityName` | string opcional | Snapshot para exibição |
| `workdayMinutes` | inteiro | Padrão 480; v1 fixado em 8h |
| `reminder` | `ReminderSchedule` | Configuração abaixo |
| `holidayCatalogVersion` | string opcional | Versão ativa |
| `revision` | inteiro >= 1 | Controle otimista |

## ReminderSchedule

| Campo | Tipo | Regras |
|---|---|---|
| `enabled` | boolean | `true` exige permissão `alarms` |
| `frequency` | `daily \| selectedWeekdays` | Recorrência admitida |
| `weekdays` | array de 1–7 | Vazio no diário; um ou mais dias no personalizado |
| `timeMinutes` | array de inteiros 0–1439 | Um ou mais horários únicos, ordenados |
| `snoozedOccurrence` | objeto opcional | ID da ocorrência, duração de 1–2.880 min e instante do novo disparo |

O próximo disparo recorrente é recalculado no fuso atual em cada reconciliação. Ao mudar de fuso, os horários civis configurados permanecem. O snooze usa duração decorrida, adia apenas a ocorrência atual e não modifica dias ou horários recorrentes; valores fora de 1–2.880 minutos são rejeitados. Enquanto `snoozedOccurrence` existir, horários recorrentes anteriores ao seu `fireAt` não geram ocorrências. Depois do disparo adiado, o campo é removido e somente a próxima recorrência futura é calculada.

## HolidayCatalog e HolidayEntry

`HolidayCatalog` contém `version`, `source`, `sourceRevision`, `checksum`, `generatedAt`, catálogo de municípios e cobertura de anos. Cada `HolidayEntry` contém `date`, `name`, `scope` (`national`, `state`, `municipal`), `stateCode` opcional e `municipalityIbgeCode` opcional.

Entradas duplicadas na mesma data não duplicam minutos: basta uma ocorrência para classificar todo o domingo/feriado como 100%.

## HourSummary (derivado, não persistido)

Contém `normalMinutes`, `overtime50Minutes`, `overtime100Minutes`, `totalMinutes` e `byProject`. Para cada data: domingo ou feriado → tudo 100%; sábado → tudo 50%; segunda a sexta → primeiros 480 minutos normais e excedente 50%. A ordem dos registros não altera o resultado.

## Relações e índices

- `Project 1 — N LogRecord`.
- `records.byLocalDate` para períodos.
- `records.byProjectAndLocalDate` para resumo por projeto.
- `projects.byNormalizedName` para validação.
- Feriados indexados por data e escopo/região.

## Estados e transições

- Projeto: `active -> archived -> active`; arquivamento não altera registros.
- Registro: criar (`revision=1`), atualizar com revisão esperada, excluir com revisão esperada.
- Conflito: `clean -> stale -> reloaded` ou `stale -> reapplied`; nunca sobrescrever silenciosamente.
- Lembrete: `disabled -> permission-pending -> enabled -> snoozed -> enabled`; em `snoozed`, recorrências intermediárias são suprimidas. Negação/revogação leva a `disabled` com motivo exibido.
- Catálogo: `missing -> loading -> ready`; falha leva a `error`, preservando a última versão válida quando existir.
