# ADR 0075 — Formulário unificado e arquivamento de produtos

| Campo | Valor |
| --- | --- |
| Status | Em gate local e revisão humana |
| Data | 2026-09-03 |
| Decisores | Produto e Engenharia |

## Contexto

Criar e editar produtos em superfícies diferentes aumentava a carga cognitiva. A exclusão física é incompatível com referências históricas de pedidos, imagens e auditoria.

## Decisão

- criação e edição reutilizam a mesma instância visual do formulário, posicionada acima da lista; o botão do card apenas seleciona o produto e preenche essa área;
- nenhum card contém ou expande um formulário próprio;
- a edição de conteúdo, preço, categoria e disponibilidade é uma única transação PostgreSQL com concorrência otimista;
- a criação persiste o estado disponível ou não disponível selecionado; um produto disponível exige ao menos uma opção de atendimento;
- a imagem continua coordenada depois da transação relacional, com falha parcial explícita;
- “Excluir produto” realiza arquivamento lógico, força indisponibilidade e registra `product.archived`;
- somente Proprietário recebe `catalog.product.archive`;
- o runtime não recebe `DELETE` em produtos e precisa apenas atualizar `archived_at`, disponibilidade, versão e data;
- editar e excluir ficam recolhidos no menu vertical de três pontos do card, aberto por hover, foco ou acionamento explícito;
- a confirmação de exclusão é solicitada imediatamente antes do arquivamento, sem inserir controles destrutivos no formulário principal.

## Consequências

Produtos arquivados deixam as leituras administrativas e públicas, mas preservam integridade referencial e histórico. Recuperação e descarte definitivo permanecem fora desta etapa.

## Reversão

Remover a ação e o campo de arquivamento da interface, revogar a atualização de `archived_at` e executar `0018_product_archiving.down.sql` após avaliar os eventos existentes.
