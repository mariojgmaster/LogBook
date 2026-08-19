# Contrato de plataforma Chrome v2

## Manifest

```json
{
  "minimum_chrome_version": "120",
  "permissions": ["storage", "sidePanel", "offscreen"],
  "optional_permissions": ["alarms"],
  "action": { "default_title": "Abrir LogBook" },
  "side_panel": { "default_path": "sidepanel.html" },
  "background": { "service_worker": "service-worker.js", "type": "module" }
}
```

Não há `action.default_popup`, `host_permissions`, `tabs`, `activeTab`, `clipboardRead`, `clipboardWrite`, `notifications`, `audio` ou acesso remoto. A CSP continua `script-src 'self'; object-src 'none'`.

## Entradas empacotadas

- `sidepanel.html` → `sidepanel-main.tsx`: shell completo de Diário, Projetos e Configurações.
- `reminder.html` → `reminder-main.tsx`: somente contexto da ocorrência, formulário, snooze e fechamento.
- `audio.html` → `audio-player.ts`: sem UI, somente listener validado para playback allowlisted.
- `service-worker.js`: listeners de runtime/action/windows/permissions/alarms registrados sincronamente no escopo superior.

Vite usa as quatro entradas sem alterar as dependências atuais.

## Side Panel

- Em instalação e startup, chamar `setPanelBehavior({ openPanelOnActionClick:true })`; falha controlada é registrada sem dados pessoais.
- O clique na action não chama `windows.create`.
- O painel é global por janela e permanece disponível em todos os sites; nenhuma tab/URL é consultada.
- Não depender de eventos `onOpened/onClosed` indisponíveis no Chrome 120. Rascunhos garantem recuperação independentemente do conhecimento do ciclo de fechamento.
- Contextos incompatíveis exibem orientação pelo comportamento nativo; não existe fallback para popup principal.

## Popup de lembrete

- Somente uma ocorrência de lembrete pode chamar `windows.create({ type:'popup', url:'reminder.html?...' })`.
- Reutilização valida que o ID armazenado ainda existe, é `popup` e contém URL da própria extensão; então foca e envia `reminder.opened` com dados validados.
- O ID usa `reminder.windowId`; fechar a janela remove somente esse metadado.
- Nenhum fluxo do Side Panel chama a porta `ReminderWindowPort`.

## Ativação e revogação de lembretes

1. Usuário ativa e salva no Side Panel.
2. Solicitar a permissão opcional `alarms` dentro do gesto; `offscreen` permanece declarada para o som local.
3. Se `alarms` não for concedida, manter agenda desativada e explicar que o agendamento depende dela.
4. Se concedida, salvar agenda e reconciliar alarmes.
5. Revogar `alarms` desativa a agenda efetiva e cancela alarmes, sem afetar registros.
6. Falha de áudio/offscreen nunca remove o listener, cancela alarmes ou impede o popup.

O contrato de testes do manifest confirma `offscreen` declarada e somente `alarms` opcional no Chrome mínimo.

## Reprodução de áudio

- Depois que a janela de lembrete for criada/focada, o service worker lê `reminderSoundId`, garante `audio.html` via `runtime.getContexts({ contextTypes:['OFFSCREEN_DOCUMENT'] })` e `offscreen.createDocument({ reasons:['AUDIO_PLAYBACK'] })` quando necessário.
- Uma promise compartilhada somente durante a execução corrente evita duas criações simultâneas; o estado recuperável vem de `getContexts`, não da variável global.
- Enviar `audio.play` com `soundId` e `playbackId`; o player rejeita IDs/caminhos desconhecidos.
- Cada `playbackId` toca no máximo uma vez. Nova ocorrência ou snooze tem ID distinto.
- `HTMLAudioElement.play()` rejeitado vira `AUDIO_UNAVAILABLE`; popup e agenda não são cancelados.
- O documento pode encerrar após 30 segundos sem áudio, conforme o ciclo oficial. Não chamar `offscreen.hasDocument()` porque requer Chrome 150.

## Preview de som

- Executado diretamente no Side Panel como consequência do clique em “Ouvir”.
- Parar/reiniciar o preview anterior antes de tocar outro para não sobrepor sons.
- Preview nunca grava preferência; botão Salvar usa mensagem de configuração.
- Falha é exibida junto ao controle e preserva o valor salvo.

## Clipboard

- `navigator.clipboard.writeText(record.details)` somente no handler imediato do clique/teclado do botão Copiar, enquanto o documento do Side Panel possui foco e ativação transitória.
- Nunca ler o clipboard.
- Não solicitar nem declarar permissão persistente `clipboardRead` ou `clipboardWrite`.
- Ausência de foco/ativação ou Promise rejeitada produz mensagem acessível e não usa `execCommand`, página intermediária ou offscreen.

## Mensageria e remetente

- `dispatchMessage` exige `sender.id===runtime.id` quando presente e URL iniciada por `runtime.getURL('')`.
- Mensagens offscreen têm `target:'offscreen'`; o listener geral as ignora depois de validação de tipo/alvo.
- Payloads não contêm URLs arbitrárias, HTML ou conteúdo de página.

## Falhas esperadas

| Falha                              | Comportamento                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `setPanelBehavior` falha           | Log seguro; usuário pode selecionar o painel pelo menu nativo; nenhum popup comum |
| Popup não pode ser criado          | Ocorrência permanece reconciliável; erro controlado                               |
| Permissão opcional negada/revogada | Lembretes desativados; app principal funcional                                    |
| Offscreen não inicia               | Popup abre sem som; diagnóstico seguro                                            |
| Áudio bloqueado/dispositivo mudo   | Popup continua; não repetir em loop                                               |
| Clipboard rejeita                  | Mensagem de falha junto à ação; registro intacto                                  |
