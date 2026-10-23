# ADR 0025 — Personalizações por produto somente leitura

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Variações, adicionais, disponibilidade e limites de seleção afetam diretamente a composição e o preço recalculado do item. Esses dados já pertencem ao agregado validado do catálogo e são usados na jornada pública, mas ainda não são verificáveis na área administrativa. Abrir sua edição simultaneamente exigiria novos contratos de escrita para estruturas relacionadas, concorrência e auditoria próprias.

## Decisão

- apresentar em cada produto as variações e os grupos de adicionais reconstruídos pelo catálogo autorizado;
- informar diferenças de preço, preços dos adicionais, disponibilidade e limites mínimo e máximo;
- renderizar os dados no Server Component administrativo, sem estado ou requisição cliente;
- reutilizar a leitura, o isolamento RLS e a validação integral já aprovados;
- não adicionar Server Action, migration ou privilégio PostgreSQL;
- manter criação, edição, ordenação e exclusão bloqueadas até decisão e gate específicos.

## Consequências

Proprietário e gerente podem conferir as configurações que determinam a personalização e o cálculo público sem ampliar a superfície de escrita. Produtos sem personalizações recebem um estado explícito. Uma futura mutação deverá preservar pertencimento ao tenant, limites válidos, disponibilidade, versão otimista e auditoria atômica.

## Reversão

Remover o resumo de personalizações dos cartões administrativos. Persistência, permissões, comandos existentes e jornada pública permanecem inalterados.

## Evidência de aceitação

Em 2026-08-16, testes unitários, lint, tipos, build, regressão visual e PWA foram aprovados. A revisão humana autenticada, visual, funcional e arquitetural aprovou variações, adicionais, disponibilidade, limites e comportamento responsivo sem nova mutação ou privilégio.
