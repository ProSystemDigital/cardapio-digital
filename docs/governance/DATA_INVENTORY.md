# Inventário técnico de dados — Cardápio Digital

| Campo | Valor |
| --- | --- |
| Revisão | 2026-08-12 |
| Escopo | Fundação multitenant demonstrativa e especificação local do esquema persistente |
| Classificação | Sem coleta de dados pessoais |

Os dois catálogos demonstrativos contêm identificador técnico e slug do tenant, identidade fictícia, modalidades, horários semanais, pedido mínimo, taxa demonstrativa, categorias, produtos, preços, disponibilidade, variações e adicionais. O slug é usado somente para resolver a rota pública. Esses dados são operacionais e fictícios, sem identificação pessoal. O carrinho mantém em memória IDs técnicos de tenant, produto, variação, adicionais e linha, quantidade, preço recalculado e modalidade escolhida; subtotal, taxa, mínimo e total são derivados. O rascunho local contém uma referência efêmera, nomes públicos do catálogo e esses valores recalculados. Tudo é descartado ao recarregar a aba. A cópia ocorre somente para o clipboard após ação do usuário. Não há conta, formulário de pedido, analytics, cookies próprios, banco, pagamento, mesa identificada, endereço, integração de entrega ou envio de pedido.

Os identificadores e papéis de domínio representam contratos futuros, não pessoas cadastradas. Antes de persistir tenants, usuários, clientes ou pedidos, este inventário deverá registrar campos, finalidade, base legal, origem, compartilhamento, retenção, descarte e controles de acesso.

O envio por WhatsApp e as modalidades de retirada/entrega permanecem bloqueados até a definição dos dados mínimos e da governança aplicável.

## Esquema persistente em avaliação

A migration local especifica tenants, identidade visual, operação, horários, catálogo e snapshots de itens de pedido. Esses artefatos ainda não foram executados e não representam coleta ou armazenamento. O esquema exclui deliberadamente nome e contato do cliente, endereço, número de mesa, dados de pagamento e identificadores governamentais. A inclusão de qualquer desses campos exige atualização prévia deste inventário e decisão de privacidade, finalidade, retenção e acesso.

O teste do repositório PostgreSQL acrescenta uma fixture local fictícia com tenant, horário, categoria, produto, variação e adicional. O banco é descartado ao final do gate. Não há dado pessoal, conexão Neon ou retenção do conteúdo de teste.

A fundação de escrita registra na auditoria UUID técnico do ator, papel, ação, tipo e UUID da entidade, campos operacionais alterados e instante UTC. Não contém identidade civil ou contato. Retenção, exportação e eventual correlação operacional com a conta autenticada permanecem bloqueadas até decisão de governança própria.

A consulta administrativa local mostra somente nome atual do produto, instante, papel interno e mudanças conhecidas de preço ou disponibilidade dos 20 eventos mais recentes. UUID do ator, vínculo externo e dados do Clerk não são enviados ao navegador. Retenção, paginação e exportação continuam sem implementação.

A Fase 3.9 permite editar nome e descrição públicos e registra os novos textos na auditoria append-only. Esses campos são conteúdo operacional do catálogo e não devem conter nomes de clientes, contatos ou outros dados pessoais. A interface limita nome a 120 e descrição a 500 caracteres; retenção e descarte da auditoria continuam pendentes de decisão própria.

A Fase 3.11 altera somente a referência técnica da categoria do produto. A auditoria apresentada registra o nome público da categoria de destino e omite seu UUID; nenhum dado pessoal é acrescentado.

A Fase 3.0 acrescenta principals, memberships e papéis de plataforma representados somente por UUID, estado, papel, versões e timestamps. Não há subject de fornecedor, nome, e-mail, telefone, senha, token ou cookie. O futuro vínculo com identidade externa exigirá atualização deste inventário antes da coleta.

A Fase 3.1 especifica a persistência de `issuer` e `subject` pseudônimos, estado do vínculo e timestamps, exclusivamente para resolver o `principalId`. O gate usa valores fictícios e banco descartável; ainda não existe coleta real. A aplicação não copia nome, e-mail, telefone, senha, token ou organização do Clerk. Exclusão/revogação acompanhará o encerramento do acesso, ressalvada eventual evidência de auditoria com retenção própria.

A Fase 3.2 passou a usar uma conta real somente na instância Clerk de desenvolvimento restrita. O fornecedor processa os dados cadastrais necessários ao login, mas a aplicação recebe a sessão verificada e não copia perfil, e-mail, telefone, senha ou token para o PostgreSQL. A Fase 3.3 conecta a rota ao resolvedor interno em modo de negação; nenhum `issuer` ou `subject` real será persistido antes do gate humano de provisionamento local.
