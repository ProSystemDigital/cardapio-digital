# ADR 0062 — Interface administrativa de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito para revisão humana local |
| Data | 2026-08-18 |
| Decisores | Produto e Engenharia |

## Contexto

O fluxo operacional de imagens estava composto, mas sem entrada administrativa. A interface precisava permitir logo e imagens de produtos sem aceitar tenant, ator, papel ou metadados técnicos do navegador e sem antecipar a leitura pública.

## Decisão

- criar um formulário reutilizável para logo e produto;
- aceitar seleção nativa JPEG, PNG ou WebP de até 5 MB;
- exibir prévia local e revogar sua Object URL ao substituir ou desmontar;
- aplicar recorte quadrado central automático à logo, sem controle de enquadramento no formulário;
- usar o envio do formulário como intenção explícita, sem checkbox redundante, e exigir texto alternativo para produto;
- enviar apenas arquivo, alvo limitado, produto, versão esperada e texto alternativo;
- derivar novamente identidade e tenant na Server Action;
- inspecionar e normalizar conteúdo real no servidor antes do Blob;
- configurar limite de corpo da Server Action em 6 MB para comportar o contrato de origem e o multipart;
- mostrar progresso, rejeição segura, conflito, rate limit e limpeza pendente;
- carregar URL e versão das imagens somente na projeção administrativa;
- manter a projeção pública sem imagens até a Fase 3.53.

## Segurança e privacidade

O token Blob não cruza a fronteira do servidor. O nome original não é persistido, e a interface orienta conteúdo público do estabelecimento. Imagens com dados pessoais ou conteúdo sem autorização não devem ser enviadas.

## Consequências

A funcionalidade está pronta para teste humano no ambiente local autenticado. A logo usa recorte quadrado central fixo, sem editor, seleção de posição, zoom ou persistência de coordenadas. Exclusão sem substituição, recorte livre, múltiplas imagens e cadastro de produtos permanecem fora do escopo.

## Reversão

Remover o formulário, a Server Action e a projeção administrativa. Adaptadores, objetos e metadados existentes permanecem íntegros.
