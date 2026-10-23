# ADR 0056 — Contrato de upload de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

A fundação relacional da Fase 3.45 foi aprovada no PostgreSQL descartável. Antes de escolher SDK, processador ou endpoint, a aplicação precisa definir uma fronteira que não confie no MIME, tamanho, dimensões, URL ou chave informados pelo navegador e que trate a falta de transação distribuída entre armazenamento de objetos e PostgreSQL.

## Decisão

- aceitar no comando somente tenant, destino, versão esperada, texto alternativo aplicável e bytes da origem;
- limitar a origem declarada a JPEG, PNG ou WebP, de 1 byte a 5 MiB;
- exigir que uma porta de processamento decodifique o conteúdo, confirme tipo e tamanho, limite cada aresta a 8192 px e a imagem a 40 megapixels;
- exigir saída WebP exatamente conforme o destino e com SHA-256 válido;
- exigir que a porta de armazenamento gere chave e URL HTTPS confiáveis;
- derivar `catalog.image.update`, ator, tenant e papel antes de processar qualquer byte;
- exigir texto alternativo de até 160 caracteres para produto e derivar o texto da logo a partir do perfil;
- excluir o objeto novo se a persistência relacional falhar;
- elevar erro próprio quando essa exclusão compensatória falhar;
- tratar falha ao excluir a imagem anterior como limpeza pendente após a persistência bem-sucedida.

## Limites

Não existem processador, SDK, adaptador PostgreSQL, Server Action, formulário de arquivo, rate limit ou armazenamento remoto nesta fase. Os contratos não aceitam contexto de autorização, chave de objeto ou URL vindos do navegador.

## Consequências

O fluxo futuro poderá trocar processador e provedor sem alterar as regras do domínio. A compensação reduz objetos órfãos, mas a limpeza pendente ainda exigirá mecanismo operacional idempotente antes da ativação real.

## Reversão

Remover os contratos, serviço e permissão `catalog.image.update`. A migration 0011 permanece independente e vazia.

## Evidência automatizada

Em 2026-08-18, 106 testes unitários aprovaram formatos, tamanho, dimensões, normalização, autorização derivada, compensação após falha relacional e sinalização de limpeza pendente. Lint, TypeScript e build de produção também foram aprovados.
