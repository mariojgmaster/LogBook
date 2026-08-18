# Quickstart de implementação e validação — versão 002

## Pré-requisitos

- Node.js 22 LTS e npm compatível
- Google Chrome 120+
- Dependências do projeto sem alteração: `npm install`
- Extensão v1 carregada com dados de teste para validar a migração v2

## Comandos de qualidade

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:security
npm run build
npm run test:e2e
```

Para validação manual, executar `npm run build`, abrir `chrome://extensions`, recarregar a extensão e apontar “Carregar sem compactação” para `dist/`. Mudanças em manifest, entradas HTML, service worker ou assets de áudio exigem novo build e reload da extensão.

## Ordem recomendada

1. Criar testes/fixtures da migração v1→v2 e atualizar entidades de intervalo, projeto, preferências e rascunho.
2. Implementar migração IndexedDB e envelope de configurações; provar preservação antes de alterar UI.
3. Alterar contratos/casos de uso de projeto, atualização last-write-wins, consulta por interseção e rascunhos.
4. Separar entradas `sidepanel.html`, `reminder.html` e `audio.html`; atualizar Vite/manifest e portas Chrome.
5. Integrar Side Panel e manter a janela popup somente no caminho do alarme.
6. Adicionar catálogo com pelo menos cinco WAVs, preview e playback offscreen.
7. Implementar conversor de horas e migrar todos os textos/campos visíveis.
8. Implementar restaurar/remover projetos, copiar descrição e quinzena minimalista.
9. Implementar projeções Notice/Event Range, cores persistidas, overflow e variações abaixo/acima de 480 px.
10. Completar E2E, acessibilidade, segurança, desempenho e inspeção manual.

## Cenários de dados e domínio

### Migração

1. Preparar banco v1 com projeto ativo/arquivado, registros comuns e registro encerrado em `1440`.
2. Abrir a v2.
3. Confirmar banco versão 2, `colorSlot` em todos os projetos, `endLocalDate` em todos os registros e store `formDrafts` vazia.
4. Confirmar que `1440` virou `00:00` do dia seguinte e que nenhuma duração/total mudou.
5. Injetar fixture v1 inválida e confirmar aborto completo, sem limpeza parcial.

### Horas

- Verificar `120→2 h`, `30→0,5 h`, `1→0,0167 h` em cards, totais, formulários, jornada, validações e snooze.
- Aceitar entradas canônicas equivalentes a minuto inteiro; rejeitar ambíguas/fora do limite sem gravar.
- Confirmar que horários permanecem `HH:mm`.

### Intervalos civis

- Mesmo dia: 09:00→10:30 = 1,5 h.
- Meia-noite: 23:30→dia seguinte 00:00 = 0,5 h e sem segmento vazio no segundo dia.
- Cruzamento: 22:00→dia seguinte 02:00 = 4 h, dividido por feriado/jornada de cada data.
- Limites: exatamente 24 h aceito; zero, mais de 24 h e mais de uma meia-noite rejeitados.

### Concorrência

- Abrir o mesmo registro em Side Panel e popup de lembrete; salvar A e depois B; confirmar conteúdo integral de B e revisão monotônica, sem diálogo.
- Tentar excluir com revisão antiga; confirmar `CONFLICT`.
- Abrir confirmação de remoção de projeto arquivado vazio, criar registro concorrente antes de confirmar e verificar bloqueio sem perda.

## Cenários de plataforma

### Side Panel e popup

1. Clicar na action e confirmar Side Panel, sem janela criada.
2. Navegar por Diário/Projetos/Configurações e confirmar que overlays permanecem internos.
3. Disparar alarme devido e confirmar uma única janela `reminder.html`.
4. Disparar outra ocorrência e confirmar reuso/foco da mesma janela.
5. Fechar Side Panel e confirmar que nenhum popup principal aparece.

### Permissões e som

1. Com lembretes desligados, confirmar que `alarms` não foi concedida; `offscreen` permanece declarada para áudio local.
2. Ouvir cada uma das pelo menos cinco opções; selecionar sem salvar e reabrir para confirmar preferência anterior.
3. Salvar ativação, conceder ambas as permissões e confirmar agenda.
4. Disparar lembrete e confirmar popup seguido de uma única reprodução do som selecionado.
5. Simular `play()` rejeitado/offscreen indisponível: popup e snooze continuam operáveis, sem repetição em loop.
6. Revogar `alarms`: agenda efetiva é desativada e o logbook permanece funcional; falha de áudio não impede o popup.

### Clipboard

- Copiar uma descrição com caracteres especiais e quebras; confirmar conteúdo exato, sem projeto/horário.
- Rejeitar a Promise de clipboard e confirmar mensagem acessível e registro intacto.

## Cenários responsivos e de UI

Executar em larguras úteis 320, 479, 480 e 800 px:

- abaixo de 480: lista→detalhe/formulário em uma coluna, Voltar restaura filtros/scroll/foco;
- a partir de 480: mestre–detalhe lado a lado;
- cruzar 480 durante edição sem perder rascunho/seleção;
- nenhuma rolagem horizontal da página, inclusive a 200% de zoom;
- teclado completo, foco visível e ordem igual ao DOM.

### Rascunhos

- Digitar e imediatamente navegar/fechar; reabrir e confirmar último snapshot enviado, tag “Não salvo” e Descartar.
- Repetir em criação, edição e popup de lembrete.
- Confirmar que rascunho não altera total nem suprime lembrete.
- Salvar e descartar removem o rascunho; falha de persistência é informada sem fingir proteção.

### Dia e Quinzena

- Dia preenchido mostra Detalhes + Copiar e copia sem abrir o detalhe.
- Dia vazio mantém ação de criação.
- Na quinzena, dias vazios são compactos e não mostram Registrar atividade; preenchidos preservam conteúdo e ações.

### Mês

- Salvar Notice, reabrir e confirmar persistência; repetir Event Range.
- Notice: registro 22:00→02:00 aparece nos dois dias, uma vez nos totais.
- Event Range largo: faixa atravessa dias e quebra visualmente apenas na semana; seleção abre a mesma identidade.
- Event Range estreito: um cartão por registro com início/fim completos.
- Células com 1, 4 e 20 itens mantêm altura; todos os itens são alcançáveis por mouse/teclado e a página continua rolando no limite.
- Projetos distintos usam slots diferentes enquanto houver paleta disponível e sempre exibem nome.

## Desempenho e segurança

- Rodar benchmark de período com 10.000 registros, incluindo cruzamentos, e manter p95 ≤ 2 s.
- Confirmar que coalescência de rascunho mantém no máximo uma escrita em voo por formulário.
- Inspecionar `dist/`: somente código/assets locais; no mínimo cinco WAVs; sem sourcemap publicado quando o perfil de release assim exigir.
- Teste de manifest deve aceitar `storage`, `sidePanel` e `offscreen` como declaradas, somente `alarms` como opcional, e rejeitar `clipboardRead`, `clipboardWrite` e qualquer host permission.
- Fuzz de mensagens rejeita URL/path de som, draft acima de limites, data final inválida e remetente externo.

## Gates de entrega

Todos os comandos de qualidade devem passar. Além disso:

- migração preserva 100% dos dados válidos v1;
- action abre somente Side Panel e alarmes são o único caminho para popup;
- cinco sons têm preview e disparo validado;
- nenhum valor visível de duração permanece rotulado em minutos;
- testes de 320/479/480/800 px e teclado passam;
- nenhuma regressão nos cálculos de hora, feriados, snooze ou persistência da versão 001.

Consulte [data-model.md](./data-model.md) e os contratos de [mensagens](./contracts/messages.md), [persistência](./contracts/storage.md), [plataforma](./contracts/platform.md) e [UI](./contracts/ui.md) para os critérios completos.

## Resultado da validação final — 2026-08-17

- `prettier --check`: aprovado.
- `eslint . --max-warnings 0`: aprovado, sem avisos.
- `tsc -b --pretty false`: aprovado em modo strict.
- Vitest: 49 arquivos e 146 testes aprovados.
- Cobertura V8 serializada: 84,53% statements, 78,57% branches, 85,84% functions e 88,03% lines; todos os thresholds aprovados.
- Auditoria de segurança v2: permissões, entradas, clipboard, sinks, código remoto e textos de duração aprovados.
- Build Vite das quatro entradas: aprovado.
- Playwright da extensão empacotada: 23/23 cenários aprovados.
- Benchmark mensal: 5 aquecimentos + 20 amostras com 10.000 registros; amostras entre 78,44 ms e 111,64 ms, gate p95 ≤ 2 s aprovado. Feedback local entre 0,0009 ms e 0,0095 ms, gate ≤ 100 ms aprovado.

Para reproduzir cobertura em máquinas com menor memória, use `vitest run --coverage --maxWorkers=1 --no-file-parallelism`; a serialização evita pressão do pool sem alterar o conjunto de testes.
