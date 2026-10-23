# ADR 0066 — Contrato de cadastro de produtos

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-21 |
| Decisores | Produto e Engenharia |

## Contexto

A etapa Produtos já permite administrar registros existentes e suas imagens, mas o card “Adicionar produto” permanece bloqueado. Expor imediatamente um formulário ou `INSERT` permitiria publicar um agregado incompleto sem antes fixar categoria, preço e compatibilidade logística.

## Decisão

- criar um comando portátil contendo somente tenant autorizado, categoria existente, nome, descrição, preço em centavos e modalidades logísticas;
- reutilizar os limites atuais de 120 caracteres para nome, 500 para descrição e R$ 999.999,99 para preço;
- exigir ao menos uma modalidade única entre `delivery`, `pickup` e `dine_in`;
- não aceitar ID, slug, disponibilidade, imagem, emoji, tag, variações ou adicionais do chamador;
- gerar ID e slug somente no futuro adaptador de persistência;
- criar todo produto indisponível, versão 1 e sem imagem, exigindo revisão antes da publicação;
- autorizar proprietário ou gerente vinculado e negar administrador da plataforma ou outro tenant antes da porta;
- manter PostgreSQL, auditoria, privilégio persistente, composição autenticada, Server Action e formulário fora desta fase.

## Consequências

O futuro formulário possui uma fronteira pequena e testável. A imagem será adicionada depois pelo fluxo já aprovado, quando o produto possuir ID persistido. Categoria e modalidades ainda precisarão ser confirmadas sob RLS pelo futuro adaptador; o contrato sozinho não cria registros.

## Alternativas consideradas

- criar produto já disponível: rejeitado para impedir publicação acidental;
- cadastrar imagem junto com o produto: rejeitado porque mistura transação relacional e armazenamento externo antes de existir ID confiável;
- incluir variações e adicionais: adiado para contratos próprios devido à complexidade de limites e preços.

## Reversão

Remover contrato, porta, serviço e testes. Nenhum dado, migration, objeto ou privilégio precisa ser revertido.
