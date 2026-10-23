# ADR 0032 — Perfil textual do tenant controlado

| Campo | Valor |
| --- | --- |
| Status | Aceito |
| Data | 2026-08-16 |
| Decisores | Produto e Engenharia |

## Contexto

Persistência, contrato, adaptador, privilégio e composição autorizada foram aprovados separadamente. A menor superfície útil é permitir corrigir nome curto e slogan sem abrir canal, pagamento, modalidades ou outras configurações do tenant.

## Decisão

- oferecer formulário independente para nome da empresa e slogan;
- informar e aplicar limites de 20 e 30 caracteres, respectivamente;
- exigir versão esperada, sem checkbox redundante para a edição textual;
- renovar sessão, identidade, membership e `tenant.profile.update` na Server Action;
- derivar tenant, papel e ator exclusivamente no servidor;
- persistir alteração e auditoria na mesma transação;
- manter canal, pagamento, modalidades e nome principal fora do formulário.

## Consequências

Proprietário e gerente podem atualizar a identidade textual com concorrência otimista e trilha própria. O botão de salvar expressa a intenção da alteração, enquanto os limites permanecem aplicados no navegador, na Server Action e no domínio. Conflitos exigem recarregar antes de tentar novamente.

## Reversão

Remover formulário e Server Action e revogar os privilégios da Fase 3.20. Leitura, contrato e dados já auditados permanecem independentes.

## Evidência de aceitação

Em 2026-08-16, testes unitários, lint, tipos, build, regressão visual e PWA foram aprovados. A revisão humana autenticada confirmou alteração e restauração persistentes de nome curto e slogan, confirmação explícita, auditoria informada e responsividade em dispositivo real.
