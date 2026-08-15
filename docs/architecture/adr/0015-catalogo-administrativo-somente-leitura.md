# ADR 0015 — Catálogo administrativo somente leitura

| Campo | Valor |
| --- | --- |
| Status | Aceito para gate local |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

A rota administrativa já deriva exatamente uma membership interna. Expor edição imediatamente misturaria validação de leitura, UX, autorização de comando, concorrência e auditoria em um único gate de alto risco.

## Decisão

- carregar o catálogo pelo `tenantId` derivado no servidor;
- não aceitar slug, tenant, papel, `params` ou `searchParams` do navegador;
- conceder ao runtime somente `SELECT` nas tabelas necessárias do catálogo;
- manter RLS forçada e definir `app.tenant_id` dentro da transação de leitura;
- renderizar produtos, disponibilidade e preço sem controles de mutação;
- manter comandos de catálogo fora da rota até gate específico.

## Consequências

A jornada comprova identidade, vínculo, membership, isolamento e leitura antes de introduzir escrita. A interface não permite editar, mas os dados autorizados são enviados ao navegador como HTML, comportamento necessário para uma área administrativa de consulta.

## Reversão

Remover a composição administrativa e revogar `SELECT` do papel local nas tabelas de catálogo. Autenticação, vínculo e derivação de membership permanecem independentes.
