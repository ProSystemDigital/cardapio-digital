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

## Fase 1.2 — Modelo operacional do catálogo

- Preços, pedido mínimo, taxas, variações e adicionais usam centavos inteiros.
- Cada produto declara as modalidades em que pode ser atendido, sempre como subconjunto das modalidades do tenant.
- Horários semanais são configuráveis, mas “aberto agora” dependerá de regras futuras para fuso, feriados e exceções.
- Grupos de adicionais declaram limites mínimo e máximo verificáveis.
- Catálogos inconsistentes são rejeitados antes de serem entregues à interface.
- Seleção de personalizações e cálculo de pedido personalizado permanecem adiados para uma jornada de UX própria.

## Fase 1.3 — Jornada de personalização

- Produtos simples são adicionados diretamente; produtos configuráveis abrem uma caixa de diálogo.
- Variações obrigatórias, limites de adicionais e indisponibilidade são validados no domínio.
- A interface envia somente IDs; o preço unitário é recalculado pelo catálogo.
- Configurações iguais acumulam quantidade e configurações diferentes permanecem em linhas distintas.
- Linhas podem ser editadas, removidas e ter sua quantidade alterada.
- O subtotal considera preço unitário configurado e quantidade, ainda sem taxas ou pagamento.
- A caixa de diálogo oferece foco inicial, ciclo de foco, fechamento por `Escape` e retorno ao acionador.
