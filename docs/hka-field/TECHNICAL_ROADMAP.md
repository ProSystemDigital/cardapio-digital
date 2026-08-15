# Roadmap técnico — Cardápio Digital

| Fase | Estado | Saída |
| --- | --- | --- |
| 0. Isolamento, governança e segurança | Concluída | Repositório isolado, documentação base, vulnerabilidade transitiva corrigida e riscos registrados. |
| 1. Fundação do domínio | Concluída | Contratos multitenant, resolução por slug, repositório em memória, catálogo externo à UI e testes de isolamento. |
| 1.2. Modelo operacional | Concluída | Horários, modalidades por produto, variações, adicionais, regras monetárias e validação integral. |
| 1.3. Personalização do item | Concluída | Modal acessível, carrinho por linhas, edição e preço recalculado pelo catálogo. |
| 1.4. Modalidade e cotação | Concluída | Mesa, retirada, entrega, compatibilidade, mínimo, taxa e total local. |
| 1.5. Rascunho e prévia | Concluída | Revalidação, resumo imutável, mensagem determinística e cópia local. |
| 2.0. Fundação da persistência | Concluída | ADR PostgreSQL, esquema relacional, isolamento RLS e rollback, ainda sem banco provisionado. |
| 2.1. Validação PostgreSQL local | Concluída | Papéis mínimos, RLS, isolamento, snapshots, limpeza e ciclo `up/down/up` comprovados. |
| 2.2. Repositório PostgreSQL | Concluída | Adaptador real validado localmente atrás do contrato atual, com configuração explícita e retorno seguro à memória. |
| 2.3. Escrita transacional do catálogo | Concluída | Gate real aprovado: preço e disponibilidade com ator autorizado, versão otimista e auditoria append-only. |
| 3.0. Identidade e autorização | Concluída | Gate real aprovado: principal técnico, memberships por tenant, papel de plataforma separado e matriz negativa por padrão. |
| 3.1. Fundação da autenticação | Concluída | Clerk aprovado; contrato portável, adaptador e vínculo PostgreSQL passaram no gate local, ainda sem conta ou sessão real. |
| 3.2. Autenticação Clerk controlada | Concluída | Instância de desenvolvimento restrita; login, proteção, logout e revogação reais aprovados, sem aceitar tenant ou papel externo. |
| 3.3. Vínculo autenticado ao principal interno | Concluída | Provisionamento persistente local e ciclo vínculo ativo, revogação, negação e reativação aprovados sem expor identificadores. |
| 3.4. Tenant e papel derivados | Concluída | Migration, função estreita e gate persistente aprovados; um tenant e papel `owner` foram derivados exclusivamente do PostgreSQL. |
| 3.5. Catálogo administrativo somente leitura | Concluída | Leitura pelo tenant derivado, permissão mínima persistente e interface sem mutações aprovadas no gate PostgreSQL e na revisão humana. |
| 3.6. Disponibilidade administrativa controlada | Concluída | Mutação real aprovada com autorização renovada, confirmação, versão otimista, auditoria transacional e permissão PostgreSQL mínima. |
| 3.7. Preço administrativo controlado | Concluída | Edição monetária real aprovada com centavos, limite, autorização renovada, confirmação, versão otimista, auditoria e permissão mínima. |
| 3.8. Auditoria administrativa somente leitura | Planejada | Consulta dos eventos do tenant derivado, sem PII e sem capacidade de alterar ou excluir a trilha. |
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

1. Decidir o provedor e o vínculo de identidade externa antes de implementar login.
2. Definir expiração, revogação e recuperação da sessão autenticada.
3. Definir retenção e consulta operacional da trilha de auditoria.
4. Detalhar exceções de horário, áreas e regras de entrega.
5. Modelar os dados pessoais mínimos por modalidade antes da coleta.
6. Definir contrato operacional do WhatsApp e critérios de confirmação do pedido.

Toda entrega executa testes unitários, lint, tipos, testes responsivos, build e teste PWA conforme aplicabilidade.
