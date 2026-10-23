# ADR 0033 — Repositório de auditoria do perfil

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A edição textual produz eventos atômicos, mas a aplicação ainda não possui um contrato de leitura sanitizado. Consultar linhas SQL diretamente na página poderia expor UUID técnico do ator, aceitar paginação arbitrária ou omitir o contexto RLS.

## Decisão

- criar porta específica para listar eventos recentes por tenant;
- limitar a consulta a no máximo 20 eventos;
- definir `app.tenant_id` em transação somente leitura;
- retornar papel, campos públicos alterados e instante, omitindo `actor_id`;
- ignorar propriedades inesperadas no JSON de mudanças;
- manter banco persistente, autorização de leitura e interface fora desta fase.

## Consequências

A trilha poderá ser apresentada sem identidade externa ou UUID do ator e sem consulta irrestrita. A próxima fase deverá conceder `SELECT` mínimo no banco persistente e compor a leitura com `tenant.audit.read`.

## Reversão

Remover porta, adaptador e teste. Eventos persistidos e a escrita do perfil permanecem inalterados.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL descartável confirmou consulta limitada sob RLS, campos públicos conhecidos, ausência do UUID do ator, ciclo `up/down/up` e limpeza do papel temporário.
