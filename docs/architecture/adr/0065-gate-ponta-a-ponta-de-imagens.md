# ADR 0065 — Gate ponta a ponta de imagens

| Campo | Valor |
| --- | --- |
| Status | Aceito para revisão humana local |
| Data | 2026-08-21 |
| Decisores | Produto e Engenharia |

## Contexto

As etapas 3.45 a 3.54 construíram separadamente o contrato, processamento, persistência, armazenamento, interface, leitura pública e manutenção de imagens. Antes de avançar o catálogo, era necessário verificar a história inteira sem produzir uma nova mutação apenas para o teste.

## Decisão

- tratar como história crítica o fluxo `/admin` → Server Action → autorização → Sharp → Vercel Blob → PostgreSQL → `/cardapio/[tenantSlug]`;
- combinar testes automatizados de domínio, limites de servidor, adaptadores, projeção pública, responsividade e PWA com evidências humanas do ambiente autenticado real;
- não repetir upload nem exclusão real quando a persistência e a leitura pública já possuem aprovação humana recente;
- usar reconciliação somente em `dry_run` para confirmar que todo objeto armazenado permanece referenciado;
- aceitar como evidência de rollback o ciclo PostgreSQL descartável `up/down/up`, os testes de compensação do objeto novo e a limpeza pendente do objeto anterior;
- manter o gate em revisão até a aprovação humana explícita desta matriz.

## Evidências de 2026-08-21

- 127 testes unitários aprovados;
- 27 testes visuais aprovados em mobile, tablet e desktop;
- teste PWA e fallback offline aprovado;
- lint, TypeScript e build de produção aprovados;
- `dry_run`: 2 objetos, 99.888 bytes, 2 referências, nenhum órfão, namespace inválido, erro ou exclusão;
- PostgreSQL `up/down/up`, RLS, isolamento e snapshots já aprovados no gate local;
- upload, substituição, recorte central automático, permanência no perfil/produto e leitura pública já aprovados em revisão humana.

## Consequências

O subsistema local de imagens possui evidência de todas as fronteiras e não exige novo privilégio, migration ou operação destrutiva. Rate limit distribuído, backup restaurável remoto, alertas externos e validação em produção continuam fora deste gate e permanecem bloqueadores antes de escala multi-instância ou dados reais.

## Reversão

Este ADR e a matriz operacional podem ser revertidos sem alterar dados. A reversão funcional continua sendo desabilitar a entrada administrativa e a projeção pública, preservando objetos e metadados até reconciliação autorizada.
