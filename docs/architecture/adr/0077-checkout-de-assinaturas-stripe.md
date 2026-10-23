# ADR 0077 — Checkout de assinaturas Stripe

| Campo | Valor |
| --- | --- |
| Status | Aceito para sandbox; produção bloqueada |
| Data | 2026-10-21 |
| Decisores | Produto e Engenharia |

## Contexto

Criar uma conta Clerk não pode, isoladamente, conceder tenant, membership ou acesso administrativo. Os planos iniciais aprovados são Essencial por R$ 150/mês e Profissional por R$ 250/mês.

## Decisão

- usar produtos e preços separados no Stripe Billing;
- iniciar assinaturas com Stripe Checkout hospedado e métodos de pagamento dinâmicos;
- validar no servidor a chave do plano e resolver o Price ID por variável de ambiente;
- não habilitar Stripe Tax sem registro fiscal aplicável;
- não conceder acesso pela página de sucesso;
- exigir webhook assinado e persistência idempotente para criar tenant, principal, vínculo externo e membership;
- provisionar o vínculo somente após `checkout.session.completed` ou `checkout.session.async_payment_succeeded` com pagamento confirmado;
- suspender o principal quando a assinatura ficar inadimplente ou for cancelada;
- manter o ambiente atual como sandbox, sem cobrança real.

## Consequências

O handler assinado, a migration idempotente e o ciclo inicial de ativação, retomada, inadimplência e cancelamento estão implementados. No ambiente local, a ativação depende da aplicação explícita da migration `0020` e da configuração do segredo de webhook. A produção permanece bloqueada até validar conciliação, reembolsos, disputas, fraude e os dados legais/fiscais da conta Stripe.

## Reversão

Remover as rotas de cadastro, checkout e webhook, arquivar os produtos sandbox e retirar as variáveis de preço. As memberships provisionadas precisam ser suspensas antes da remoção das funções e tabelas de onboarding.
