# Feature Specification: Side Panel e Visualizações Aprimoradas

**Feature Branch**: `master`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Na versão 002, abrir a aplicação principal em side panel, manter somente lembretes em popups com som configurável e preview, exibir durações em horas, permitir remover ou restaurar projetos arquivados e aprimorar as visões de Dia, Quinzena e Mês com cópia de descrição e modos Notice Calendar e Event Range."

## Clarifications

### Session 2026-08-17

- Q: Se o mesmo registro for alterado no side panel e no popup de lembrete, como o segundo salvamento deve se comportar? → A: O último salvamento substitui silenciosamente o anterior.
- Q: Como listas, formulários e painéis de detalhes devem se adaptar à largura disponível? → A: Abaixo de 480 px, uma coluna com navegação de ida e volta; a partir de 480 px, lista e detalhes lado a lado.
- Q: Abaixo de 480 px, como Notice Calendar e Event Range devem ser apresentados? → A: Em agenda vertical: Notice Calendar agrupado por dia e Event Range em cartões com início e fim.
- Q: A partir de 480 px, o que deve acontecer quando os registros não couberem na célula de um dia? → A: A célula mantém sua altura e oferece rolagem vertical própria.
- Q: O que deve acontecer ao sair de um formulário alterado e ainda não salvo? → A: Preservar um rascunho local e restaurá-lo com indicação de não salvo e ação para descartar.

## Precedência sobre a versão 001

Esta especificação substitui explicitamente três regras da versão 001: a aplicação principal deixa de usar janela popup e passa a usar somente o Side Panel; `record.update` deixa de exibir conflito otimista e passa a aceitar last-write-wins; e registros deixam de estar limitados ao mesmo dia, podendo terminar no dia civil seguinte por até 24 horas. Popup de lembrete, CAS para exclusões/projetos/configurações e todos os demais requisitos v1 não alterados continuam válidos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Usar o logbook no painel lateral (Priority: P1)

Como usuário, quero abrir a aplicação principal no painel lateral do navegador para consultar e registrar atividades sem perder de vista a página em que estou, enquanto os lembretes continuam aparecendo em janelas próprias.

**Why this priority**: A mudança define o novo ponto de entrada e o contexto de uso de toda a aplicação.

**Independent Test**: Acionar a extensão em uma janela normal, navegar entre as áreas principais no painel lateral e disparar um lembrete, confirmando que somente o lembrete abre em popup.

**Acceptance Scenarios**:

1. **Given** uma janela normal do navegador, **When** o usuário aciona a extensão, **Then** a aplicação principal é aberta ou revelada no painel lateral dessa janela.
2. **Given** a aplicação aberta no painel lateral, **When** o usuário navega entre Diário, Projetos e Configurações, **Then** todas as áreas permanecem utilizáveis dentro do painel.
3. **Given** um lembrete devido para uma data ainda não preenchida, **When** ele dispara, **Then** uma janela popup dedicada abre o fluxo de registro dessa data, independentemente do estado do painel lateral.
4. **Given** uma janela popup de lembrete já aberta, **When** ocorre novo disparo que deva usar essa janela, **Then** a janela existente é reutilizada e trazida para primeiro plano.
5. **Given** menos de 480 px de largura útil, **When** o usuário abre detalhes ou formulário a partir de uma lista, **Then** o novo conteúdo ocupa uma única coluna e oferece ação Voltar que restaura o contexto anterior.
6. **Given** pelo menos 480 px de largura útil, **When** o usuário abre detalhes a partir de uma lista, **Then** lista e detalhes aparecem lado a lado sem rolagem horizontal da página.
7. **Given** a área de Configurações, **When** o usuário consulta os sons de lembrete, **Then** encontra pelo menos cinco opções audíveis e pode ouvir cada uma antes de salvar sua escolha.
8. **Given** um som de lembrete selecionado, **When** um lembrete devido abre seu popup, **Then** o som escolhido é reproduzido uma vez e o fluxo de preenchimento permanece disponível mesmo se a reprodução falhar.
9. **Given** o Side Panel aberto, **When** o usuário cria ou edita um registro, **Then** formulário, validação, salvamento e retorno ao contexto ocorrem dentro do painel, sem janela popup.
10. **Given** o popup restrito de lembrete, **When** o usuário preenche, aplica snooze ou fecha, **Then** somente o contexto da ocorrência é alterado e nenhuma navegação global é exposta.

---

### User Story 2 - Ler durações em horas (Priority: P1)

Como usuário, quero ver e informar durações em horas para interpretar totais, jornadas e intervalos na unidade que uso no acompanhamento do trabalho.

**Why this priority**: A unidade aparece em vários fluxos centrais e deve ser consistente para não gerar interpretação ou lançamento incorreto.

**Independent Test**: Preparar valores equivalentes a 120 e 30 minutos e verificar, em todas as telas relevantes, que são apresentados e editados como 2 h e 0,5 h sem alterar a duração real.

**Acceptance Scenarios**:

1. **Given** uma duração equivalente a 120 minutos, **When** ela é exibida, **Then** o usuário vê `2 h`.
2. **Given** uma duração equivalente a 30 minutos, **When** ela é exibida, **Then** o usuário vê `0,5 h` no padrão pt-BR.
3. **Given** um campo de duração, jornada, total ou snooze antes expresso em minutos, **When** o usuário o consulta ou edita, **Then** a unidade apresentada é hora e a conversão preserva o valor temporal exato.
4. **Given** um horário civil de início ou fim, **When** ele é exibido ou editado, **Then** permanece no formato de relógio aplicável e não é convertido em duração decimal.

---

### User Story 3 - Gerenciar projetos arquivados (Priority: P2)

Como usuário, quero restaurar um projeto arquivado ou remover definitivamente um projeto arquivado sem histórico para manter a lista de projetos organizada e recuperar projetos encerrados por engano.

**Why this priority**: O arquivamento precisa ser reversível, e projetos descartáveis não devem permanecer indefinidamente no catálogo.

**Independent Test**: Arquivar dois projetos, um vazio e outro com registros; restaurar o projeto com registros, remover o vazio e verificar a proteção contra remoção do projeto que ainda possui histórico.

**Acceptance Scenarios**:

1. **Given** um projeto arquivado, **When** o usuário escolhe restaurá-lo, **Then** ele volta ao estado ativo e pode ser selecionado em novos registros, preservando nome e histórico.
2. **Given** um projeto arquivado sem registros vinculados, **When** o usuário solicita sua remoção e confirma a ação, **Then** o projeto é removido definitivamente da aplicação.
3. **Given** um projeto arquivado com ao menos um registro vinculado, **When** o usuário tenta removê-lo, **Then** a remoção é bloqueada, o histórico permanece intacto e a aplicação explica como resolver a dependência.
4. **Given** uma falha ao restaurar ou remover, **When** a operação termina, **Then** o estado anterior permanece e o usuário recebe retorno de falha e opção de tentar novamente.

---

### User Story 4 - Agir rapidamente na visão diária e ler a quinzena (Priority: P2)

Como usuário, quero copiar a descrição de um registro diretamente na visão diária e quero que dias vazios da quinzena ocupem menos atenção visual.

**Why this priority**: São melhorias frequentes de consulta e reutilização do conteúdo já registrado.

**Independent Test**: Copiar a descrição de um item da visão Dia e consultar uma quinzena com dias cheios e vazios, confirmando a cópia e o tratamento minimalista dos dias vazios.

**Acceptance Scenarios**:

1. **Given** um registro na visão Dia, **When** o usuário aciona o ícone de copiar ao lado de Detalhes, **Then** a descrição completa, sem rótulos ou metadados adicionais, é copiada e a aplicação confirma o sucesso.
2. **Given** que a cópia não pode ser concluída, **When** o usuário aciona o ícone, **Then** a aplicação informa a falha sem alterar o registro.
3. **Given** uma quinzena com dias sem registros, **When** ela é exibida, **Then** esses dias usam uma apresentação reduzida e não mostram botão de Registrar atividade.
4. **Given** uma quinzena com ao menos um registro em um dia, **When** ela é exibida, **Then** esse dia mantém as informações e ações previstas para dias preenchidos.

---

### User Story 5 - Escolher a visualização mensal (Priority: P3)

Como usuário, quero escolher entre Notice Calendar e Event Range para visualizar o mês da forma mais adequada, distinguindo projetos por cor e entendendo registros que atravessam a meia-noite.

**Why this priority**: Os dois modos atendem necessidades diferentes de leitura sem alterar os registros de origem.

**Independent Test**: Criar registros de projetos distintos, incluindo um que termine no dia seguinte; alternar a preferência mensal em Configurações e verificar conteúdo, cores, continuidade e persistência da escolha.

**Acceptance Scenarios**:

1. **Given** a preferência Notice Calendar, **When** o usuário abre a visão Mês, **Then** cada dia lista os registros que intersectam esse dia e registros de projetos diferentes têm cores diferentes.
2. **Given** a preferência Event Range, **When** o usuário abre a visão Mês, **Then** cada registro é representado como um intervalo contínuo entre seu início e fim, inclusive quando atravessa a meia-noite.
3. **Given** registros diferentes do mesmo projeto, **When** qualquer modo mensal é exibido, **Then** eles usam a mesma identidade de cor; projetos diferentes recebem identidades distintas dentro da visualização.
4. **Given** uma preferência mensal salva, **When** o usuário fecha e reabre a aplicação, **Then** o modo escolhido continua ativo.
5. **Given** nenhuma preferência mensal previamente salva, **When** a visão Mês é aberta, **Then** Notice Calendar é usado como padrão.
6. **Given** menos de 480 px de largura útil e o modo Notice Calendar, **When** o usuário abre a visão Mês, **Then** os registros aparecem em agenda vertical agrupada por dia.
7. **Given** menos de 480 px de largura útil e o modo Event Range, **When** o usuário abre a visão Mês, **Then** cada registro aparece uma única vez em um cartão vertical que identifica seu início e fim, inclusive quando ocorrem em dias diferentes.
8. **Given** pelo menos 480 px de largura útil e registros que excedem a célula de um dia, **When** o calendário mensal é exibido, **Then** a célula mantém sua altura e permite rolar verticalmente por todos os registros nela contidos.

### Edge Cases

- Se o painel lateral não puder ser aberto no contexto atual do navegador, a aplicação informa a limitação e não abre a aplicação principal em um popup comum; lembretes continuam independentes.
- Nenhuma ação de Diário, Projetos ou Configurações abre uma janela popup do navegador; diálogos pertencentes a esses fluxos permanecem contidos no painel lateral. Somente a exibição de um lembrete abre popup.
- Se um formulário alterado for abandonado por navegação, fechamento do painel lateral ou fechamento do popup de lembrete, seu rascunho local permanece até ser salvo ou descartado explicitamente. Rascunhos não contam como registros concluídos.
- Se um rascunho restaurado estiver baseado em uma versão que foi alterada em outro contexto, seu salvamento posterior segue a regra de último salvamento prevalecer, sem aviso de conflito.
- Se o preview ou a reprodução do som falhar, a aplicação informa a falha quando houver interação direta, mantém a seleção anterior e não impede a abertura nem o uso do lembrete.
- Se a largura atravessar o limiar de 480 px durante uma interação, a aplicação reorganiza o conteúdo sem perder rascunho, seleção, filtros ou posição de retorno; o foco segue para o conteúdo ativo.
- Valores em horas que não resultem em minutos inteiros ou que estejam fora dos limites do campo são rejeitados com mensagem clara, sem arredondamento silencioso.
- A apresentação em horas remove zeros decimais desnecessários, usa vírgula decimal em pt-BR e preserva precisão suficiente para representar minutos inteiros.
- Um clique repetido no comando de copiar não modifica a descrição e produz uma confirmação para cada cópia concluída.
- Um projeto restaurado cujo nome conflite com o de outro projeto ativo não é restaurado até o usuário resolver o conflito de nome.
- Uma solicitação concorrente de restauração ou remoção usa o estado mais recente; nenhuma confirmação baseada em estado antigo pode apagar um projeto ou seu histórico.
- Se o mesmo registro for editado simultaneamente no painel lateral e no popup de lembrete, cada salvamento válido é aceito e o último a ser concluído substitui integralmente a versão anterior, sem aviso de conflito.
- Um registro que termina exatamente à meia-noite pertence ao intervalo que se encerra nesse instante e não cria conteúdo de duração zero no dia seguinte.
- Um registro que atravessa a meia-noite aparece nos dois dias no Notice Calendar sem duplicar sua duração nos totais; no Event Range, aparece como um único intervalo contínuo.
- Quando há mais projetos do que cores facilmente distinguíveis, a aplicação combina cor com identificação textual e nunca depende somente da cor.
- Quando a largura da visão Mês atravessa 480 px, o modo selecionado não muda: apenas sua apresentação alterna entre agenda vertical e calendário, preservando mês, filtros, seleção e posição de retorno.
- Uma célula mensal com rolagem deve indicar visualmente que existe conteúdo adicional, aceitar operação por teclado e não impedir a rolagem da página quando alcançar seu início ou fim.
- Dados de preferência mensal ausentes, inválidos ou desatualizados são substituídos pelo padrão Notice Calendar sem afetar registros.
- Falhas ao ler ou salvar configurações preservam a última preferência válida e oferecem retorno controlado.
- Mensagens ou dados persistidos malformados ou não autorizados são rejeitados sem alterar projetos, registros ou configurações.
- As projeções mensais cobrem primeiro e último dia, meses iniciados em qualquer dia da semana, quebra semanal, intervalo encerrado à meia-noite, duração de 24 horas, filtros ativos e mês inteiramente vazio nos dois modos e nas duas variações de largura.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A aplicação principal MUST abrir no painel lateral associado à janela normal do navegador quando o usuário acionar a extensão e MUST NOT usar popup como seu contêiner principal.
- **FR-002**: Diário, Projetos, Configurações e os fluxos de criação, consulta e edição MUST permanecer disponíveis no painel lateral. Abaixo de 480 px de largura útil, fluxos de lista para detalhe ou formulário MUST usar uma coluna, substituir temporariamente a lista e oferecer ação Voltar que restaure seleção, filtros e posição. A partir de 480 px, lista e detalhes MUST ser apresentados lado a lado quando o fluxo possuir ambos, sem exigir rolagem horizontal da página.
- **FR-003**: Somente a exibição de lembretes MUST abrir uma janela popup do navegador. Cada lembrete MUST usar popup dedicado ao preenchimento e MUST reutilizar essa janela quando já estiver aberta para o fluxo correspondente; todos os demais fluxos MUST permanecer contidos no painel lateral.
- **FR-004**: Uma falha ou indisponibilidade do painel lateral MUST produzir orientação compreensível e MUST NOT converter silenciosamente a aplicação principal em popup nem impedir o funcionamento futuro de lembretes.
- **FR-005**: Toda duração, jornada, total, saldo, limite temporal e valor de snooze apresentado ao usuário MUST ser expresso em horas; horários civis de início/fim e datas MUST conservar seu formato próprio. A auditoria MUST abranger Side Panel, popup de lembrete, Diário, Quinzena, Mês, detalhes, formulários de registro e snooze, Projetos, Configurações, validações, estados vazios, confirmações e mensagens de erro/sucesso.
- **FR-006**: Valores em horas MUST seguir formatação pt-BR, usar vírgula como separador decimal, omitir casas decimais sem valor e preservar equivalência com minutos inteiros; por exemplo, 120 minutos MUST aparecer como `2 h` e 30 minutos como `0,5 h`.
- **FR-007**: Campos que representam duração ou snooze MUST receber valores em horas, aceitar somente valores equivalentes a minutos inteiros dentro dos limites já aplicáveis e rejeitar entradas ambíguas, não finitas, fora do limite ou que exigiriam arredondamento silencioso.
- **FR-007A**: Para minutos cuja representação decimal em horas seja recorrente, o sistema MUST gerar uma forma canônica de até quatro casas decimais. Ao receber novamente essa forma canônica, o conversor MUST recuperar exatamente o minuto que a originou. Outras entradas aproximadas MUST ser rejeitadas quando não identificarem, sem ambiguidade, um número inteiro de minutos.
- **FR-008**: A mudança da unidade exibida MUST NOT alterar a duração, classificação, ordenação, soma ou histórico de qualquer registro existente.
- **FR-009**: A lista de projetos arquivados MUST oferecer ações distintas para restaurar e remover definitivamente cada projeto.
- **FR-010**: Restaurar um projeto MUST preservar sua identidade, nome e registros e torná-lo novamente disponível para novos registros.
- **FR-011**: A restauração MUST ser bloqueada quando o nome normalizado conflitar com um projeto ativo, preservando ambos os projetos e orientando o usuário a resolver o conflito.
- **FR-012**: A remoção definitiva MUST ser permitida somente para projeto já arquivado e sem qualquer registro vinculado e MUST exigir confirmação que identifique o projeto e a irreversibilidade da ação.
- **FR-013**: Uma tentativa de remover projeto com histórico MUST ser bloqueada e MUST informar que os registros precisam ser removidos ou reassociados antes da exclusão do projeto.
- **FR-014**: Operações de restauração e remoção MUST validar novamente o estado atual antes de confirmar a alteração e, em caso de conflito ou falha, MUST preservar o estado anterior.
- **FR-015**: Na visão Dia, cada registro MUST exibir, ao lado da ação Detalhes, um comando de copiar com nome acessível que copie somente a descrição completa do registro.
- **FR-016**: O resultado da tentativa de cópia MUST ser comunicado ao usuário; uma falha MUST NOT alterar o conteúdo ou estado do registro.
- **FR-017**: Na visão Quinzena, dias sem registros MUST ser apresentados de forma visualmente reduzida e MUST NOT exibir a ação Registrar atividade.
- **FR-018**: A ausência da ação em dias vazios da quinzena MUST NOT remover a ação primária global para criar um registro nem impedir o usuário de selecionar uma data por outros fluxos existentes.
- **FR-019**: Configurações MUST oferecer uma preferência de visualização mensal com exatamente as opções Notice Calendar e Event Range, salvá-la de forma independente e usar Notice Calendar quando não houver valor válido salvo.
- **FR-020**: A visão Mês MUST aplicar a preferência salva toda vez que for aberta e MUST permitir que uma alteração confirmada passe a valer sem modificar os registros.
- **FR-021**: No modo Notice Calendar, cada célula de dia MUST listar os registros cujo intervalo temporal intersecte aquele dia; um registro que atravesse a meia-noite MUST aparecer nos dias afetados sem duplicação nos totais.
- **FR-022**: No modo Event Range, cada registro MUST constituir um único intervalo lógico entre seu início e fim. Em grade com múltiplas semanas, sua representação MAY ser dividida visualmente somente nas bordas das linhas semanais, mas todos os segmentos MUST preservar o mesmo `recordId`, nome acessível, estado de seleção e destino de navegação. A divisão visual MUST NOT criar registros, totais ou elementos de navegação independentes.
- **FR-023**: Nos dois modos mensais, cada projeto MUST possuir uma identidade de cor estável dentro e entre consultas; projetos diferentes visíveis simultaneamente MUST usar cores distintas sempre que houver opção distinguível.
- **FR-024**: Cor MUST ser acompanhada pelo nome ou outra identificação textual do projeto, e os estados essenciais MUST permanecer compreensíveis sem percepção de cor.
- **FR-025**: Selecionar um registro em qualquer modo mensal MUST permitir abrir seus detalhes sem perder mês, modo, filtros ou posição de navegação atuais.
- **FR-026**: Um registro MUST poder terminar no dia civil seguinte ao início, com duração máxima de 24 horas; validações, totais e classificação de horas MUST considerar corretamente cada parcela do intervalo no respectivo dia civil.
- **FR-027**: Registros que cruzam a meia-noite MUST manter uma única identidade e MUST NOT ser duplicados na persistência nem nos totais, ainda que sua representação visual ocupe dois dias.
- **FR-028**: A migração das preferências e dados existentes MUST conservar projetos, registros, lembretes e configurações válidos. Ela MAY derivar somente os novos campos v2 necessários — `endLocalDate`, `Project.colorSlot`, `monthViewMode`, `reminderSoundId`, store de rascunhos e metadados substitutos da antiga janela principal — usando defaults determinísticos e sem alterar o significado dos dados v1.
- **FR-029**: Quando o mesmo registro for editado concorrentemente no painel lateral e no popup de lembrete, cada salvamento válido MUST substituir integralmente a versão persistida naquele momento; o último salvamento concluído MUST prevalecer sem aviso de conflito ou tentativa de mesclagem.
- **FR-030**: Abaixo de 480 px de largura útil, a visão Mês MUST usar agenda vertical sem alterar a preferência salva. Notice Calendar MUST agrupar registros por dia; Event Range MUST representar cada registro uma única vez em cartão que mostre início e fim completos, inclusive em dias diferentes. A partir de 480 px, a visualização mensal MUST retornar à apresentação em calendário correspondente ao modo selecionado.
- **FR-031**: A partir de 480 px, cada célula do calendário mensal MUST manter altura estável e, quando seu conteúdo exceder o espaço disponível, MUST oferecer rolagem vertical interna para acessar todos os registros. A célula MUST sinalizar conteúdo adicional, permitir rolagem por teclado e transferir a continuidade da rolagem para a página ao atingir seus limites.
- **FR-032**: Qualquer formulário de registro, projeto, Configurações ou snooze alterado e ainda não salvo MUST enfileirar imediatamente, sem debounce, um rascunho local. Navegação iniciada dentro da aplicação MUST aguardar a fila drenar; fechamento externo do Side Panel ou popup restaura o último snapshot cuja gravação foi confirmada. Enquanto existir escrita em voo, a UI MUST indicar “Protegendo rascunho”; falha MUST indicar que a alteração mais recente ainda não está protegida. Ao retornar ao mesmo contexto, o snapshot confirmado MUST ser restaurado com indicação de não salvo e ações para continuar ou descartar. O rascunho MUST ser removido somente após salvamento concluído ou descarte explícito e MUST NOT contar como registro preenchido.
- **FR-033**: Configurações MUST oferecer pelo menos cinco opções de som de lembrete, todas audíveis, curtas, em WAV e empacotadas com a aplicação, permitir preview imediato de qualquer opção sem salvá-la e conservar como preferência somente a opção confirmada pelo usuário. Cada som MUST ter ID estável; substituições futuras MUST preservar IDs existentes ou migrar o ID removido para um default válido. Na ausência de preferência válida ou quando um asset falhar, o default MUST permanecer selecionado e a falha MUST ser recuperável sem rede.
- **FR-034**: Quando um lembrete devido for exibido, inclusive após snooze, seu popup MUST reproduzir uma vez o som confirmado nas Configurações. Falha de reprodução MUST NOT impedir a abertura, o preenchimento, o snooze ou o fechamento do lembrete; falha de preview MUST ser informada sem substituir a preferência válida.

### Quality and Security Requirements *(mandatory)*

- **QR-001**: Valores em horas, preferências mensais, identificadores de projeto e comandos de cópia MUST ter forma aceita, limites, normalização e rejeição definidos em cada fronteira de entrada.
- **QR-002**: Falhas de abertura, cópia, leitura, gravação, restauração, remoção e migração MUST preservar o último estado válido e fornecer retorno compreensível e recuperação quando aplicável.
- **QR-003**: A interface MUST se limitar a apresentar e coletar ações; conversão temporal, elegibilidade de remoção, divisão de intervalos entre dias e escolha da identidade de projeto MUST permanecer como decisões verificáveis da camada de negócio; conservação e migração MUST permanecer na camada de persistência.
- **QR-004**: Conversões de unidade, intervalos entre dias, exclusão irreversível, restauração, migração, preferência mensal e integridade dos totais MUST ter testes automatizados de sucesso, limites, entrada inválida, concorrência e falha de dependência.
- **QR-005**: As permissões do navegador MUST se limitar às necessárias para painel lateral, armazenamento, lembretes e cópia; qualquer acesso opcional MUST ser solicitado no contexto de uso e sua recusa não pode corromper dados.
- **QR-006**: Mensagens entre contextos, dados persistidos e conteúdo destinado à área de transferência MUST ser validados e tratados como não confiáveis antes do uso.
- **QR-007**: Descrições e nomes de projetos MUST NOT ser incluídos em diagnósticos; a descrição só pode ser enviada à área de transferência após ação explícita do usuário no registro correspondente.
- **QR-008**: O painel lateral e as visualizações MUST manter navegação por teclado, nome acessível para ícones, foco visível, contraste suficiente e informação não dependente exclusivamente de cor.
- **QR-009**: Rascunhos MUST receber a mesma validação, proteção local e exclusão de diagnósticos aplicada ao conteúdo definitivo, sem serem interpretados como registros concluídos por consultas, totais ou lembretes.
- **QR-010**: Sons de lembrete MUST ser conteúdo local não executável, não podem exigir rede nem acesso a páginas visitadas e devem respeitar o volume e as capacidades de reprodução disponíveis no dispositivo.

### Accesses and Permissions

- **Painel lateral — obrigatório**: necessário para hospedar a aplicação principal, que é o objetivo central desta versão.
- **Armazenamento local — obrigatório**: necessário para conservar projetos, registros e preferências no perfil do usuário.
- **Agendamento de lembretes — opcional**: necessário apenas quando o usuário ativa lembretes; sua recusa mantém os demais fluxos funcionais.
- **Área de transferência — ação contextual sem permissão persistente**: a aplicação usa a Clipboard API exclusivamente durante a ativação transitória do comando Copiar em um documento do Side Panel com foco, escreve somente a descrição escolhida e não solicita `clipboardRead` nem `clipboardWrite`. Falha de compatibilidade ou de autorização produz retorno controlado.
- **Páginas e rede — não necessários**: esta versão não lê páginas visitadas, não requer acesso a endereços de sites e não transmite dados para serviços externos.

### Key Entities *(include if feature involves data)*

- **Projeto**: Agrupador com identidade estável, nome e estado ativo ou arquivado. Somente um projeto arquivado e sem registros pode ser removido; um projeto restaurado volta a aceitar novos registros.
- **Tarefa realizada**: Registro com identidade única, projeto, descrição e intervalo temporal. Pode terminar no dia seguinte ao início, sem ser duplicado quando representado em mais de um dia.
- **Preferência de visualização mensal**: Escolha local entre Notice Calendar e Event Range, com Notice Calendar como padrão quando ausente ou inválida.
- **Identidade visual de projeto**: Associação estável entre projeto e cor de apresentação, sempre acompanhada de identificação textual.
- **Valor de duração**: Quantidade temporal exata exibida e editada em horas, equivalente a um número inteiro de minutos para compatibilidade com os registros existentes.
- **Rascunho de formulário**: Estado local ainda não confirmado, associado ao contexto do formulário, restaurável após navegação ou fechamento e excluído após salvamento ou descarte.
- **Preferência de som de lembrete**: Referência local ao som audível confirmado pelo usuário entre pelo menos cinco opções disponíveis; define também o som usado por ocorrências após snooze.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes de fluxo, 100% dos acionamentos da aplicação principal em janelas compatíveis abrem ou revelam o painel lateral, enquanto 100% dos lembretes devidos continuam usando popup dedicado.
- **SC-002**: Em uma auditoria de todas as telas e mensagens, 100% dos valores de duração e totais antes apresentados em minutos aparecem em horas, e todos os pares de valores convertidos preservam exatamente a mesma duração.
- **SC-003**: Em teste de usabilidade, pelo menos 90% dos usuários conseguem restaurar um projeto arquivado ou remover um projeto arquivado vazio em até 30 segundos, sem assistência e sem perda de histórico.
- **SC-004**: Em teste de usabilidade, pelo menos 90% dos usuários copiam corretamente a descrição de um registro diário na primeira tentativa em até 10 segundos.
- **SC-005**: Em uma quinzena com dias vazios, 100% desses dias aparecem sem botão Registrar atividade e continuam identificáveis, enquanto dias preenchidos preservam seus registros e ações.
- **SC-006**: Para todos os cenários de teste com registros no mesmo dia e atravessando a meia-noite, Notice Calendar e Event Range representam os registros conforme o modo escolhido, sem duplicar registros ou duração nos totais.
- **SC-007**: Em teste de usabilidade, pelo menos 90% dos usuários conseguem mudar o modo mensal em Configurações e reconhecer projetos distintos e intervalos entre dias em até 45 segundos.
- **SC-008**: Após atualização e reinicialização do navegador, 100% dos projetos, registros, lembretes e preferências válidos anteriores permanecem disponíveis, e a nova preferência mensal mantém o último valor confirmado.
- **SC-009**: Em testes nas larguras úteis de 320, 479, 480 e 800 px, 100% dos fluxos de lista, detalhe e formulário permanecem operáveis sem rolagem horizontal da página, perda de rascunho ou perda do contexto de retorno.
- **SC-010**: Nas larguras úteis de 320 e 479 px, 100% dos registros mensais permanecem acessíveis em agenda vertical no modo escolhido; nas larguras de 480 e 800 px, 100% retornam ao calendário correspondente sem alterar mês, filtros ou preferência.
- **SC-011**: Em células mensais com 1, 4 e 20 registros, 100% dos itens permanecem acessíveis por mouse e teclado sem aumentar a altura da célula nem impedir a continuidade da rolagem da página em seus limites.
- **SC-012**: Em testes de Configurações, pelo menos cinco sons podem ser ouvidos por preview, somente a seleção confirmada persiste e 100% dos lembretes testados reproduzem uma vez o som selecionado quando o dispositivo permite áudio.
- **SC-013**: Em testes de navegação interna, 100% das navegações aguardam o rascunho pendente; em fechamento externo do painel lateral ou popup, 100% dos snapshots cuja gravação foi confirmada são restaurados sem afetar registros, totais ou supressão de lembretes, até salvamento ou descarte. Alteração ainda em voo é identificável pelo estado “Protegendo rascunho” e sua falha nunca é apresentada como salva.

## Assumptions

- Esta especificação evolui a versão 001; requisitos não alterados aqui continuam válidos.
- “Tudo tratado em minutos” significa toda unidade de duração visível ou editável, incluindo duração de tarefa, totais, jornada, limites e snooze. Horários civis continuam representados como hora do relógio.
- A representação em horas aceita valores equivalentes a minutos inteiros e mantém o padrão pt-BR; não há arredondamento que altere o tempo registrado.
- “Remover” significa exclusão permanente do projeto arquivado. Para proteger o histórico, a ação é restrita a projetos sem registros vinculados; registros podem ser excluídos ou reassociados pelos fluxos já existentes antes da remoção.
- Registros que atravessam dias têm duração máxima de 24 horas e podem terminar somente no dia civil seguinte; esta versão não inclui eventos com vários dias completos.
- No Notice Calendar, um registro que cruza a meia-noite é listado em cada dia que contém parte de sua duração. No Event Range, o mesmo registro mantém uma única identidade lógica; a grade larga pode segmentar somente o desenho nas bordas semanais.
- A cor representa o projeto, é estável e é complementada por texto; não representa a categoria de horas extras.
- A preferência mensal é local ao perfil do navegador e vale para todas as consultas mensais.
- A interface continua em português brasileiro; os nomes Notice Calendar e Event Range são mantidos como rótulos das opções solicitadas.
- Cada lembrete reproduz o som uma vez ao ser exibido; repetição contínua, controle de volume próprio e importação de áudio personalizado ficam fora desta versão.
- O fechamento de um contêiner não confirma dados: somente a ação explícita de salvar transforma um rascunho em registro definitivo.
- “Janela compatível” significa uma janela Chrome desktop de tipo `normal` pertencente a um perfil no qual a extensão está habilitada, incluindo incógnito somente quando a extensão tiver sido autorizada nesse modo. Janelas `popup`, DevTools, app/panel legado, guest sem extensão e ausência de janela ativa são incompatíveis e recebem falha controlada sem fallback para popup principal.
- “Largura útil” é a `inline-size` do content box do contêiner principal após padding e espaço de scrollbar; zoom altera essa medida naturalmente. O breakpoint pertence ao contêiner, não ao viewport da página visitada.
- “Dispositivo permite áudio” em testes significa documento offscreen criado, asset WAV allowlisted carregado, saída não silenciada pelo harness e `HTMLAudioElement.play()` resolvida. Rejeição de `play()`, asset ausente/corrompido e criação offscreen negada são falhas funcionais recuperáveis; volume físico ou sistema operacional silenciado não é inferido pela extensão.

## Scope Boundaries

### Included

- Migração do contêiner principal de popup para painel lateral, mantendo popups exclusivamente para lembretes.
- Conversão de toda apresentação e entrada de durações de minutos para horas.
- Restauração e remoção protegida de projetos arquivados.
- Cópia da descrição na visão Dia e simplificação visual dos dias vazios na Quinzena.
- Preferência e apresentação mensal nos modos Notice Calendar e Event Range.
- Suporte a registros de até 24 horas que terminem no dia seguinte.
- Migração compatível de dados e preferências existentes.
- Preservação e retomada de rascunhos de formulários no painel lateral e no popup de lembrete.
- Seleção entre pelo menos cinco sons locais de lembrete, com preview e reprodução na exibição do popup.

### Excluded

- Exclusão em cascata de registros ao remover um projeto.
- Eventos com duração superior a 24 horas ou que atravessem mais de uma meia-noite.
- Personalização manual das cores de projetos.
- Sincronização da preferência mensal entre perfis ou dispositivos.
- Alteração do modelo de recorrência, supressão ou snooze dos lembretes além da unidade exibida em horas.
- Importação de sons personalizados, reprodução contínua e controle de volume independente do dispositivo.
