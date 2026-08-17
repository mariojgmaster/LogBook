# Contrato do dataset de feriados

O build consome uma revisão explicitamente fixada da fonte e gera JSON estático não executável.

## Manifesto

```json
{
  "schemaVersion": 1,
  "datasetVersion": "YYYY.MM.DD+source-revision",
  "sourceUrl": "https://github.com/joaopbini/feriados-brasil",
  "sourceRevision": "commit-or-release",
  "license": "MIT",
  "generatedAt": "ISO-8601",
  "sha256": "hex",
  "minYear": 2021,
  "maxYear": 2028,
  "years": [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028]
}
```

## Arquivos normalizados

- `municipalities.json`: `{ ibgeCode, stateCode, name, normalizedName }[]`.
- `holidays-YYYY.json`: `{ date, name, scope, stateCode?, municipalityIbgeCode? }[]`.

## Validação do pipeline

- checksum e revisão obrigatórios;
- `years` contínuo entre `minYear = currentYear - 5` e `maxYear = currentYear + 2`;
- 27 UFs e códigos IBGE únicos;
- datas ISO válidas e dentro do ano do arquivo;
- escopo compatível com campos regionais;
- nomes tratados como texto;
- ordenação determinística e teste de snapshot de contagem/cobertura;
- licença copiada para os artefatos de distribuição.

Falha de download, checksum, cobertura ou schema interrompe a atualização e preserva os arquivos válidos anteriores. A extensão não acessa a fonte em runtime. Uma data fora de `minYear..maxYear` produz estado explícito de calendário indisponível e nunca é presumida como dia útil.
