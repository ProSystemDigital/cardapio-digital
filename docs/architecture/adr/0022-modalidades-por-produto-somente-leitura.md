# ADR 0022 — Modalidades por produto somente leitura

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

Mesa, retirada e entrega afetam disponibilidade, cotação e a futura jornada de pedido. Essas relações já estão persistidas e validadas, mas ainda não são verificáveis na área administrativa. Permitir edição imediatamente ampliaria privilégios sobre uma tabela associativa e exigiria decisão própria de atualização atômica.

## Decisão

- apresentar em cada produto as modalidades reconstruídas pelo repositório PostgreSQL;
- traduzir os valores internos para rótulos operacionais em português;
- manter a renderização no Server Component, sem estado ou requisição cliente;
- não aceitar modalidade, produto ou tenant por parâmetro de navegação;
- não adicionar Server Action, migration ou privilégio PostgreSQL;
- manter alterações de modalidades bloqueadas até gate específico.

## Consequências

Proprietário e gerente podem conferir a compatibilidade operacional antes de editar. A leitura reutiliza RLS e validação integral do catálogo já aprovadas. Uma futura mutação deverá impedir conjunto vazio, modalidade fora do tenant e atualização parcial sem auditoria.

## Reversão

Remover a lista de modalidades dos cartões administrativos. Persistência, permissões e experiência pública permanecem inalteradas.

## Evidência de aceitação

Em 2026-08-15, a revisão humana visual, funcional e arquitetural aprovou a apresentação somente leitura. Os testes unitários, lint, verificação de tipos, build, regressão visual e PWA passaram sem criação de migration, Server Action ou privilégio PostgreSQL.
