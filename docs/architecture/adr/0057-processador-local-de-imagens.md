# ADR 0057 — Processador local de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

O contrato da Fase 3.46 exige decodificação real, limites contra imagens desproporcionais, orientação, recorte, normalização WebP, remoção de metadados e SHA-256 antes do armazenamento. APIs nativas do Node.js não fornecem esse pipeline.

## Decisão

- declarar `sharp@0.35.3` como dependência direta e exata, alinhada ao override já validado no projeto;
- manter o adaptador atrás de `CatalogImageProcessor` e exportá-lo à aplicação por módulo `server-only`;
- limitar a decodificação a 40 megapixels e manter os limites de 8192 px por aresta do domínio;
- rejeitar formatos diferentes de JPEG, PNG e WebP, conteúdo corrompido e imagens com mais de uma página;
- aplicar orientação antes do recorte `cover` com estratégia de atenção;
- gerar WebP com redução controlada de qualidade até cumprir 200 KiB para logo ou 350 KiB para produto;
- não chamar APIs de preservação de metadados, fazendo o Sharp remover EXIF, XMP e perfis anexados por padrão;
- calcular SHA-256 sobre os bytes finais, sem criar arquivos temporários.

## Consequências e riscos

O processamento usa memória e CPU do servidor e depende dos binários nativos distribuídos pelo Sharp. Limites de origem, pixels e saída reduzem abuso, mas rate limit, timeout operacional e observabilidade continuam obrigatórios antes de expor uma rota. A estratégia automática de recorte poderá receber ajuste manual em fase futura.

## Limites

Não há Vercel Blob, PostgreSQL, Server Action, formulário ou upload ativo. O módulo não aceita caminho de arquivo e não grava no sistema de arquivos.

## Reversão

Remover o adaptador, testes e dependência direta `sharp`. O contrato portável e a migration 0011 permanecem válidos.

## Evidência automatizada

Em 2026-08-18, 110 testes unitários aprovaram o processador e todas as regressões existentes. Os testes focados comprovaram JPEG, PNG, WebP, dimensões finais, transparência da logo, remoção de EXIF/XMP, SHA-256 e rejeição de corrupção, GIF e aresta excessiva. Lint, TypeScript, build de produção e auditoria npm sem vulnerabilidades também foram aprovados.
