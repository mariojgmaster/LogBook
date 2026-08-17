# Quickstart de implementação e validação

## Pré-requisitos

- Node.js 22 LTS (mínimo aceito pelo Vite: 20.19 ou 22.12)
- npm compatível com o Node instalado
- Google Chrome 120+

## Fluxo local previsto

```powershell
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Para inspeção manual, abrir `chrome://extensions`, ativar “Modo do desenvolvedor”, escolher “Carregar sem compactação” e selecionar `dist/`. Após cada build que altere manifest/service worker, recarregar a extensão.

## Ordem recomendada de implementação

1. Configurar TypeScript/Vite/MV3 e shell escuro responsivo.
2. Implementar value objects, validações temporais e cálculo de horas com testes.
3. Implementar IndexedDB, migrações e compare-and-swap com testes de conflito.
4. Implementar projetos e registros por meio dos casos de uso.
5. Implementar consultas diária, quinzenal, mensal e resumos por projeto.
6. Integrar catálogo de feriados versionado e configurações regionais.
7. Integrar permissão opcional, alarmes e abertura/reuso da janela popup.
8. Cobrir fluxos reais com E2E, acessibilidade e tamanhos de janela.

## Cenários obrigatórios de aceitação

- Criar projeto e registro usando horário final; repetir usando duração.
- Rejeitar fim anterior/igual ao início, divergência fim/duração, campo obrigatório ausente e duração maior que 24h.
- Editar registro e confirmar manutenção da data/hora civil após mudança simulada de fuso.
- Somar sobreposições integralmente; verificar 8h normais e excedente 50% em dia útil, sábado 50%, domingo/feriado 100%.
- Conferir os mesmos registros em dia, quinzena e mês, geral e por projeto.
- Abrir a mesma revisão em duas janelas; salvar A e confirmar que B recebe conflito antes de sobrescrever.
- Negar `alarms` e confirmar que o logbook continua funcional; conceder e verificar lembretes diários e por dias da semana com múltiplos horários.
- Adiar uma ocorrência por snooze entre 1 minuto e 48 horas e rejeitar valores fora do intervalo sem alterar a recorrência.
- Manter um snooze além do próximo horário recorrente, confirmar a supressão das ocorrências intermediárias e a retomada somente na recorrência futura após o disparo adiado.
- Disparar lembrete e confirmar abertura ou foco da janela popup no formulário do dia.
- Escolher UF/município sem geolocalização e confirmar aplicação dos feriados do catálogo.
- Validar 10.000 registros dentro da meta de 2 segundos.
- Navegar apenas por teclado nas resoluções 360×600, 640×700, 960×720 e 1440×900; verificar foco, contraste, anúncios de erro e ausência de rolagem horizontal.

## Gates antes de entrega

`typecheck`, lint, testes unitários/integrados, build e E2E devem passar. O pacote não pode conter código remoto, `unsafe-eval`, permissões não planejadas, tokens de API ou HTML gerado a partir de texto do usuário.
