# Contrato de mensagens

Mensagens entre janela e service worker são objetos JSON validados por Zod nos dois lados.

```ts
type Request<TType extends string, TPayload> = {
  version: 1;
  requestId: string;
  type: TType;
  payload: TPayload;
};

type Response<T> =
  | { ok: true; requestId: string; data: T }
  | { ok: false; requestId: string; error: AppError };
```

`AppError.code`: `VALIDATION`, `NOT_FOUND`, `CONFLICT`, `PERMISSION_DENIED`, `STORAGE`, `CATALOG_UNAVAILABLE`, `UNEXPECTED`. Erros expõem mensagem segura e detalhes por campo; `CONFLICT` inclui a entidade atual e sua revisão.

## Comandos

- `project.create`, `project.update`, `project.archive`
- `record.create`, `record.update`, `record.delete`
- `settings.updateRegion`, `settings.updateWorkday`, `settings.updateReminder`
- `reminder.reconcile`, `reminder.snooze`, `window.openOrFocus`

Updates/deletes carregam `expectedRevision`. Comandos são idempotentes por `requestId` durante a execução corrente; duplicidade persistente é evitada pelos IDs gerados antes do envio.

`reminder.snooze` recebe o ID da ocorrência, `targetLocalDate` original e `durationMinutes` inteiro entre 1 e 2.880. Valor inválido retorna `VALIDATION` e preserva a ocorrência vigente; o comando não altera a programação recorrente. Enquanto o snooze estiver pendente, `reminder.reconcile` não cria ocorrências recorrentes intermediárias. Se `targetLocalDate` for preenchida, cancela o snooze; registros em outras datas não o cancelam. Depois do disparo adiado, remove o snooze e agenda somente a próxima recorrência futura.

## Consultas

- `project.list`
- `record.get`
- `record.listPeriod` com `startDate`, `endDate`, filtros e paginação
- `summary.getPeriod` com totais gerais e por projeto
- `settings.get`
- `holiday.status` e `holiday.listForRegion`

O intervalo é inclusivo, validado e limitado a 366 dias por chamada. Respostas de lista têm `items`, `total`, `cursor` opcional e `snapshotRevision`.

## Eventos

- `entity.changed` identifica tipo, ID e nova revisão.
- `settings.changed` força recarga/reconciliação.
- `navigation.requested` informa rota após abertura por lembrete.

Recebedores ignoram versões/tipos desconhecidos com erro controlado; nunca executam código ou usam HTML recebido.
