# Instruções para Agentes de Engenharia

Este arquivo define as regras operacionais para agentes de inteligência
artificial que atuam neste repositório, incluindo Codex, GitHub Copilot,
ChatGPT, Claude e ferramentas compatíveis.

## Ordem obrigatória de leitura

Antes de propor ou executar alterações, leia:

1. este `AGENTS.md`;
2. [`ENGINEERING_CHARTER.md`](ENGINEERING_CHARTER.md);
3. [`docs/hka-field/HKA_FIELD_ENGINEERING_GUIDE.md`](docs/hka-field/HKA_FIELD_ENGINEERING_GUIDE.md);
4. [`docs/standards/DEVELOPMENT_POLICY.md`](docs/standards/DEVELOPMENT_POLICY.md);
5. [`docs/DOCUMENTATION_CATALOG.md`](docs/DOCUMENTATION_CATALOG.md);
6. [`docs/hka-field/TECHNICAL_ROADMAP.md`](docs/hka-field/TECHNICAL_ROADMAP.md);
7. [`README.md`](README.md).

Leia também os documentos específicos da área alterada, incluindo ADRs,
registros de risco, inventários e políticas aplicáveis.

## Regras de atuação

- Compreenda o requisito, o estado do repositório e as dependências antes de
  modificar arquivos.
- Preserve a arquitetura, as regras de negócio e o comportamento existentes,
  salvo quando a solicitação aprovar explicitamente uma mudança.
- Respeite a Carta da Engenharia como autoridade institucional superior.
- Respeite o HKA FIELD e a política permanente de desenvolvimento.
- Mantenha o escopo restrito e evite refatorações ou mudanças incidentais.
- Não adicione, remova ou atualize dependências sem necessidade demonstrável,
  avaliação de risco e justificativa registrada.
- Reutilize padrões existentes e evite duplicação de código, configuração e
  documentação.
- Preserve compatibilidade com as versões de runtime e ferramentas declaradas
  pelo projeto.
- Não exponha segredos, dados pessoais ou credenciais em código, logs,
  documentação ou commits.
- Justifique decisões arquiteturais relevantes e registre-as em ADR quando
  alterarem contratos, limites ou decisões duradouras.
- Atualize a documentação afetada na mesma entrega.
- Não altere artefatos gerados manualmente.
- Preserve mudanças preexistentes no diretório de trabalho que não pertençam à
  solicitação.

## Validação obrigatória

Antes de concluir uma alteração, execute, quando aplicável:

```bash
npm run lint
npm run typecheck
npm run build
```

Execute também os testes relacionados ao escopo. Se alguma validação não puder
ser executada, registre o motivo e o risco residual no relatório final.

## Critério de conclusão

Uma atividade só está concluída quando a implementação, as validações e a
documentação relevante estiverem coerentes. O relatório final deve informar
arquivos alterados, verificações executadas, limitações e decisões adiadas.
