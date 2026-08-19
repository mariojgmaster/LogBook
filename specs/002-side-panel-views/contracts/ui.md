# Contrato de UI/UX v2

## Superfícies

### Side Panel

Única superfície da aplicação principal. Contém navegação Diário, Projetos e Configurações, ação Novo registro e uma região `aria-live="polite"`. Diálogos e confirmações Ant Design são overlays internos, não janelas popup do navegador.

### Popup de lembrete

Contém somente data lembrada, formulário de registro, snooze e fechar. Não contém navegação global, lista de projetos, calendário ou Configurações. Quando reutilizado, atualiza a ocorrência, restaura o rascunho da nova chave e move foco para o título/contexto.

## Layout responsivo

O wrapper de conteúdo é um container `inline-size`. “Largura útil” é o content box desse wrapper depois de padding e espaço de scrollbar; zoom participa naturalmente do cálculo. A ordem do DOM acompanha a ordem visual.

| Largura útil | Lista/detalhe/formulário                                                                                           | Mês                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `<480 px`    | Uma coluna. Detalhe/formulário substitui a lista; ação Voltar restaura seleção, filtros, scroll e foco no gatilho. | Agenda vertical: Notice agrupado por dia; Event Range um cartão por registro com início/fim. |
| `>=480 px`   | Mestre–detalhe em duas áreas quando aplicável; formulário usa a área de detalhe.                                   | Grade de sete colunas com Notice ou Event Range.                                             |

Fallback sem container queries: comportamento `<480 px`. Não há rolagem horizontal da página. Toolbars quebram linha; controles não encolhem abaixo do conteúdo identificador; texto longo pode quebrar.

Ao cruzar 480 px, preservar destino, modo, mês/dia, filtros, seleção, rascunho e contexto de retorno. Foco permanece no conteúdo ativo; não anunciar mera reorganização visual.

## Shell e navegação

- Em largura estreita, navegação principal usa menu/drawer compacto existente; em largura ampla pode usar menu visível, sem duplicar controles focáveis.
- Um `h1` por destino; skip link; ação primária sempre alcançável.
- O Side Panel aberto pelo ícone inicia no último destino interno válido ou Diário como default.
- Abrir/fechar Side Panel não confirma formulário.

## Formulário e rascunho

- Usar os mesmos controles/form rules Ant Design; labels visíveis, validação após interação e no submit.
- `onValuesChange` publica snapshot parcial imediatamente, sem debounce, em fila coalescente. Exibir “Protegendo rascunho”, “Rascunho salvo” ou “Não foi possível proteger a alteração mais recente” sem toast por tecla. Navegação interna aguarda `flush()`; fechamento externo restaura o último snapshot confirmado.
- Ao encontrar rascunho, preencher os campos, mostrar tag “Não salvo” e ação Descartar. Não substituir um formulário já sujo por evento externo.
- Voltar/navegar/fechar mantém rascunho. Salvar ou descartar remove.
- Edição concorrente não abre `ConflictDialog`: cada submit válido substitui a versão atual e a lista reage ao `entity.changed` mais recente.

## Horas

- Componentes consomem o codec da camada de aplicação e exibem `formatDurationHours(value) + " h"`; nunca calculam conversões nem mostram “min” em labels, ajuda, validação, resumo ou snooze.
- Campo aceita string pt-BR canônica com vírgula; teclado decimal apropriado; sufixo `h`; exemplos próximos ao controle (`0,5 h = meia hora`).
- Entrada não canônica ou fora do limite mostra erro sem alterar o minuto persistido.
- Horários civis continuam `HH:mm`; registro que termina no dia seguinte exibe também a data final.

## Visão Dia

- Cada card mantém projeto, intervalo, duração em horas e trecho de detalhes.
- Ao lado de Detalhes existe botão de ícone Copiar com nome acessível `Copiar descrição de <projeto>`.
- Copia somente `details`; sucesso/falha é anunciado. Clique não abre o detalhe nem seleciona o card.

## Visão Quinzena

- Dia preenchido mantém cabeçalho, registros, total e ações existentes.
- Dia vazio vira linha/cartão compacto com data e estado “Sem registros”; não renderiza `DailyView`, resumo nem botão Registrar atividade.
- A ação Novo registro global continua disponível e inicia na data de referência atual.

## Mês — regras comuns

- Configurações oferece radio/segmented control com Notice Calendar e Event Range; salvar é independente das outras seções.
- Cor vem de `Project.colorSlot`, acompanhada do nome. Estado selecionado/foco não depende somente da cor.
- Clique/Enter em item abre detalhe sem trocar para modo Dia e preserva mês, modo, filtro e scroll.
- Registros são recebidos uma vez; projeções visuais nunca alimentam totais.

### Notice Calendar

- `>=480`: cada célula lista os segmentos dos registros que intersectam o dia. Registro noturno aparece em dois dias, com horário do segmento, mas mesma identidade.
- `<480`: agenda vertical agrupada por dia, incluindo apenas dias com registros; estado vazio mensal é único e não lista 28–31 linhas vazias.

### Event Range

- `>=480`: faixa CSS Grid contínua entre início/fim; ao cruzar semana, divide apenas o desenho na borda, preservando `recordId`, label e navegação como um item lógico.
- `<480`: cartão único por registro com data/hora inicial → data/hora final.
- Intervalo encerrado às 00:00 não cria segmento vazio no novo dia.

### Overflow de célula (`>=480`)

- Altura da área de itens é estável em todos os dias.
- Um token `--month-cell-block-size` define a mesma altura para todas as células da densidade/largura corrente; inserir 1, 4 ou 20 itens não altera a caixa externa nem a altura da linha da grade.
- `overflow-y:auto` nativo; nenhum scrollbar customizado.
- Quando houver overflow, sombra/gradiente indica conteúdo adicional.
- Região recebe nome acessível com data e quantidade; itens permanecem tabbable em ordem cronológica.
- Teclas Page Up/Down, setas quando oferecidas pelo componente e rolagem padrão funcionam; ao alcançar borda, wheel/touchpad continua na página.

## Projetos arquivados

- Cada arquivado mostra Restaurar e Remover.
- Restaurar com conflito de nome mantém o card arquivado e mostra erro junto à ação.
- Remover abre confirmação destrutiva com nome e irreversibilidade. Com registros, ação é bloqueada/explicada antes e revalidada no commit.
- Falha mantém card/scroll/foco; sucesso de restauração move para ativos, sucesso de remoção retira e anuncia.

## Configurações de som

- Exibir pelo menos cinco opções por nome, cada uma com botão Ouvir. Som em preview é interrompido ao ouvir outro.
- Seleção visual pode mudar sem persistir; somente Salvar som confirma.
- Reabrir mostra preferência confirmada, não o último preview.
- Ativar lembretes explica e solicita `alarms`; negar mantém o agendamento desativado. Falha de áudio não impede o popup.
- Concessão parcial equivale a negação controlada. Revogar qualquer permissão desativa a agenda efetiva; uma nova ativação solicita novamente somente as permissões ausentes e reconcilia alarmes após concessão completa.
- Falha de preview aparece junto ao item; falha em disparo não bloqueia popup e não mostra erro intrusivo durante preenchimento.
- Para aceite automatizado, áudio disponível significa asset allowlisted carregado, saída do harness não silenciada e Promise de `play()` resolvida. Rejeição da Promise, asset ausente/corrompido e falha offscreen são estados recuperáveis distintos; volume físico silenciado não é inferido.

## Estados e acessibilidade

- Side Panel, popup de lembrete, Notice Calendar, Event Range, projetos arquivados e Configurações de som preveem loading, vazio, sucesso, falha recuperável e retry. O popup mantém formulário/snooze utilizáveis se áudio falhar; calendários usam um único vazio mensal; projetos e sons mantêm o item que falhou. Skeleton não troca dimensões estruturais.
- Botões de ícone têm nome; foco `:focus-visible`; alvos mínimos 44×44; contraste de texto 4,5:1 e controles/ícones 3:1.
- Scroll containers só entram no tab order quando necessário e têm nome acessível.
- Zoom de texto a 200% não perde conteúdo/ações; nada depende de hover.
- Testes obrigatórios por teclado em 320, 479, 480 e 800 px, tema escuro, `prefers-reduced-motion` e forced colors.
