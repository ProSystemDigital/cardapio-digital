# Decisões de produto — Cardápio Digital

| ID | Decisão | Critério de aceite nesta fundação |
| --- | --- | --- |
| D-001 | Produto SaaS multitenant | Toda entidade de catálogo pertence explicitamente a um tenant; a rota resolve o catálogo por slug e rejeita dados fora do escopo. |
| D-002 | Pedido enviado inicialmente por WhatsApp | Canal registrado no perfil do tenant, sem integração ou coleta de contato nesta fase. |
| D-003 | Mesa, retirada, entrega ou combinação configurável | Modalidades são configuração do tenant; endereço, taxas e horários ficam adiados. |
| D-004 | Pagamento no atendimento/entrega | Fundação representa pagamento na realização; pagamento online fica fora do escopo atual. |
| D-005 | Identidade e catálogo configuráveis | Marca, categorias, produtos, preços e disponibilidade não ficam definidos no componente visual. |
| D-006 | Proprietário, gerente e administrador da plataforma | Papéis são contratos de domínio; autenticação, autorização e auditoria ficam adiadas. |

## Escopo autorizado

Esta entrega contém documentação, domínio TypeScript, dados demonstrativos e testes. Não contém banco de dados, autenticação, painel administrativo, API, analytics, pagamento online ou integração com WhatsApp.

A demonstração pública usa `/cardapio/[tenantSlug]`. O slug identifica o estabelecimento na URL, mas não é credencial nem mecanismo de autorização.

## Requisitos da próxima etapa

- Toda consulta persistida deverá exigir contexto de tenant e negar acesso sem escopo.
- O proprietário e o gerente operarão somente tenants autorizados; o administrador da plataforma terá funções explicitamente delimitadas e auditadas.
- A jornada de mesa deverá definir identificação da mesa; entrega deverá definir endereço, área, taxa e horário; retirada deverá definir janela e identificação do cliente.
- O envio por WhatsApp deverá apresentar resumo e consentimento do cliente, sem afirmar confirmação ou aceite automático pelo estabelecimento.
- Pagamento online exigirá ADR, análise de fornecedor, segurança, privacidade e conciliação antes da implementação.
