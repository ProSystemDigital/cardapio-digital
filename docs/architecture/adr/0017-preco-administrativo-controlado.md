# ADR 0017 — Preço administrativo controlado

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

A disponibilidade já possui uma mutação administrativa autorizada e auditada. O preço é a próxima configuração operacional necessária, mas valores monetários exigem conversão determinística, limite explícito e prevenção de sobrescrita concorrente.

## Decisão

- expor a edição de preço em formulário separado da disponibilidade;
- aceitar representação decimal brasileira ou canônica e convertê-la para centavos sem cálculo de ponto flutuante;
- limitar o preço entre zero e `99.999.999` centavos, equivalente a R$ 999.999,99;
- renovar autenticação, vínculo, membership e permissão no servidor a cada envio;
- não aceitar tenant, ator, papel ou permissão do formulário;
- exigir confirmação explícita e versão esperada;
- persistir preço, incremento de versão e auditoria na mesma transação;
- conceder ao runtime somente `UPDATE` em `base_price_in_cents`, `version` e `updated_at`, além do `INSERT` append-only necessário na auditoria.

## Consequências

O valor armazenado permanece inteiro e o catálogo público continua formatando centavos como moeda. Alterações concorrentes de preço ou disponibilidade fazem o formulário obsoleto falhar fechado. Nenhum outro campo do produto se torna editável.

O gate local foi concluído em 2026-08-15 com ciclo PostgreSQL descartável, concessão mínima persistente, alteração real de preço auditada e aprovação visual, funcional e arquitetural humana.

## Reversão

Remover o formulário e a Server Action de preço e revogar o privilégio de `UPDATE` em `base_price_in_cents`. A disponibilidade, leitura administrativa e dados já auditados permanecem independentes.
