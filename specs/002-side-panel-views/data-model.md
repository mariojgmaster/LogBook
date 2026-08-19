# Modelo de dados — Side Panel e Visualizações Aprimoradas

Este documento descreve o delta v2 sobre [o modelo da versão 001](../001-project-logbook/data-model.md). Datas de domínio continuam civis e locais; instantes de auditoria usam ISO 8601; durações persistidas continuam sendo minutos inteiros. Horas decimais pertencem somente à apresentação.

## Project v2

| Campo | Tipo | Regras |
|---|---|---|
| `id` | UUID | Imutável |
| `name` | string | Trim/normalização, 1–100 caracteres |
| `normalizedName` | string | Derivado, único entre projetos ativos |
| `status` | `active \| archived` | Somente arquivado pode ser removido |
| `colorSlot` | inteiro `0..11` | Persistido, atribuído automaticamente, não editável |
| `revision` | inteiro >= 1 | Incrementado em renomear, arquivar ou restaurar |
| `createdAt`, `updatedAt` | ISO instant | Auditoria |

### Invariantes e ações

- `restore`: exige `status=archived`, revalida que não exista projeto ativo com o mesmo `normalizedName`, muda para `active` e mantém `id`, `colorSlot` e histórico.
- `remove`: exige `status=archived` e zero registros com `projectId`; revalida ambas as condições na mesma transação que exclui.
- Novo projeto recebe o slot menos utilizado dentre os 12; empate escolhe o menor índice. Depois de 12 identidades simultâneas, repetição é permitida e o nome continua obrigatório na UI.
- Migração ordena projetos por `createdAt` e `id` e atribui slots cíclicos, produzindo resultado determinístico.

## LogRecord v2

| Campo | Tipo | Regras |
|---|---|---|
| `id` | UUID | Imutável |
| `projectId` | UUID | Referencia projeto existente |
| `localDate` | `YYYY-MM-DD` | Data civil inicial, nome preservado por compatibilidade |
| `startMinute` | inteiro `0..1439` | Minuto na data inicial |
| `endLocalDate` | `YYYY-MM-DD` | Igual a `localDate` ou dia civil seguinte |
| `endMinute` | inteiro `0..1439` | Minuto na data final; meia-noite é `0` do dia seguinte |
| `durationMinutes` | inteiro `1..1440` | Igual à diferença civil entre início e fim |
| `details` | string | Trim, 1–2.000 caracteres quando salvo |
| `revision` | inteiro >= 1 | Incrementado sobre a revisão persistida mais recente |
| `createdAt`, `updatedAt` | ISO instant | Auditoria |

O intervalo é semiaberto: `[localDate/startMinute, endLocalDate/endMinute)`. Isso significa que um registro encerrado exatamente `00:00` não ocupa o novo dia. A duração é:

```text
dayOffset * 1440 + endMinute - startMinute
```

onde `dayOffset` é 0 ou 1. O resultado precisa estar entre 1 e 1.440.

### Atualização e exclusão

- `update` recebe o payload completo, lê a versão persistida na transação, preserva `id`/`createdAt`, aplica os novos campos e grava `revision=current.revision+1`. Não compara a revisão vista pelo editor; o último commit válido prevalece.
- `delete` continua recebendo `expectedRevision` e falha com `CONFLICT` se o alvo mudou, pois é irreversível.
- Um rascunho antigo posteriormente salvo é tratado como qualquer payload completo e pode substituir a versão intermediária.

### Interseção e classificação

- Um registro intersecta um dia quando seu fim é posterior ao começo do dia e seu início é anterior ao fim do dia.
- Consulta de período lê registros iniciados desde `period.start - 1 dia` até `period.end`, filtra a interseção e retorna cada identidade uma vez.
- Para totais, o intervalo é dividido em segmentos derivados por data; cada segmento recebe jornada/feriado daquela data. Segmentos nunca são persistidos e a soma dos segmentos deve ser igual a `durationMinutes`.

## FormDraft

Rascunho preserva entrada parcial de registro, projeto, Configurações ou snooze. Valida forma e limites de segurança, mas não exige as invariantes do formulário finalizado.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | string | Chave canônica do contexto, máximo 240 caracteres |
| `surface` | `sidepanel \| reminder` | Origem do formulário |
| `formKind` | `record \| project \| settings \| snooze` | Discriminante obrigatório |
| `intent` | `create \| edit \| update` | Compatível com `formKind` |
| `entityId` | UUID opcional | Obrigatório ao editar registro/projeto |
| `contextKey` | string | Data, seção ou ocorrência, máximo 200 caracteres |
| `values` | união discriminada | Payload parcial permitido para `formKind`, máximo serializado de 8 KiB |
| `updatedAt` | ISO instant | Ordenação/diagnóstico sem conteúdo |

### Valores por formulário

- `record`: `projectId`, `localDate`, `startTime`, `mode`, `endLocalDate`, `endTime`, `durationHours` e `details` (máximo 2.000 caracteres).
- `project`: somente `name` (máximo 120 caracteres); cor e estado não são editáveis pelo rascunho.
- `settings`: seção allowlisted `region | workdays | reminders | month-view | reminder-sound` e somente os campos tipados dessa seção.
- `snooze`: `slotId`, `targetLocalDate` e `durationHours`; somente no popup de lembrete.

### Chaves

- `sidepanel:record:create:<localDate>` e `sidepanel:record:edit:<recordId>`
- `sidepanel:project:create` e `sidepanel:project:edit:<projectId>`
- `sidepanel:settings:<section>`
- `reminder:record:<slotId>:<targetLocalDate>` e `reminder:snooze:<slotId>:<targetLocalDate>`

Um rascunho não participa de consultas, totais, supressão de lembrete ou contagem de registros. Salvar com sucesso ou descartar explicitamente o remove. Navegação interna aguarda a fila; fechamento externo conserva o último snapshot confirmado.

## UserSettings v2

| Campo | Tipo | Regras |
|---|---|---|
| `region` | objeto opcional | Mantém contrato v1 |
| `monthViewMode` | `notice \| eventRange` | Default `notice` |
| `reminderSoundId` | string | Deve existir no catálogo empacotado; default primeiro item |
| `revision` | inteiro >= 1 | Compare-and-swap |
| `updatedAt` | ISO instant | Auditoria |

Preferência mensal e som são salvos em uma mesma operação de preferências ou por comandos focados que criam uma nova revisão. Valor desconhecido lido do armazenamento volta ao default controlado e gera estado recuperável, sem tocar nos registros.

## ReminderSoundCatalog (estático, não persistido)

| Campo | Tipo | Regras |
|---|---|---|
| `id` | string allowlisted | Estável entre versões |
| `label` | string pt-BR | Nome visível |
| `assetPath` | caminho relativo | WAV dentro do pacote |
| `durationMs` | inteiro positivo | Som curto, usado em testes/preview |

O catálogo contém no mínimo cinco itens audíveis. Mensagens transportam somente `id`; Side Panel e documento offscreen resolvem o caminho pelo mesmo catálogo compilado.

## HourDisplayValue (derivado)

Não é persistido. É a representação canônica pt-BR de um minuto inteiro:

- `formatDurationHours(120) = "2"`
- `formatDurationHours(30) = "0,5"`
- `formatDurationHours(1) = "0,0167"`

O codec pertence à camada de aplicação; o sufixo visual `h` pertence ao componente. O parser aceita vírgula e ignora zeros decimais finais. Primeiro aceita decimais cujo produto por 60 seja exatamente inteiro; para frações recorrentes, só retorna minutos quando a entrada corresponde ao mapa reverso das strings canônicas geradas para algum minuto inteiro dentro do limite do campo. Assim, `0,0167` recupera exatamente 1 minuto por identidade canônica, não por arredondamento aritmético.

## MonthProjection (derivado)

| Campo | Tipo | Uso |
|---|---|---|
| `days` | dias do mês | Base da grade/agenda |
| `noticeSegments` | segmentos por dia | Notice Calendar; vários segmentos podem referir o mesmo registro |
| `rangeSegments` | segmentos por semana | Event Range largo; todos mantêm o mesmo `recordId` |
| `rangeCards` | um por registro | Event Range abaixo de 480 px |
| `projectColors` | mapa `projectId -> colorSlot` | Cor e rótulo textual |

Projeções não alteram a lista original, não entram nos totais e preservam seleção por `recordId`.

## Persistência e migração v1 → v2

### IndexedDB

1. Criar store `formDrafts` com key path `id` e índice `by-updated-at`.
2. Percorrer `projects` por `createdAt,id`, adicionar `colorSlot` e validar antes de gravar.
3. Percorrer `records`:
   - se `endMinute < 1440`, definir `endLocalDate=localDate`;
   - se `endMinute === 1440`, definir `endLocalDate=localDate+1 dia` e `endMinute=0`;
   - recalcular e comparar `durationMinutes`; divergência aborta toda a migração.
4. Atualizar `metadata.schemaVersion=2` na mesma transação.

### chrome.storage.local

O envelope v2 acrescenta defaults de `monthViewMode` e `reminderSoundId`. Leitura aceita envelope v1, valida seu conteúdo, produz v2 em memória e só substitui a chave após gravação bem-sucedida. Falha preserva o envelope anterior e bloqueia apenas a configuração afetada.

## Relações

- `Project 1 — N LogRecord`; remoção de projeto exige `N=0`.
- `Project 1 — 1 colorSlot` persistido; um slot pode pertencer a vários projetos após esgotar a paleta.
- `FormDraft 0..N` não referencia entidades com integridade forte: se a entidade for removida, abrir o rascunho de edição oferece descarte e não recria automaticamente.
- `UserSettings.reminderSoundId N — 1 ReminderSoundCatalog.id` por validação de allowlist.

## Transições

- Projeto: `active -> archived -> active`; `archived + sem registros -> removed`.
- Registro: `saved(n) -> saved(n+1)` por último commit válido; `saved(n) -> removed` apenas com revisão esperada.
- Rascunho: `absent -> dirty -> persisted -> restored -> saved/absent` ou `restored -> discarded/absent`.
- Preferência: `default -> dirty -> saved`; falha retorna ao último valor salvo.
- Áudio: `idle -> ensuring-offscreen -> playing -> idle`; falha de qualquer etapa abre/mantém o popup e produz diagnóstico sem dados pessoais.
