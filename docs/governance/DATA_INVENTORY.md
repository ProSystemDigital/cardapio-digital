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
