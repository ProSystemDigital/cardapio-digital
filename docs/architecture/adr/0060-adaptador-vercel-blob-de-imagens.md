# ADR 0060 — Adaptador Vercel Blob de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

O contrato de upload, o processador e a persistência de metadados já foram aprovados. Faltava implementar e validar o armazenamento dos binários normalizados sem expor token ao navegador nem antecipar a interface ou a composição operacional.

## Decisão

- usar Vercel Blob público para logo e imagens públicas do catálogo;
- encapsular `@vercel/blob` atrás de `CatalogImageObjectStorage` e de um módulo `server-only`;
- gerar uma nova chave com UUID para cada objeto, sem sobrescrita;
- separar chaves por tenant, finalidade e produto;
- aceitar identificadores na representação canônica do tipo `uuid` do PostgreSQL, sem exigir bits de versão ou variante nos IDs técnicos determinísticos;
- aceitar exclusivamente WebP já normalizado pelo processador;
- usar cache de um ano porque cada substituição recebe URL nova e imutável;
- validar que a resposta conserva a chave solicitada e pertence a um host público do Vercel Blob;
- restringir exclusões ao namespace e ao formato de chave criados pelo adaptador;
- manter timeout, rate limit, composição, interface e reconciliação fora desta fase.

## Infraestrutura validada

- projeto Vercel `cardapio-digital`, sem deploy;
- store pública `cardapio-digital-images`, região `iad1`;
- token somente no `.env.local` ignorado e no ambiente vinculado;
- operação real `put` seguida de `delete`, sem objeto técnico retido.

O vínculo automático do repositório GitHub ao projeto Vercel não foi autorizado pelo provedor e permanece pendente; isso não interfere no contrato Blob local.

## Consequências

O armazenamento pode ser composto no servidor na próxima fase. Uploads pelo navegador, metadados persistidos e imagens públicas na aplicação continuam desabilitados.

## Reversão

Remover o adaptador e a dependência. A store só poderá ser removida após confirmar que nenhum metadado persistente referencia seus objetos.
