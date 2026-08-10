# Política Permanente do Ambiente de Desenvolvimento

| Campo | Definição |
| --- | --- |
| Proprietário | Engenharia da ProSystem Digital |
| Aplicação | Projetos atuais e futuros da ProSystem Digital |
| Caráter | Permanente, com revisão contínua |
| Documento superior | HKA FIELD Engineering Guide |

## 1. Objetivo

Estabelecer um ambiente de desenvolvimento previsível, seguro e compatível
entre projetos. Esta política traduz o HKA FIELD em regras de ferramentas e
operação; não substitui nem repete os princípios, critérios de qualidade ou
ciclo de engenharia definidos no framework.

## 2. Princípios

- adotar versões estáveis, suportadas e adequadas à produção;
- manter configurações mínimas, explícitas e reproduzíveis;
- privilegiar ferramentas oficiais e dependências justificadas;
- automatizar verificações sem ocultar falhas;
- preservar segurança, compatibilidade e rastreabilidade;
- documentar exceções, responsáveis e critérios de revisão.

## 3. Fonte de verdade do projeto

Cada repositório deve declarar seus requisitos em arquivos versionados, como
`package.json`, lockfile, configuração do TypeScript, ESLint, workflows e
documentação. Configurações globais melhoram a experiência local, mas não podem
ser requisito oculto para build, teste ou deploy.

O `package-lock.json` deve acompanhar mudanças aprovadas de dependências.
Instalações automatizadas e CI devem usar `npm ci`.

## 4. Ambiente de desenvolvimento

### Visual Studio Code

Use somente o canal Stable. Recursos Insiders, Preview, Beta, experimentais ou
controlados por feature flag permanecem desabilitados até sua estabilização
oficial.

Extensões devem:

- resolver uma necessidade prática não atendida pelas ferramentas existentes;
- vir de publicador oficial, verificado ou tecnicamente avaliado;
- estar em versão estável, mantida e compatível;
- evitar sobreposição com extensões já aprovadas.

O perfil global deve concentrar preferências pessoais e padrões amplamente
aplicáveis. A pasta `.vscode` de cada projeto deve conter somente configurações
indispensáveis e recomendações aprovadas em `extensions.json`.

### Node.js e npm

Use uma versão do Node.js permitida pelo campo `engines` do projeto, com
preferência por uma linha LTS suportada. A versão do npm deve ser compatível
com o runtime e o lockfile. Mudanças de versão exigem execução completa dos
gates do projeto.

Não contorne avisos de engine, não execute correções automáticas de auditoria
que introduzam versões incompatíveis e não publique segredos em arquivos
`.env`. Variáveis necessárias devem ser descritas em `.env.example` sem
valores sensíveis.

### TypeScript e ESLint

TypeScript deve operar no modo configurado pelo projeto, sem desabilitar
verificações apenas para silenciar erros. ESLint é o gate estático oficial e
sua configuração versionada prevalece sobre preferências locais.

Formatação não pode alterar semântica nem substituir as verificações de lint e
tipos. Supressões exigem justificativa localizada e verificável.

### Git e GitHub

Commits devem ser coesos, revisáveis e livres de arquivos gerados, credenciais
e alterações incidentais. Branches protegidas e pull requests devem executar
os gates definidos pelo projeto.

Mudanças relevantes devem manter vínculo com requisito, risco, issue ou decisão
arquitetural. Não reescreva histórico compartilhado sem autorização explícita.

### Vercel

Deploys devem partir do repositório e do workflow aprovados. Configurações e
variáveis devem respeitar a separação entre desenvolvimento, preview e
produção. Mudanças de runtime, domínio, cache ou ambiente exigem validação em
Preview antes da promoção para produção.

## 5. Atualizações e dependências

Antes de atualizar IDE, runtime, framework, ferramenta ou dependência:

1. revisar notas oficiais, compatibilidade e avisos de segurança;
2. identificar mudanças descontinuadas ou incompatíveis;
3. limitar a atualização ao menor conjunto coerente;
4. executar lint, typecheck, testes e build aplicáveis;
5. atualizar inventários, ADRs e documentação quando necessário.

Atualizações automáticas são aceitáveis para o VS Code Stable e extensões
aprovadas. Dependências do projeto não devem ser atualizadas automaticamente
sem revisão do diff e validação.

## 6. Configuração global e por projeto

A configuração global pode definir ergonomia, segurança da IDE, atualização do
canal Stable, Git e comportamento padrão do editor. Tudo que afeta o resultado
do software deve permanecer versionado no repositório.

Não duplique localmente uma configuração global sem necessidade de
reprodutibilidade. Não dependa de configuração global quando CI ou outro
desenvolvedor precisar reproduzir o comportamento.

## 7. Uso de inteligência artificial

Ferramentas de IA são auxiliares de engenharia e não substituem revisão,
validação ou responsabilidade humana. Agentes devem seguir o `AGENTS.md`,
trabalhar com o menor acesso necessário e nunca receber segredos ou dados
pessoais desnecessários.

Código e documentação gerados por IA devem ser revisados quanto a correção,
segurança, licenciamento, compatibilidade e aderência ao HKA FIELD. Toda ação
externa irreversível ou de produção exige autorização explícita.

## 8. Qualidade e documentação

Os gates mínimos são os declarados pelo projeto. Falhas não devem ser ignoradas
nem classificadas como preexistentes sem evidência. Alterações funcionais,
operacionais ou arquiteturais devem atualizar a documentação correspondente.

Documentos devem possuir finalidade clara, evitar duplicação e usar links
relativos. O guia HKA FIELD governa o método; esta política governa o ambiente;
ADRs registram decisões; roadmaps organizam evolução; documentos operacionais
registram o estado do projeto.

## 9. Manutenção contínua

Em revisões periódicas:

- verificar suporte e segurança das versões utilizadas;
- revisar extensões, dependências e permissões;
- remover configurações e recursos descontinuados;
- confirmar que CI representa o ambiente de produção;
- revisar exceções e riscos aceitos;
- preservar compatibilidade entre projetos sem impedir requisitos específicos.

Exceções a esta política devem registrar justificativa, impacto, responsável,
prazo e condição de encerramento.
