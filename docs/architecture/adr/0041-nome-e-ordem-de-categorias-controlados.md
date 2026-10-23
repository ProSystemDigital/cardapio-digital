# ADR 0041 — Nome e ordem de categorias controlados

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Contrato, PostgreSQL, privilégio persistente e composição autorizada foram aprovados. A menor capacidade operacional restante é corrigir nome e ordem de categorias existentes sem abrir gestão do ciclo de vida.

## Decisão

- carregar a versão da categoria somente no catálogo administrativo e removê-la da rota pública;
- apresentar um formulário independente por categoria;
- exigir nome, ordem, versão e confirmação consciente;
- renovar autenticação, tenant, membership e permissão no servidor;
- não aceitar tenant, ator ou papel do formulário;
- limitar nome a 80 caracteres e ordem a inteiro entre 0 e 10.000;
- manter criação, slug, arquivamento e exclusão bloqueados.

## Consequências

Proprietário e gerente podem corrigir a organização pública do catálogo com conflito otimista e auditoria atômica. Cada categoria possui confirmação e estado de resposta próprios.

## Reversão

Remover formulário e Server Action. Composição, privilégio e fundação permanecem sem consumidor visível.

## Evidência de aceitação

Em 2026-08-16, 78 testes unitários, lint, tipos, build, 27 testes visuais e PWA foram aprovados. A revisão visual, funcional e arquitetural humana confirmou edição, reordenação e responsividade.
