# Contrato de mensagens v2

Todas as mensagens continuam objetos JSON validados por Zod no emissor e no receptor. O service worker aceita somente remetentes da própria extensão; o documento offscreen aceita somente mensagens com alvo explícito `offscreen`. Tipos desconhecidos retornam `INVALID_MESSAGE` e nunca são encaminhados por prefixo sem validação discriminada.

## Comandos adicionados

### Projetos

```ts
type RestoreProject = {
  type: 'project.restore';
  payload: { id: string; expectedRevision: number };
};

type RemoveProject = {
  type: 'project.remove';
  payload: { id: string; expectedRevision: number };
};
```

- `project.restore` retorna o projeto ativo atualizado; `DUPLICATE` mantém arquivado quando o nome conflita.
- `project.remove` revalida revisão, estado arquivado e ausência de registros em uma transação. Retorna `PROJECT_HAS_RECORDS`, `CONFLICT` ou `NOT_FOUND` sem alteração parcial.

### Atualização de registro

```ts
type UpdateRecordV2 = {
  type: 'record.update';
  payload: {
    id: string;
    record: {
      projectId: string;
      localDate: string;
      startMinute: number;
      endLocalDate?: string;
      endMinute?: number;
      durationMinutes?: number;
      details: string;
    };
  };
};
```

`expectedRevision` deixa de fazer parte de `record.update`. O retorno contém a versão completa e a revisão derivada da versão persistida imediatamente antes do commit. `record.delete` mantém `expectedRevision`.

Quando a entrada usa `durationMinutes`, o domínio deriva `endLocalDate/endMinute`; quando usa fim, ambos os campos finais são obrigatórios. Exatamente um dos modos é aceito.

### Rascunhos

```ts
type SettingsDraftSection = 'region' | 'workdays' | 'reminders' | 'month-view' | 'reminder-sound';

type DraftContext =
  | { surface: 'sidepanel'; formKind: 'record'; intent: 'create'; contextKey: string }
  | { surface: 'sidepanel'; formKind: 'record'; intent: 'edit'; entityId: string; contextKey: string }
  | { surface: 'sidepanel'; formKind: 'project'; intent: 'create' | 'edit'; entityId?: string; contextKey: string }
  | { surface: 'sidepanel'; formKind: 'settings'; intent: 'update'; contextKey: SettingsDraftSection }
  | { surface: 'reminder'; formKind: 'record' | 'snooze'; intent: 'create' | 'update'; contextKey: string };

type DraftValues =
  | { formKind: 'record'; projectId?: string; localDate?: string; startTime?: string; mode?: 'end' | 'duration'; endLocalDate?: string; endTime?: string; durationHours?: string; details?: string }
  | { formKind: 'project'; name?: string }
  | { formKind: 'settings'; section: SettingsDraftSection; fields: Record<string, string | number | boolean | string[] | null> }
  | { formKind: 'snooze'; slotId?: string; targetLocalDate?: string; durationHours?: string };

type DraftRequest =
  | { type: 'draft.get'; payload: DraftContext }
  | { type: 'draft.upsert'; payload: DraftContext & { values: DraftValues } }
  | { type: 'draft.delete'; payload: DraftContext };
```

- `draft.upsert` aceita valores incompletos, mas exige que `values.formKind` coincida com o contexto, aplica allowlist de campos por formulário e seção, limita identificadores e rejeita payload serializado acima de 8 KiB.
- A resposta retorna `id` e `updatedAt`; conteúdo não entra em eventos ou logs.
- Salvamento bem-sucedido de registro, projeto, seção de Configurações ou snooze é seguido no mesmo caso de uso pela remoção do rascunho indicado; se a limpeza falhar depois do dado final salvo, a resposta declara o salvamento e marca limpeza pendente, evitando novo submit silencioso.

### Preferências

```ts
type UpdateMonthView = {
  type: 'settings.updateMonthView';
  payload: { mode: 'notice' | 'eventRange'; expectedRevision: number };
};

type UpdateReminderSound = {
  type: 'settings.updateReminderSound';
  payload: { soundId: string; expectedRevision: number };
};
```

`soundId` precisa existir no catálogo compilado. Preview não usa mensagem de persistência e não altera revisão; salvar a escolha usa `settings.updateReminderSound`.

## Mensagem interna de áudio

```ts
type PlayReminderSound = {
  type: 'audio.play';
  target: 'offscreen';
  payload: {
    soundId: string;
    playbackId: string;
  };
};

type AudioResult =
  | { ok: true; playbackId: string }
  | { ok: false; playbackId: string; code: 'UNKNOWN_SOUND' | 'PLAYBACK_FAILED' };
```

- `playbackId` é o ID estável da ocorrência e impede reprodução duplicada durante reentrada do mesmo alarme.
- O offscreen resolve o asset por allowlist; caminhos/URLs nunca vêm da mensagem.
- Falha retorna ao service worker para diagnóstico seguro, mas não fecha nem invalida o popup.

## Eventos

`entity.changed` passa a aceitar `draft` e `preferences`, além dos tipos v1. Para `draft`, o evento contém somente ID/revisão temporal e não o conteúdo. `reminder.opened` permanece e direciona o popup já existente para a ocorrência mais recente.

## Erros v2

Além dos códigos existentes:

- `PROJECT_HAS_RECORDS`: remoção bloqueada por vínculo atual.
- `DRAFT_UNAVAILABLE`: falha ao ler/gravar rascunho; formulário continua aberto e exibe que a recuperação não está garantida.
- `AUDIO_UNAVAILABLE`: preview ou reprodução indisponível; lembrete permanece utilizável.

Mensagens de erro não incluem detalhes do registro, nome do projeto, conteúdo do rascunho ou caminho físico do perfil.

## Compatibilidade

- Todos os contextos visíveis e o service worker são atualizados juntos com a extensão; não há compatibilidade rolling entre versões do contrato.
- Requests v1 de `record.update` com `expectedRevision` podem ter o campo extra removido pelo schema estrito da UI antes do envio; o handler v2 não usa a revisão antiga.
- Dados persistidos v1 são migrados antes de handlers v2 operarem.
