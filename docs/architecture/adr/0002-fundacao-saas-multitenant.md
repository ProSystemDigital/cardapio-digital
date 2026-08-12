# ADR 0002 — Fundação SaaS multitenant e jornada inicial de pedidos

| Campo | Valor |
| --- | --- |
| Status | Aceito e parcialmente implementado |
| Data | 2026-08-12 |
| Decisores | Produto e Engenharia |

## Contexto

O protótipo local precisa evoluir para um SaaS configurável por estabelecimento sem antecipar persistência, autenticação ou fornecedores externos. As decisões D-001 a D-006 definem o limite do produto e exigem isolamento entre tenants desde o domínio.

## Decisão

- adotar `tenant` como limite obrigatório de identidade, catálogo e configuração operacional;
- representar dinheiro em centavos de real e disponibilidade como regra explícita de produto;
- permitir mesa, retirada e entrega em qualquer combinação configurada por tenant;
- adotar WhatsApp como canal inicial planejado, sem implementá-lo nesta fase;
- aceitar pagamento somente no atendimento ou entrega inicialmente, preservando extensão futura para pagamento online;
- estabelecer os papéis `owner`, `manager` e `platform_admin`, sem mecanismo de autorização nesta fase;
- manter os dados demonstrativos em módulo substituível e as regras de catálogo/carrinho em funções puras testáveis.
- resolver o catálogo público por `/cardapio/[tenantSlug]` em um Server Component, por meio de contrato de repositório assíncrono;
- usar uma implementação em memória nesta fase, rejeitando na inicialização qualquer catálogo que viole o escopo do tenant.

## Consequências

O componente visual não é mais a fonte de verdade do catálogo e os contratos podem futuramente receber dados de persistência sem alterar a experiência básica. A presença de `tenantId` reduz o risco de mistura acidental, mas não constitui autorização: consultas, políticas de acesso e auditoria continuam obrigatórias quando houver banco e autenticação.

Dois tenants fictícios permitem validar a resolução ponta a ponta e cenários negativos. A troca futura da implementação em memória por persistência deverá preservar o contrato de repositório e acrescentar autorização, sem tratar o slug como segredo.

WhatsApp oferece baixo esforço operacional, mas não fornece confirmação transacional confiável. O sistema não deve marcar um pedido como aceito apenas por abrir ou enviar uma mensagem.

## Decisões adiadas

Persistência, provedor de autenticação, matriz detalhada de permissões, trilha de auditoria, formato da mensagem, consentimento, endereço, taxas, horários, pagamento online e fonte operacional do catálogo exigem novas decisões antes da implementação.
