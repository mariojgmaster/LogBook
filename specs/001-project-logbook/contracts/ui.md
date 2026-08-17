# Contrato de UI/UX

## Estrutura global

A aplicação ocupa uma única janela `popup` redimensionável. O tema inicial é escuro. O shell contém:

- cabeçalho com título da área, período atual e ação primária contextual;
- navegação para Diário, Projetos e Configurações;
- conteúdo principal com um único `h1` e regiões semânticas;
- área `aria-live` para confirmações e erros assíncronos.

Em largura abaixo de 640 px, a navegação vira barra compacta e todos os painéis ficam em coluna. Entre 640 e 959 px, filtros podem ocupar uma linha separada. A partir de 960 px, navegação lateral e painel de resumo podem coexistir. Componentes usam container queries; o layout estreito é o fallback seguro.

## Diário

- Seletor segmentado: Dia, Quinzena, Mês.
- Navegação anterior/hoje/próximo com rótulo de período completo.
- Resumo de horas normal, 50%, 100% e total; cores sempre acompanhadas por texto/ícone.
- Filtro por um ou mais projetos, incluindo arquivados quando selecionados, e busca sem diferenciar maiúsculas/minúsculas no conteúdo dos detalhes; ambos são combinados por interseção, persistem entre os modos do Diário e têm ação explícita de limpar.
- Dia: timeline/lista ordenada por início.
- Quinzena: agrupamentos diários expansíveis, com total por dia.
- Mês: calendário no layout largo; lista cronológica equivalente no estreito.
- Estado vazio explica como cadastrar o primeiro registro e oferece ação direta.

## Cadastro e edição de registro

Formulário em drawer no layout largo e página/painel completo no estreito. Campos visíveis: projeto, data, início, modo de término (`horário final` ou `duração`), valor correspondente e detalhes obrigatórios. Não há campo de título. Labels ficam acima dos controles; obrigatoriedade é textual.

Validação ocorre ao sair do campo e no submit; durante digitação, correções limpam erros existentes. Ao submit inválido, foco vai para o primeiro erro e um resumo é anunciado. Após salvar, há confirmação, a lista é atualizada e o foco retorna à ação que abriu o formulário.

Conflito abre diálogo com: “Sua versão”, “Versão mais recente”, diferenças por campo, `Recarregar versão atual` e `Reaplicar minhas alterações`. Não existe confirmação genérica que sobrescreva silenciosamente.

## Projetos

Lista nome/status/total no período, com criar, editar e arquivar. Arquivar exige confirmação que informa que históricos serão preservados. Projetos arquivados não aparecem por padrão no cadastro, mas continuam em filtros históricos; reativação não pertence à v1.

## Configurações

Três seções persistentes:

1. **Região e feriados**: UF, município pesquisável por nome, versão/fonte/data/cobertura do catálogo e estado de carregamento/erro. Após validar uma nova região, um diálogo informa o recálculo de todo o histórico; confirmar ativa a mudança e cancelar preserva região, catálogo e totais atuais. Datas fora da cobertura mostram calendário e totais dependentes de feriados como indisponíveis.
2. **Jornada e horas extras**: jornada de 8h, regras de seg–sex/sábado/domingo-feriado apresentadas como leitura na v1.
3. **Lembretes**: ativar, frequência diária ou dias da semana e lista com um ou mais horários. A permissão só é pedida após ação explícita de ativar. A janela aberta por lembrete oferece snooze com duração personalizada; valores menores que 1 minuto ou maiores que 48 horas mostram validação sem alterar a ocorrência vigente. Um snooze pendente é apresentado como próxima ocorrência, identifica a data original e informa que horários recorrentes intermediários serão suprimidos. Se essa data for preenchida, o snooze é cancelado.

## Estados e acessibilidade

Cada área implementa carregando, vazio, sucesso, erro recuperável, erro persistente e offline/local. Skeleton preserva o layout; spinners têm nome acessível; erros mostram ação de retry quando aplicável. Diálogos prendem foco, fecham com Escape quando seguro e restauram foco. Todos os fluxos essenciais funcionam por teclado, com foco `:focus-visible`, alvos de ao menos 44 × 44 px e contraste WCAG AA.

## Critérios responsivos

Testar em 360×600, 640×700, 960×720 e 1440×900. Não deve haver rolagem horizontal da página, ações primárias não podem sair da viewport e conteúdo não pode depender de hover. Tabelas viram cartões/listas em contêiner estreito; texto pode quebrar sem ocultar o trecho identificador dos detalhes, a duração ou o projeto.
