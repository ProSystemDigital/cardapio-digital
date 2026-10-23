# ADR 0042 — Repositório de auditoria de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

A edição de categorias produz eventos atômicos, mas consultá-los diretamente na página poderia expor o UUID do ator, propriedades inesperadas ou volume irrestrito.

## Decisão

- criar uma porta específica para eventos recentes de categorias;
- limitar consultas a no máximo 20 eventos;
- definir o tenant em transação PostgreSQL somente leitura sob RLS;
- retornar nome atual, novo nome conhecido, ordem, papel e instante;
- não selecionar `actor_id` e ignorar propriedades JSON desconhecidas;
- manter privilégio persistente, composição autorizada e interface fora desta fase.

## Consequências

A trilha poderá ser apresentada futuramente sem identidade técnica ou externa. O UUID da categoria permanece apenas como referência interna do contrato e não precisa ser exibido.

## Reversão

Remover porta, adaptador e teste. Escrita e eventos persistidos continuam inalterados.

## Evidência de aceitação

Em 2026-08-16, o gate PostgreSQL descartável confirmou consulta limitada e sanitizada sob RLS, ausência de `actor_id`, reversão, novo `up` e limpeza do papel temporário.
