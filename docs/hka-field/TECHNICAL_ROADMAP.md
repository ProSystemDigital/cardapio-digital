# Roadmap técnico — Cardápio Digital

| Fase | Estado | Saída |
| --- | --- | --- |
| 0. Isolamento, governança e segurança | Concluída | Repositório isolado, documentação base, vulnerabilidade transitiva corrigida e riscos registrados. |
| 1. Fundação do domínio | Concluída | Contratos multitenant, resolução por slug, repositório em memória, catálogo externo à UI e testes de isolamento. |
| 1.2. Modelo operacional | Concluída | Horários, modalidades por produto, variações, adicionais, regras monetárias e validação integral. |
| 1.3. Personalização do item | Concluída | Modal acessível, carrinho por linhas, edição e preço recalculado pelo catálogo. |
| 1.4. Modalidade e cotação | Concluída | Mesa, retirada, entrega, compatibilidade, mínimo, taxa e total local. |
| 1.5. Rascunho e prévia | Concluída | Revalidação, resumo imutável, mensagem determinística e cópia local. |
| 2.0. Fundação da persistência | Em avaliação | ADR PostgreSQL, esquema relacional, isolamento RLS e rollback, ainda sem banco provisionado. |
| 2. Catálogo administrável | Planejada | Persistência, disponibilidade, identidade visual e operação por tenant. |
| 3. Identidade e administração | Planejada | Autenticação, proprietário, gerente, administrador da plataforma, autorização e auditoria. |
| 4. Jornada de pedido | Planejada | Mesa, retirada e entrega; resumo e envio por WhatsApp com regras de privacidade. |
| 5. Pagamentos e escala | Planejada | Avaliação de pagamento online, conciliação, observabilidade, SLO e operação comercial. |

## Marcos da fundação da Fase 1

- D-001 a D-006 registradas em requisitos e ADR.
- Escopo de tenant explícito em categorias e produtos.
- Marca, modalidades, canal, pagamento e catálogo configuráveis em dados.
- Valores monetários representados em centavos.
- Regras puras de filtro, carrinho e subtotal cobertas por testes.
- Rota `/cardapio/[tenantSlug]` resolve dois tenants demonstrativos no servidor.
- Repositório em memória rejeita catálogos com referências fora do tenant.
- Tenant inexistente responde com estado 404 específico.
- Nenhum banco, autenticação ou integração externa introduzido.

## Próximas decisões

1. Avaliar ADR, esquema SQL, RLS e estratégia de rollback da fundação persistente.
2. Executar a migration em PostgreSQL local descartável somente após aprovação e seleção da ferramenta.
3. Definir matriz de permissões e eventos da trilha de auditoria.
4. Detalhar exceções de horário, áreas e regras de entrega.
5. Modelar os dados pessoais mínimos por modalidade antes da coleta.
6. Definir contrato operacional do WhatsApp e critérios de confirmação do pedido.

Toda entrega executa testes unitários, lint, tipos, testes responsivos, build e teste PWA conforme aplicabilidade.
