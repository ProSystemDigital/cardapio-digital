# ADR 0035 — Auditoria administrativa do perfil

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

O banco persistente permite a leitura mínima e o repositório retorna eventos sanitizados, mas a área administrativa ainda não apresenta a evidência das alterações do perfil. A consulta deve renovar autorização e não receber escopo ou limite do navegador.

## Decisão

- autorizar a leitura com `tenant.audit.read` a partir da identidade interna;
- fixar o limite em 20 eventos no módulo exclusivo de servidor;
- carregar a trilha junto com o catálogo e a auditoria de produtos;
- apresentar nome curto alterado, indicação de slogan atualizado, papel e instante;
- omitir UUID do ator, identidade externa e propriedades desconhecidas;
- não oferecer paginação, exportação, alteração ou exclusão.

## Consequências

Proprietário e gerente podem verificar a evidência recente da edição textual sem ampliar dados expostos. Retenção, paginação e exportação continuam bloqueadas por decisão de governança.

## Reversão

Remover composição e seção visual e revogar `SELECT` da Fase 3.24. Escrita e eventos já persistidos permanecem inalterados.

## Evidência de aceitação

Em 2026-08-16, testes unitários, lint, tipos, build, testes visuais e PWA foram aprovados. A revisão visual, funcional e arquitetural humana confirmou a apresentação limitada e sanitizada no painel administrativo.
