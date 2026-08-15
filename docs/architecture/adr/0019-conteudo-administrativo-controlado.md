# ADR 0019 — Conteúdo administrativo controlado

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-15 |
| Decisores | Produto e Engenharia |

## Contexto

Preço, disponibilidade e consulta da auditoria já foram aprovados. Para tornar o catálogo realmente configurável por tenant, a próxima menor fatia precisa permitir corrigir o nome e a descrição pública de um produto sem abrir criação, exclusão, categorias, imagens ou configurações operacionais.

## Decisão

- editar nome e descrição em um formulário independente;
- exigir nome não vazio com até 120 caracteres e descrição com até 500 caracteres;
- normalizar espaços periféricos no servidor;
- renovar sessão, vínculo, membership e `catalog.product.update` a cada envio;
- aceitar do navegador somente produto, versão esperada, conteúdo e confirmação;
- persistir conteúdo, incremento de versão e auditoria na mesma transação;
- conceder ao runtime `UPDATE` somente em `name`, `description`, `version` e `updated_at`;
- manter React responsável por escapar o conteúdo na interface pública e administrativa.

## Consequências

O tenant poderá corrigir textos públicos sem receber acesso às demais colunas. Concorrência com alterações de preço ou disponibilidade falha fechada pela mesma versão otimista. A auditoria registra o novo conteúdo, que permanece sujeito à futura política de retenção; o formulário deve ser usado apenas para conteúdo público do catálogo, não para dados pessoais.

O gate local foi aprovado em 2026-08-15. O ciclo PostgreSQL descartável confirmou migrations, RLS, isolamento, snapshots e `up/down/up`; o banco persistente confirmou a concessão mínima, a alteração auditada de conteúdo e a revisão visual, funcional e arquitetural humana.

## Reversão

Remover formulário e Server Action e revogar `UPDATE` em `name` e `description`. Preço, disponibilidade, leitura e eventos já registrados permanecem independentes.
