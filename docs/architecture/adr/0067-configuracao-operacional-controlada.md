# ADR 0067 — Configuração operacional controlada

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local e revisão humana |
| Data | 2026-08-22 |
| Decisores | Produto e Engenharia |

## Contexto

Pedido mínimo, taxa e horários já eram lidos do tenant, mas não possuíam escrita. O envio futuro por WhatsApp exige um contato comercial, e os meios presenciais precisam ser informados sem antecipar pagamento online.

## Decisão

- versionar `tenant_operations` e atualizar valores, contato, pagamentos e horários na mesma transação;
- aceitar somente celular brasileiro com código `+55`, DDD de dois dígitos e assinante móvel `9XXXX-XXXX`, nunca contato de cliente;
- aceitar entrada com ou sem espaços, parênteses e hífen, exibir `+55 (DDD) 9XXXX-XXXX` e persistir o formato canônico `+55DDDNÚMERO`;
- limitar pagamentos a Pix, dinheiro, crédito e débito no atendimento ou entrega;
- representar dia fechado pela ausência de intervalo e permitir no máximo um intervalo por dia;
- renovar identidade, membership e `tenant.operations.update` no servidor;
- aplicar RLS, privilégio mínimo e auditoria append-only;
- omitir o número da auditoria, registrando somente `whatsappConfigured`;
- manter integração com WhatsApp, confirmação de pedido, exceções de calendário e pagamento online fora do escopo;
- separar a interface em Atendimento, Financeiro e Logística; cada Server Action aceita, valida e persiste somente os campos de sua etapa em transação atômica, sem sobrescrever seções ainda incompletas.

## Consequências

A configuração pública pode ser mantida pelo proprietário ou gerente sem aceitar tenant, ator ou papel do navegador. Um contato de microempreendedor pode identificar pessoa natural; produção depende de transparência e base legal definidas pelo tenant controlador.

A separação visual não fragmenta a consistência transacional de `tenant_operations`: a versão otimista continua impedindo que uma etapa sobrescreva alterações concorrentes de outra. O ajuste de 2026-10-23 removeu o bloqueio circular observado em tenants recém-criados sem WhatsApp ou meios de pagamento.

## Reversão

Remover formulário e composição, revogar concessões e executar `0013_tenant_operations_writes.down.sql` somente após remover eventos e métodos persistidos conscientemente.
