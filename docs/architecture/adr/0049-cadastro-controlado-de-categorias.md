# ADR 0049 — Cadastro controlado de categorias

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Contrato, persistência, privilégio e composição autorizada da criação foram aprovados. A interface ainda permite apenas editar registros existentes, o que impede o cadastro operacional de várias categorias.

## Decisão

- adicionar Server Action interna autenticada para criação;
- renovar identidade, tenant, membership e `catalog.category.create` a cada envio;
- aceitar do formulário somente nome, ordem e confirmação consciente;
- não aceitar tenant, ator, papel, UUID, slug, versão ou estado de ciclo de vida;
- revalidar `/admin` após sucesso para apresentar a categoria e o evento persistidos;
- limpar o formulário após sucesso e manter mensagens acessíveis de erro e confirmação;
- manter exclusão, slug e arquivamento bloqueados.

## Consequências

Proprietário e gerente podem cadastrar quantas categorias forem necessárias, dentro dos limites do domínio, com identificadores derivados e auditoria atômica. Cada envio exige confirmação independente.

## Reversão

Remover formulário e Server Action. A composição, o privilégio e a persistência permanecem disponíveis, mas sem consumidor na interface.

## Evidência automatizada

Em 2026-08-16, 87 testes unitários, lint, tipos, build, 27 testes visuais públicos e o teste PWA foram aprovados. A tela administrativa autenticada permanece submetida à revisão humana local.

## Evidência de aceitação humana

Em 2026-08-16, a revisão visual, funcional e arquitetural humana aprovou o cadastro controlado de categorias.
