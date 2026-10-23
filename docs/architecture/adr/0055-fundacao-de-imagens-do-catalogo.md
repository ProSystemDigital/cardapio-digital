# ADR 0055 — Fundação de imagens do catálogo

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

O perfil do estabelecimento e os produtos precisam receber imagens escolhidas em celular ou computador. O seletor nativo pode expor arquivos locais, Google Drive ou Google Fotos, mas essa origem não oferece permanência ao catálogo. Os binários precisam de armazenamento de objetos e o PostgreSQL deve manter somente metadados relacionais.

## Decisão

- adotar Vercel Blob público como primeiro armazenamento planejado, atrás de uma fronteira substituível;
- aceitar como origem JPEG, PNG ou WebP de até 5 MB, mas persistir somente o resultado normalizado em WebP;
- normalizar logos para `512 × 512`, até 200 KiB, e produtos para `1200 × 900`, até 350 KiB;
- não aceitar inicialmente SVG, GIF, HEIC ou HEIF;
- manter uma imagem ativa por tenant e uma por produto em relações distintas, com FK composta e RLS forçada;
- persistir provedor, chave opaca, URL HTTPS pública, dimensões, tamanho, SHA-256, versão e timestamps; imagens de produto também exigem texto alternativo;
- não armazenar binários, nomes originais, EXIF ou credenciais no PostgreSQL;
- não conceder privilégio ao runtime, instalar SDK, provisionar Blob ou habilitar upload nesta fase.

## Segurança e consistência

O comando futuro deverá renovar identidade, tenant, membership e permissão no servidor; validar assinatura real e decodificar a imagem; remover metadados; gerar chave aleatória; limitar frequência; e coordenar compensação de objetos órfãos. A troca do metadado no PostgreSQL e a exclusão do objeto anterior não formam uma transação distribuída, portanto a limpeza será posterior e idempotente.

## Consequências

As imagens públicas poderão ser entregues diretamente pelo armazenamento, enquanto o catálogo mantém isolamento e integridade relacional. O modelo assume imagens públicas e não deve receber documentos, dados pessoais ou conteúdo administrativo privado.

## Alternativas consideradas

- binário no PostgreSQL: rejeitado por aumentar banco, backup e tráfego relacional;
- vínculo direto para Drive ou Fotos: rejeitado por disponibilidade, autorização externa e URLs não controladas;
- integração Google Picker imediata: adiada por adicionar OAuth e permissões sem necessidade para o primeiro fluxo;
- tabela polimórfica única: rejeitada por enfraquecer chaves estrangeiras entre tenant, produto e imagem.

## Reversão

Executar a migration `0011_catalog_image_metadata.down.sql`. Como esta fase não grava objetos nem concede privilégios, o rollback remove apenas tabelas vazias de metadados.
