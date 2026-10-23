# ADR 0030 — Habilitação persistente do perfil do tenant

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Migration, contrato e adaptador foram aprovados no banco descartável. O banco persistente local ainda não possui a migration `0007` nem privilégios para o novo comando. Aplicação manual fragmentada poderia deixar coluna e auditoria em estados divergentes ou conceder acesso excessivo.

## Decisão

- oferecer a ação explícita `EnableTenantProfileWrite` no executor administrativo local;
- detectar e recusar estado parcial entre versão e tabela de auditoria;
- aplicar a migration `0007` apenas quando ambos estiverem ausentes;
- conceder `UPDATE` somente em `short_name`, `tagline`, `version` e `updated_at`;
- conceder somente `INSERT` na auditoria e revogar `UPDATE/DELETE`;
- incluir `0007` em novos provisionamentos locais;
- manter Server Action e formulário fora desta fase.

## Consequências

O banco persistente poderá receber o adaptador em uma fase posterior sem ampliar a escrita para canal, pagamento, modalidades ou outros campos. A execução exige senha administrativa oculta e confirmação humana do resultado.

## Reversão

Revogar os privilégios concedidos. A remoção da migration somente é segura enquanto nenhum comando persistente ou evento real depender do contrato.

## Evidência de aceitação

Em 2026-08-16, a ação administrativa local aplicou a fundação e confirmou a concessão mínima no banco persistente, sem habilitar formulário ou Server Action.
