# ADR 0074 — Imagem coordenada no cadastro de produtos

| Campo | Valor |
| --- | --- |
| Status | Em revisão humana |
| Data | 2026-09-03 |
| Decisores | Produto e Engenharia |

## Contexto

O cadastro auditado do ADR 0073 cria corretamente um produto indisponível, mas obrigava o administrador a localizar o novo card para enviar sua imagem em uma segunda interação. A imagem vive no armazenamento de objetos e seus metadados vivem no PostgreSQL; portanto, não existe transação distribuída segura entre as duas gravações.

## Decisão

- o arquivo de imagem é opcional e validado antes da criação relacional;
- somente JPEG, PNG ou WebP de até 5 MB seguem para o processador já aprovado;
- o servidor cria primeiro o produto indisponível e obtém seu identificador derivado;
- quando há arquivo, o servidor reutiliza o fluxo autorizado de processamento, Blob, metadados, auditoria, compensação e observabilidade;
- falha na imagem não desfaz nem oculta o produto já criado: a resposta informa o resultado parcial e orienta a inclusão posterior pelo editor;
- o nome do produto é usado como texto alternativo inicial e pode ser revisado no editor;
- os cards permanecem apenas para leitura por padrão; a ação “Editar” revela os formulários existentes sem usar um menu expansível;
- a exclusão posterior é regida pelo arquivamento lógico definido no ADR 0075.

Esta decisão substitui somente a restrição dos ADRs 0066 e 0073 que adiava obrigatoriamente a imagem para depois do cadastro. As demais garantias desses registros permanecem vigentes.

## Consequências

O fluxo melhora a experiência sem fingir atomicidade entre PostgreSQL e armazenamento. Um reenvio após falha de imagem não é incentivado, reduzindo o risco de produto duplicado. A publicação continua bloqueada até ativação explícita do produto.

## Reversão

Remover o campo de arquivo e a segunda etapa da Server Action restaura o comportamento do ADR 0073 sem migration ou alteração de dados.
