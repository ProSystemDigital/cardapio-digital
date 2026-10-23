# ADR 0073 — Cadastro auditado de produtos

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local e revisão humana |
| Data | 2026-09-03 |
| Decisores | Produto e Engenharia |

## Contexto

O contrato portátil aprovado no ADR 0066 não possuía persistência, autorização composta nem interface. A etapa Produtos precisa cadastrar registros sem publicar conteúdo incompleto ou misturar a transação relacional com o armazenamento de imagens.

## Decisão

- proprietários e gerentes recebem a permissão específica `catalog.product.create`;
- o navegador envia somente nome, descrição, preço, categoria e opções de atendimento;
- tenant e ator são rederivados no servidor; ID, slug, versão e disponibilidade não são aceitos do formulário;
- categoria e opções são confirmadas no mesmo tenant sob RLS;
- produto, modalidades e evento `product.created` são gravados atomicamente;
- todo produto nasce indisponível e versão 1;
- o envio opcional de imagem no mesmo gesto administrativo é regido posteriormente pelo ADR 0074;
- a migration não concede acesso, e o gate persistente usa privilégios por coluna e auditoria append-only.

## Consequências

A falha de qualquer validação ou inserção relacional reverte toda a criação. O administrador precisa revisar o card e ativar explicitamente o produto. A coordenação posterior com o armazenamento de imagens e sua compensação são definidas no ADR 0074.

## Reversão

Revogar a permissão de inserção do runtime, remover a composição e o formulário e executar `0017_product_creation.down.sql`. O rollback remove eventos `product.created` antes de restaurar a restrição anterior; produtos reais não são apagados automaticamente.
