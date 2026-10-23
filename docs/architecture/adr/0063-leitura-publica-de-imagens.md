# ADR 0063 — Leitura pública de imagens do catálogo

| Campo | Valor |
| --- | --- |
| Status | Aceito para revisão humana local |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

Logo e imagens de produtos já podem ser enviadas com autorização, normalizadas em WebP e referenciadas por metadados isolados no PostgreSQL. A projeção pública ainda removia essas referências deliberadamente.

## Decisão

- carregar logo e imagens de produtos sob o mesmo contexto RLS do tenant resolvido pelo slug;
- validar novamente provedor, WebP, chave no namespace exato do tenant/produto e URL HTTPS do host público aprovado antes da projeção;
- expor ao navegador somente URL pública e, para produto, texto alternativo;
- omitir chave do objeto, versão, hash, dimensões, ator e metadados administrativos;
- renderizar com `next/image`, dimensões responsivas e fallback existente por sigla ou emoji quando não houver imagem;
- derivar o texto alternativo da logo do nome público do estabelecimento.

## Consequências

O cardápio PostgreSQL passa a apresentar as imagens aprovadas sem criar nova escrita ou ampliar privilégios. Catálogos em memória continuam usando os fallbacks existentes. Referências adulteradas ou fora do namespace fazem a leitura falhar de modo seguro.

## Reversão

Remover os campos públicos do domínio, voltar a descartar imagens em `withoutVersions` e restaurar os fallbacks exclusivos. Objetos e metadados permanecem intactos.
