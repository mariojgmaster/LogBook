# Feature Specification: Logbook por Projeto

**Feature Branch**: `master`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Criar uma extensão para o Google Chrome, para registro de logbook por projeto. Usuário deve conseguir cadastrar suas tarefas realizadas no dia, visualizar o diário de bordo por dia, semana ou mês, receber alertas de preenchimento de log, diariamente (ou em período customizado)."

## Clarifications

### Session 2026-08-17

- Q: Como registros e lembretes devem se comportar após uma mudança de fuso horário? → A: Registros ficam
  fixos na data local escolhida; lembretes seguem o fuso local atual.
- Q: Quando solicitar permissão para lembretes e como apresentá-los? → A: Solicitar somente ao ativar o
  recurso; se negada, manter o logbook funcional e os lembretes desativados. Cada lembrete abre uma janela
  popup dedicada ao preenchimento.
- Q: Quais campos cada tarefa realizada deve ter? → A: Projeto, data e hora inicial e detalhes obrigatórios;
  não existe campo de título, e a regra de duração é complementada pelas decisões de cálculo de horas.
- Q: Como uma tarefa deve se associar a projetos? → A: Cada tarefa pertence obrigatoriamente a exatamente um
  projeto; a associação pode ser alterada na edição.
- Q: Qual layout deve organizar cadastro e consultas por período? → A: Uma única janela popup redimensionável,
  com visão diária em lista cronológica, quinzenal agrupada por dia e mensal em calendário; detalhes e edição
  abrem em painel sem perder o período selecionado.
- Q: Como classificar horas extras de 50% e 100%? → A: De segunda a sábado, o excedente à jornada prevista é
  extra de 50%; em domingos e feriados, todo o tempo trabalhado é extra de 100%.
- Q: Qual é a jornada prevista para cálculo das horas extras? → A: Oito horas diárias de segunda a sexta;
  sábado e domingo têm jornada prevista de zero.
- Q: Como informar o intervalo de tempo de uma tarefa? → A: Data e hora inicial são obrigatórias; o usuário
  informa hora final ou duração, podendo preencher ambas somente quando forem equivalentes.
- Q: Como tratar tarefas com intervalos sobrepostos? → A: Permitir a sobreposição e somar integralmente a
  duração de todas as tarefas nos totais, inclusive quando pertencem a projetos diferentes.
- Q: Como determinar os feriados usados no adicional de 100%? → A: O usuário seleciona estado e município nas
  Configurações; feriados nacionais, estaduais e municipais são carregados automaticamente.
- Q: Qual recorrência e quantidade de horários os lembretes devem aceitar? → A: Frequência diária ou
  personalizada por dias da semana, com um ou mais horários locais e opção de snooze.
- Q: Quais são os limites de projeto e detalhes, e a tarefa precisa de título? → A: Nome do projeto entre 1 e
  100 caracteres; detalhes obrigatórios entre 1 e 2.000 caracteres; não haverá campo de título.
- Q: Como organizar a navegação principal e as consultas por período? → A: Três destinos principais — Diário,
  Projetos e Configurações — com Dia, Quinzena e Mês selecionados dentro do Diário.
- Q: Como o catálogo de feriados deve ser obtido e atualizado? → A: Dataset nacional, estadual e municipal
  empacotado e versionado, atualizado somente com novas versões da extensão, sem acesso de rede em runtime.
- Q: Qual duração o snooze deve aceitar? → A: Duração personalizada entre 1 minuto e 48 horas; o limite não é
  exibido previamente, mas valores fora dele são rejeitados com mensagem de validação.
- Q: O que acontece se uma recorrência vencer enquanto há snooze pendente? → A: Ocorrências recorrentes
  intermediárias são suprimidas até o snooze disparar; depois, a recorrência normal é retomada na próxima
  ocorrência futura.
- Q: Qual data um snooze que atravessa dias deve representar? → A: A data local original da ocorrência; o
  snooze é cancelado se essa data for preenchida antes do disparo e não é cancelado por registros em outras datas.
- Q: Qual cobertura temporal o dataset de feriados deve oferecer? → A: Do quinto ano anterior ao ano corrente
  até o segundo ano posterior, com cobertura e indisponibilidade fora do intervalo exibidas ao usuário.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar atividades por projeto (Priority: P1)

Como usuário, quero criar projetos e registrar as tarefas realizadas em cada dia para manter um histórico
confiável do meu trabalho sem depender da memória.

**Why this priority**: O registro diário por projeto é o valor central do produto e torna possíveis todas as
formas posteriores de consulta e lembrete.

**Independent Test**: Criar um projeto, registrar duas tarefas para a data atual, fechar e reabrir a extensão e
confirmar que o registro continua associado ao projeto e à data corretos.

**Acceptance Scenarios**:

1. **Given** que não há projetos cadastrados, **When** o usuário informa um nome válido, **Then** o projeto é
   criado e fica disponível para novos registros.
2. **Given** um projeto ativo, **When** o usuário informa data e hora inicial, detalhes e uma hora final ou duração
   válida, **Then** a tarefa fica associada ao projeto e ao intervalo informado.
3. **Given** um registro existente para o mesmo projeto e data, **When** o usuário adiciona outra tarefa,
   **Then** a nova tarefa é incorporada ao registro sem apagar as anteriores.
4. **Given** dados obrigatórios ausentes ou inválidos, **When** o usuário tenta salvar, **Then** nada é persistido
   e cada problema é apresentado de forma compreensível, preservando os dados já digitados.

---

### User Story 2 - Consultar o diário por período (Priority: P2)

Como usuário, quero visualizar o diário de bordo por dia, quinzena ou mês para revisar o que realizei em um
período e localizar os respectivos projetos.

**Why this priority**: O histórico transforma os registros isolados em informação útil para acompanhamento,
retrospectivas e prestação de contas.

**Independent Test**: Preparar registros em datas e projetos distintos e verificar que a janela popup apresenta
somente o período escolhido, agrupando cada tarefa sob a data e o projeto corretos sem perder a seleção ao abrir
detalhes.

**Acceptance Scenarios**:

1. **Given** registros em vários dias, **When** o usuário seleciona a visão diária e uma data, **Then** vê todos
   os registros daquela data em ordem cronológica, com o projeto identificado em cada tarefa.
2. **Given** registros nas duas metades de um mês, **When** o usuário seleciona uma quinzena, **Then** vê os dias
   1 a 15 ou 16 ao último dia do mês, agrupados por dia, com suas tarefas e projetos correspondentes.
3. **Given** registros em vários meses, **When** o usuário seleciona um mês, **Then** vê quais dias possuem
   atividade e pode abrir os detalhes de cada dia.
4. **Given** um período sem registros, **When** ele é consultado, **Then** o usuário recebe um estado vazio claro
   e uma ação para criar um registro nesse período.
5. **Given** uma visão de período aberta, **When** o usuário seleciona uma tarefa, **Then** detalhes e ações de
   edição aparecem em um painel sem alterar o período ou a posição de navegação atual.
6. **Given** que a janela principal já está aberta, **When** o usuário aciona novamente a extensão ou um lembrete
   válido, **Then** a mesma janela é trazida para primeiro plano em vez de abrir uma segunda janela.
7. **Given** tarefas registradas no período, **When** o usuário abre a visão diária, quinzenal ou mensal,
   **Then** vê totais de horas normais, extras de 50% e extras de 100%, no período e por projeto.

---

### User Story 3 - Configurar o aplicativo e receber lembretes (Priority: P3)

Como usuário, quero configurar minha região, consultar as regras de jornada e programar lembretes para que os
cálculos considerem os feriados corretos e eu reduza esquecimentos sem abrir janelas desnecessárias.

**Why this priority**: A região torna o cálculo de 100% confiável e os lembretes aumentam a consistência do
hábito; falhas nessas configurações não podem impedir o registro e a consulta básicos.

**Independent Test**: Selecionar estado e município, confirmar o calendário carregado e configurar um lembrete;
depois, verificar a classificação de trabalho em um feriado e simular o horário programado com e sem registro.

**Acceptance Scenarios**:

1. **Given** os lembretes desativados, **When** o usuário escolhe frequência diária e um ou mais horários válidos,
   **Then** a programação é ativada e seu próximo disparo fica visível.
2. **Given** uma programação personalizada, **When** o usuário escolhe dias da semana e um ou mais horários,
   **Then** os lembretes são previstos apenas para as combinações selecionadas.
3. **Given** um lembrete previsto e nenhum registro no dia correspondente, **When** chega o horário programado,
   **Then** uma janela popup dedicada abre o fluxo de preenchimento desse dia.
4. **Given** que já existe ao menos uma tarefa registrada no dia, **When** chega o horário programado, **Then**
   nenhuma janela popup de lembrete é aberta para esse dia.
5. **Given** uma configuração inválida ou uma falha ao programar o lembrete, **When** o usuário tenta salvar,
   **Then** a configuração anterior permanece válida e o problema é informado com orientação de recuperação.
6. **Given** que a janela popup de lembrete já está aberta, **When** ocorre outro disparo válido, **Then** a
   janela existente é reutilizada e trazida para primeiro plano, sem criar duplicata.
7. **Given** que o usuário não concede o acesso opcional necessário ao lembrete, **When** a solicitação termina,
   **Then** o recurso permanece desativado e cadastro, edição e consulta continuam disponíveis.
8. **Given** a área de Configurações aberta, **When** o usuário seleciona estado e município válidos, **Then** o
   calendário aplicável é carregado do dataset empacotado e a tela mostra região, versão do dataset e próximos
   feriados.
9. **Given** uma região válida já ativa, **When** a importação de uma nova versão empacotada falha na validação,
   **Then** a última lista válida continua em uso e a tela informa que a nova versão não pôde ser aplicada.
10. **Given** que não há calendário válido, **When** o primeiro carregamento do dataset empacotado falha, **Then**
    a nova região não é ativada e os cálculos existentes não são alterados.
11. **Given** uma janela aberta por lembrete, **When** o usuário escolhe snooze entre 1 minuto e 48 horas,
    **Then** o lembrete atual é adiado sem alterar os dias e horários da programação recorrente; valores fora
    desse intervalo são rejeitados sem modificar o lembrete vigente.
12. **Given** um snooze pendente, **When** um horário recorrente vence antes do disparo adiado, **Then** essa
    ocorrência intermediária é suprimida; quando o snooze dispara, a recorrência é retomada somente na próxima
    ocorrência futura.
13. **Given** um snooze que atravessa a meia-noite, **When** ele dispara, **Then** a janela abre o registro da
    data local originalmente lembrada; se essa data já tiver sido preenchida, o snooze é cancelado, enquanto
    registros em outras datas não o cancelam.
14. **Given** uma região ativa e uma nova região cujo catálogo foi validado, **When** o usuário tenta aplicá-la,
    **Then** o sistema informa que todo o histórico será recalculado e só ativa a nova região após confirmação;
    cancelar preserva região, catálogo e totais atuais.

---

### User Story 4 - Corrigir e organizar o histórico (Priority: P4)

Como usuário, quero editar ou excluir tarefas registradas e renomear ou arquivar projetos para manter o
histórico correto sem perder registros de projetos encerrados.

**Why this priority**: Correções são necessárias para a confiabilidade do histórico, enquanto arquivamento
evita poluir novos cadastros sem apagar dados antigos.

**Independent Test**: Editar e excluir tarefas, renomear um projeto e arquivá-lo, confirmando que o histórico
remanescente conserva datas e associações e que o projeto arquivado não aparece entre os projetos ativos.

**Acceptance Scenarios**:

1. **Given** uma tarefa registrada, **When** o usuário altera seus campos ou sua data e hora com valores válidos,
   **Then** o histórico passa a exibir os novos valores sem duplicar a tarefa.
2. **Given** uma tarefa registrada e outro projeto ativo, **When** o usuário altera seu projeto e salva,
   **Then** a mesma tarefa passa a aparecer somente no projeto de destino, preservando sua identidade.
3. **Given** uma tarefa registrada, **When** o usuário confirma sua exclusão, **Then** somente essa tarefa é
   removida e as demais permanecem intactas.
4. **Given** um projeto com histórico, **When** o usuário o arquiva, **Then** ele deixa de ser oferecido para
   novos registros, mas continua identificado nas consultas históricas.

### Edge Cases

- Se o usuário tentar criar projetos com nomes equivalentes após remoção de espaços ou diferença entre
  maiúsculas e minúsculas, o cadastro é rejeitado e o projeto existente é indicado.
- Detalhes compostos apenas por espaços, vazios ou acima do limite aceito não podem ser salvos. Detalhes ou
  duração inválidos impedem o salvamento sem apagar os demais campos preenchidos.
- Uma tarefa sem hora final e sem duração não pode ser salva. Se ambos forem informados e representarem
  intervalos diferentes, o salvamento é rejeitado até que o usuário corrija a divergência.
- Tarefas podem possuir intervalos sobrepostos. Cada duração é contada integralmente, portanto o total diário
  pode ultrapassar 24 horas sem ser tratado como erro.
- Data e hora futuras não são aceitas como tarefas já realizadas. A data e a hora civis escolhidas são
  preservadas mesmo após mudança de fuso; somente a identificação de "agora", de "hoje" e os próximos
  lembretes acompanham o fuso local atual.
- Ao editar simultaneamente o mesmo registro em duas telas da extensão, o usuário deve ser avisado antes que
  uma versão mais antiga substitua uma mudança mais recente.
- Dados ausentes, malformados ou de uma versão anterior devem resultar em recuperação segura ou orientação ao
  usuário, nunca em perda silenciosa do histórico válido.
- Se o limite disponível para novos registros for atingido, o histórico existente permanece legível e o novo
  conteúdo não é apresentado como salvo.
- Lembretes não disparados enquanto o navegador estava indisponível não devem abrir janelas em sequência quando ele
  voltar; apenas a próxima ocorrência válida permanece programada.
- Se um snooze ultrapassar um ou mais horários recorrentes, esses horários intermediários são suprimidos e não
  geram fila; após o snooze disparar, somente a próxima ocorrência recorrente futura permanece programada.
- Um snooze preserva a data local da ocorrência original. Se essa data receber uma tarefa válida antes do novo
  disparo, o snooze é cancelado; tarefas em outras datas não alteram a ocorrência adiada.
- Datas fora da cobertura do catálogo de feriados mantêm seus registros legíveis, mas totais dependentes de
  feriados devem indicar calendário indisponível em vez de assumir silenciosamente que são dias úteis.
- Um dia que seja simultaneamente domingo e feriado deve ter seu tempo contado uma única vez como extra de 100%.
- Ao trocar estado ou município, o usuário deve confirmar a aplicação da nova região a todo o histórico; após a
  confirmação, os totais derivados são recalculados sem alterar tarefas ou durações originais.
- Mensagens, dados de páginas visitadas e outros conteúdos externos inválidos ou não autorizados são rejeitados
  sem alterar projetos, registros ou configurações.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir criar um projeto com nome obrigatório de 1 a 100 caracteres após
  normalização de espaços.
- **FR-002**: O sistema MUST impedir nomes duplicados entre projetos ativos, ignorando maiúsculas, minúsculas e
  espaços externos.
- **FR-003**: O sistema MUST permitir renomear e arquivar projetos sem remover seus registros históricos.
- **FR-004**: O sistema MUST permitir registrar uma ou mais tarefas realizadas para um projeto ativo e uma data
  e hora civis que não estejam no futuro. Cada tarefa MUST possuir exatamente um projeto.
- **FR-005**: Cada tarefa MUST possuir detalhes obrigatórios entre 1 e 2.000 caracteres após normalização de
  espaços e MUST NOT possuir campo de título. A duração válida MUST estar entre 1 e 1.440 minutos.
- **FR-006**: O sistema MUST permitir adicionar tarefas a um registro existente sem substituir tarefas já
  armazenadas.
- **FR-007**: O sistema MUST permitir editar e excluir individualmente uma tarefa, exigindo confirmação antes
  da exclusão. A edição MUST permitir mover a tarefa para outro projeto ativo sem duplicá-la ou alterar sua
  identidade.
- **FR-008**: O sistema MUST conservar projetos, registros e preferências entre encerramentos e reinicializações
  do navegador.
- **FR-009**: O sistema MUST oferecer consultas por dia, quinzena e mês usando datas civis locais. Cada tarefa
  MUST permanecer na data e hora escolhidas no cadastro mesmo após mudança de fuso horário; o período atual e
  os lembretes MUST usar o fuso local vigente no momento da consulta ou disparo.
- **FR-010**: A visão diária MUST ordenar tarefas cronologicamente; a quinzenal MUST usar os períodos civis
  fixos de 1 a 15 e de 16 ao último dia do mês e agrupar tarefas por dia; a mensal MUST usar um calendário que
  identifique dias com atividade e permita abrir seus detalhes.
- **FR-011**: O sistema MUST permitir navegar para períodos anteriores e retornar ao período atual.
- **FR-012**: O sistema MUST apresentar um estado vazio útil quando o período consultado não contiver registros.
- **FR-013**: O sistema MUST permitir ativar, desativar e alterar lembretes sem afetar projetos ou registros e
  MUST solicitar qualquer acesso opcional necessário somente quando o usuário tentar ativá-los.
- **FR-014**: O sistema MUST permitir frequência diária ou personalizada por um ou mais dias da semana, com um
  ou mais horários locais definidos pelo usuário. Cada janela aberta por lembrete MUST oferecer snooze, que
  adia somente a ocorrência atual sem alterar a programação recorrente. A duração do snooze MUST ser
  personalizada entre 1 minuto e 48 horas; esses limites não são exibidos previamente, mas valores fora do
  intervalo MUST ser rejeitados com mensagem de validação sem alterar o lembrete vigente. Enquanto houver um
  snooze pendente, ocorrências recorrentes intermediárias MUST ser suprimidas; depois de seu disparo, a
  recorrência MUST ser retomada na próxima ocorrência futura. O snooze MUST preservar a data local da ocorrência
  original e MUST ser cancelado se essa data for preenchida antes do disparo; tarefas em outras datas MUST NOT
  cancelá-lo.
- **FR-015**: O sistema MUST exibir o próximo lembrete efetivamente previsto após salvar uma configuração válida
  ou aplicar snooze; enquanto houver snooze pendente, ele MUST ser exibido como a próxima ocorrência.
- **FR-016**: O sistema MUST abrir no máximo uma janela popup por ocorrência programada e suprimir o lembrete
  quando já existir ao menos uma tarefa registrada para o dia.
- **FR-017**: A janela popup de lembrete MUST abrir diretamente o fluxo de registro do dia correspondente. Se
  ela já estiver aberta, o sistema MUST reutilizá-la e trazê-la para primeiro plano em vez de criar duplicata.
  Para snooze, o dia correspondente MUST ser a data local da ocorrência original.
- **FR-018**: O sistema MUST validar dados novamente quando forem lidos e MUST preservar dados válidos quando
  encontrar conteúdo ausente, incompatível ou malformado.
- **FR-019**: Toda operação de criação, alteração, exclusão, consulta ou agendamento MUST apresentar um resultado
  controlado em caso de falha, sem indicar sucesso quando a mudança não foi concluída.
- **FR-020**: O sistema MUST operar para um único perfil local e sem exigir conta, autenticação ou conexão de
  rede em runtime.
- **FR-021**: Formulários de criação e edição MUST apresentar projeto, data, hora inicial e detalhes como campos
  obrigatórios, sem campo de título, e hora final e duração como alternativas das quais ao menos uma MUST ser
  preenchida; novos registros MUST iniciar com data e hora atuais.
- **FR-022**: Toda exibição detalhada de uma tarefa MUST mostrar projeto, data, hora inicial, hora final, duração
  calculada e detalhes. Visões resumidas MUST mostrar ao menos intervalo, duração, projeto e um trecho dos
  detalhes.
- **FR-023**: Cadastro, projetos, consultas e configurações MUST ocupar uma única janela popup redimensionável.
  Acionar a extensão ou um lembrete enquanto ela estiver aberta MUST reutilizar e trazer essa janela para o
  primeiro plano.
- **FR-024**: A janela MUST oferecer navegação persistente entre Diário, Projetos e Configurações. Dentro do
  Diário, MUST permitir selecionar Dia, Quinzena ou Mês, destacar o destino e o período ativos e manter uma
  ação primária visível para nova tarefa.
- **FR-025**: A visão diária MUST apresentar uma lista cronológica com horário, trecho dos detalhes, projeto e duração;
  tarefas no mesmo horário MUST manter uma ordem estável.
- **FR-026**: A visão quinzenal MUST apresentar cada dia do período em ordem cronológica, incluindo estado vazio
  para dias sem tarefas, e permitir expandir ou selecionar um dia sem sair da quinzena.
- **FR-027**: A visão mensal MUST apresentar uma grade de calendário, indicar a quantidade de tarefas em cada
  dia e abrir a visão detalhada do dia selecionado.
- **FR-028**: Selecionar uma tarefa MUST abrir um painel de detalhes e edição sem descartar o período, a posição
  de navegação ou filtros atuais; fechar o painel MUST retornar ao mesmo contexto visual.
- **FR-029**: O sistema MUST classificar como hora extra de 50% o tempo diário trabalhado de segunda a sábado
  que exceder a jornada prevista para o dia. Em domingos e feriados, todo o tempo trabalhado MUST ser
  classificado como hora extra de 100%, sem acumular classificações sobre os mesmos minutos.
- **FR-030**: A jornada prevista MUST ser de 8 horas por dia de segunda a sexta e zero no sábado e domingo.
  Todo o tempo registrado no sábado MUST ser extra de 50%; tempo abaixo de 8 horas em dia útil MUST ser
  exibido como horas trabalhadas sem gerar horas extras negativas.
- **FR-031**: O sistema MUST calcular a duração a partir das horas inicial e final ou calcular a hora final a
  partir da duração. Se hora final e duração forem fornecidas, o sistema MUST aceitar o registro somente quando
  forem equivalentes. O intervalo MUST ter no máximo 24 horas e terminar na mesma data civil em que começou.
- **FR-032**: O sistema MUST permitir intervalos sobrepostos e MUST somar integralmente a duração de cada tarefa
  nos totais de horas normais e extras, mesmo entre projetos distintos. Totais diários acima de 24 horas MUST
  ser apresentados sem limitação ou deduplicação.
- **FR-033**: Em dias úteis não feriados, o sistema MUST ordenar tarefas por hora inicial e, em caso de empate,
  por ordem de criação; os primeiros 480 minutos acumulados MUST ser classificados como normais e os minutos
  seguintes como extras de 50%. Uma tarefa que atravesse o limite MUST ter sua duração dividida entre as duas
  categorias. No sábado todo minuto MUST ser extra de 50%; no domingo ou feriado, extra de 100%.
- **FR-034**: As visões diária, quinzenal e mensal MUST exibir totais de horas normais, extras de 50% e extras de
  100% para o período completo e por projeto, usando todas as tarefas, inclusive as sobrepostas.
- **FR-035**: A área de Configurações MUST conter as seções Região e Feriados, Jornada e Horas Extras e
  Lembretes. A seção de jornada MUST exibir as regras fixas de 8 horas de segunda a sexta, extra de 50% no
  sábado e após a jornada, e extra de 100% em domingos e feriados.
- **FR-036**: Região e Feriados MUST exigir estado e município selecionados pelo usuário, sem usar localização
  automática, e MUST exibir região ativa, versão do dataset empacotado, estado da validação e próximos feriados
  nacionais, estaduais e municipais aplicáveis.
- **FR-037**: Uma nova região somente MUST se tornar ativa após o catálogo empacotado correspondente ser
  carregado e validado. Em falha, o último catálogo válido MUST permanecer ativo; sem catálogo anterior, a
  alteração MUST permanecer pendente e os cálculos existentes MUST ser preservados.
- **FR-038**: Alterar a região MUST exigir confirmação de que todo o histórico será recalculado. A confirmação
  MUST atualizar apenas classificações e totais derivados, sem modificar projetos, tarefas, intervalos ou
  durações registrados.
- **FR-039**: Lembretes MUST manter na área de Configurações os campos estado ativo, frequência diária ou dias
  da semana, lista de horários locais, estado do acesso opcional e próxima ocorrência prevista.
- **FR-040**: O catálogo nacional, estadual e municipal MUST ser distribuído como dataset estático, versionado e
  não executável dentro da extensão, atualizado somente por nova versão publicada. A seleção de região e o uso
  de feriados MUST NOT solicitar acesso de rede em runtime. Cada versão MUST cobrir do quinto ano anterior ao
  ano corrente até o segundo ano posterior, declarar `minYear` e `maxYear` e mostrar a cobertura ao usuário.
  Datas fora da cobertura MUST preservar os registros e sinalizar totais dependentes de feriados como
  indisponíveis, sem classificá-las silenciosamente como dias úteis.
- **FR-041**: Configurações MUST apresentar suas três seções em uma página rolável, salvar cada seção
  independentemente, indicar alterações ainda não salvas e exibir validação, carregamento, sucesso e falha junto
  ao controle correspondente. Sair de uma seção com alterações MUST exigir descarte ou retorno à edição.
- **FR-042**: O Diário MUST permitir filtrar por um ou mais projetos, incluindo projetos arquivados quando
  selecionados explicitamente, e buscar texto sem diferenciar maiúsculas/minúsculas nos detalhes. Filtro e busca
  MUST ser combinados por interseção, persistir ao alternar Dia, Quinzena e Mês e ser removidos por ação explícita.

### Quality and Security Requirements *(mandatory)*

- **QR-001**: Nomes, detalhes, duração, datas e horas inicial e final, seleções de período e
  configurações MUST ter formato, limites, normalização e comportamento de rejeição definidos antes de qualquer
  alteração.
- **QR-002**: Falhas esperadas MUST preservar a última situação válida e fornecer retorno compreensível e uma
  ação de recuperação quando aplicável.
- **QR-003**: Responsabilidades de apresentação, decisões do domínio e conservação dos dados MUST permanecer
  separadas por contratos verificáveis.
- **QR-004**: Regras de integridade do histórico, validação, exclusão, recorrência de lembretes, classificação e
  soma de horas, feriados e recuperação de dados MUST ter cenários automatizados de sucesso, limite, entrada
  inválida e falha de dependência.
- **QR-005**: O produto MUST solicitar somente os acessos do navegador indispensáveis às funcionalidades ativas,
  MUST explicar qualquer acesso opcional ao ativar o recurso correspondente e MUST manter cadastro, edição e
  consulta funcionais quando o acesso de lembretes for recusado.
- **QR-006**: Mensagens entre partes do produto, conteúdo de páginas, dados persistidos e respostas externas
  MUST ser considerados não confiáveis e validados antes do uso.
- **QR-007**: Diagnósticos MUST excluir descrições de tarefas, nomes de projetos e outras informações pessoais,
  salvo quando exibidos localmente ao próprio usuário como parte do fluxo solicitado.
- **QR-008**: Estado e município MUST ser usados somente para determinar feriados e não podem ser obtidos por
  geolocalização, enviados em diagnósticos ou usados para finalidades não declaradas.

### Key Entities *(include if feature involves data)*

- **Projeto**: Agrupador de atividades com identificador estável, nome, estado ativo ou arquivado e datas de
  criação e alteração. Mantém sua identidade no histórico mesmo após arquivamento ou renomeação.
- **Registro diário**: Conjunto de tarefas ligado a um projeto e a uma data de calendário local. Um projeto tem
  no máximo um registro agregador por data, que pode conter várias tarefas.
- **Tarefa realizada**: Item individual do registro diário, com identificador, detalhes obrigatórios, data
  e hora civis inicial e final, duração calculada e marcas de criação e alteração.
- **Programação de lembrete**: Preferência do usuário com estado ativo, frequência diária ou dias da semana,
  lista de horários locais, snooze da ocorrência atual e próxima ocorrência prevista.
- **Configuração do usuário**: Preferências locais com estado e município selecionados, região ativa, referência
  ao catálogo de feriados válido e configuração de lembretes.
- **Feriado**: Data civil, nome, abrangência nacional, estadual ou municipal e região aplicável, usada para
  classificar todo o tempo registrado no dia como extra de 100%.
- **Resumo de horas**: Resultado derivado das tarefas de um período, separado em horas normais, extras de 50% e
  extras de 100%, com totais gerais e por projeto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste de usabilidade, pelo menos 90% dos usuários conseguem criar um projeto e registrar sua
  primeira tarefa em até 60 segundos, sem assistência.
- **SC-002**: Em pelo menos 95% das consultas com até 10.000 tarefas armazenadas, o período selecionado fica
  pronto para uso em até 2 segundos.
- **SC-003**: Em testes com o navegador disponível, 100% dos lembretes devidos abrem ou trazem para primeiro
  plano uma única janela popup em até 5 minutos do horário configurado, e nenhum lembrete é exibido em dias
  já preenchidos.
- **SC-004**: Após reiniciar o navegador, 100% dos projetos, tarefas e preferências previamente confirmados
  permanecem disponíveis e associados às datas corretas.
- **SC-005**: Todos os cenários críticos de integridade, entradas inválidas, recorrência, exclusão e falha de
  conservação de dados passam antes da entrega.
- **SC-006**: Em teste de usabilidade, pelo menos 90% dos usuários localizam uma tarefa conhecida nas visões
  diária, quinzenal ou mensal em até 30 segundos.
- **SC-007**: Para todos os cenários de teste de dias úteis, sábados, domingos, feriados, sobreposições e tarefas
  que cruzam o limite de 8 horas, os totais normal, extra de 50% e extra de 100% correspondem exatamente às
  regras especificadas.
- **SC-008**: Em teste de usabilidade, pelo menos 90% dos usuários configuram sua região e identificam o estado
  do calendário de feriados em até 60 segundos, sem assistência.

## Assumptions

- A primeira versão atende um único usuário no perfil local do navegador e não inclui login, sincronização
  entre dispositivos, colaboração, exportação ou integração externa em runtime.
- O usuário pode criar vários projetos, mas cada tarefa pertence obrigatoriamente a exatamente um projeto e uma
  data e hora; sua associação pode ser movida para outro projeto ativo durante a edição.
- A quinzena usa períodos civis fixos do mês: dias 1 a 15 e dias 16 ao último dia. Registros usam a data e hora
  civis escolhidas e não são reposicionados quando o fuso muda; lembretes usam o fuso local vigente.
- A programação personalizada significa escolher um ou mais dias da semana e um ou mais horários locais; cada
  horário se aplica a todos os dias selecionados.
- Um dia é considerado preenchido quando contém ao menos uma tarefa válida em qualquer projeto.
- Os lembretes dependem de o navegador e o perfil da extensão estarem disponíveis próximo ao horário previsto.
- Projetos com histórico são arquivados em vez de excluídos definitivamente; exclusão individual é oferecida
  apenas para tarefas e sempre requer confirmação.
- A interface e as mensagens ao usuário serão apresentadas em português brasileiro na primeira versão.
- Os percentuais de 50% e 100% são categorias de tempo para acompanhamento pessoal; o produto não calcula
  remuneração, reflexos trabalhistas ou conformidade legal.
- A região selecionada vale para todo o histórico; mudanças de residência ou local de trabalho não mantêm
  calendários regionais diferentes por período nesta versão.

## Scope Boundaries

### Included

- Cadastro, renomeação e arquivamento de projetos.
- Criação, edição e exclusão de tarefas realizadas, organizadas por projeto e data.
- Consulta do diário por dia, quinzena e mês em uma única janela popup redimensionável.
- Cálculo e exibição de horas normais, extras de 50% e extras de 100%, no total e por projeto.
- Configurações de região, calendário automático de feriados, regras de jornada e lembretes.
- Lembretes diários ou por dias da semana, com um ou mais horários configuráveis, snooze, janela popup dedicada
  e supressão após preenchimento.
- Funcionamento local e recuperação controlada de falhas e dados inválidos.

### Excluded

- Contas de usuário, equipes, compartilhamento, comentários ou aprovação de registros.
- Sincronização entre dispositivos, backup remoto e integração com calendários pessoais ou gerenciadores de
  tarefas.
- Relatórios financeiros, metas, faturamento, cálculo de remuneração e exportação de dados.
- Registro automático de navegação ou coleta de conteúdo das páginas visitadas.
