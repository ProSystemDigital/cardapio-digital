# HKA FIELD ENGINEERING GUIDE

## High Knowledge Architecture Framework for Software Engineering

| Campo | Definição |
| --- | --- |
| Versão | 1.0 |
| Status | Oficial |
| Tipo | Framework reutilizável de engenharia de software |
| Aplicação | Produtos web e mobile, APIs, SaaS, sistemas corporativos, integrações e plataformas digitais |
| Idioma | Português (Brasil) |

---

## 1. Propósito

HKA FIELD (High Knowledge Architecture Framework) é um framework de engenharia para orientar a descoberta, construção, evolução e operação de software. Seu propósito é transformar requisitos em soluções sustentáveis, seguras, mensuráveis e preparadas para mudança.

O framework não prescreve uma tecnologia, uma arquitetura única ou uma estrutura organizacional fixa. Ele define princípios, controles, entregas e critérios de decisão que podem ser dimensionados ao risco e à complexidade de cada iniciativa.

## 2. Identidade HKA FIELD

HKA FIELD representa oito dimensões que devem ser avaliadas de forma integrada:

| Pilar | Significado | Foco de engenharia |
| --- | --- | --- |
| H | Hardware | Infraestrutura, capacidade, conectividade e recursos de execução. |
| K | Knowledge | Conhecimento compartilhado, documentação, aprendizado e decisões rastreáveis. |
| A | Architecture | Estrutura do sistema, limites, integrações, segurança e evolução. |
| F | Framework | Tecnologias, padrões, bibliotecas e convenções de desenvolvimento. |
| I | Integration | Contratos, APIs, eventos, dados e interoperabilidade entre sistemas. |
| E | Engineering | Qualidade, testes, práticas de entrega, confiabilidade e manutenção. |
| L | Logic | Regras de negócio, algoritmos, consistência e comportamento do produto. |
| D | Deployment | Automação, ambientes, observabilidade, operação e entrega contínua. |

Uma solução HKA FIELD não precisa investir igualmente em todos os pilares, mas deve explicitar quais são aplicáveis, os riscos de cada um e as decisões tomadas.

### Princípios

1. Compreender antes de alterar.
2. Decidir com evidências, alternativas e impactos explícitos.
3. Priorizar simplicidade, coesão e baixo acoplamento.
4. Incorporar segurança, qualidade e acessibilidade desde o início.
5. Automatizar verificações repetíveis e manter controle humano sobre decisões relevantes.
6. Projetar para evolução, observabilidade e reversão segura.

## 3. Adoção proporcional

O rigor aplicado deve ser proporcional ao risco:

| Nível | Uso típico | Exigência mínima |
| --- | --- | --- |
| Essencial | Protótipos, sites institucionais, pequenas automações | requisitos, revisão, build, segurança básica e documentação da entrega. |
| Recomendado | Produtos em evolução, APIs e aplicações com usuários | arquitetura registrada, testes relevantes, métricas, CI/CD e monitoramento básico. |
| Crítico | Dados sensíveis, alto volume, financeiro, saúde ou operação essencial | modelagem de ameaças, SLOs, observabilidade, contingência, auditoria e revisão especializada. |

Itens não aplicáveis devem ser registrados com justificativa; não devem ser simplesmente omitidos.

## 4. Papéis e perspectivas

Os papéis abaixo podem ser exercidos por uma ou mais pessoas. São perspectivas de análise, não uma exigência de equipe fixa.

| Perspectiva | Responsabilidade principal |
| --- | --- |
| Produto e requisitos | Valor, regras de negócio, priorização e critérios de aceite. |
| Arquitetura | Estrutura, integração, decisões técnicas e evolução. |
| Engenharia de software | Implementação, manutenção, revisão e qualidade interna. |
| Dados | Modelagem, integridade, desempenho, retenção e acesso. |
| UX/UI e acessibilidade | Jornadas, semântica, responsividade e inclusão. |
| Segurança e privacidade | Ameaças, segredos, controles de acesso e proteção de dados. |
| Plataforma/DevOps | Ambientes, automação, entrega, confiabilidade e observabilidade. |
| Especialistas de domínio | Qualidade nas tecnologias e regulações aplicáveis. |

## 5. Gestão de requisitos

Todo trabalho deve iniciar com entendimento verificável do problema. Requisitos devem ser mantidos em fonte rastreável e versionada quando aplicável.

### 5.1 Classificação

- **Funcionais:** comportamentos, fluxos e regras de negócio.
- **Não funcionais:** desempenho, segurança, disponibilidade, acessibilidade, compatibilidade e operação.
- **Restrições:** tecnologias, orçamento, prazo, integrações, legislação ou políticas.
- **Premissas e dependências:** fatos ainda não comprovados e elementos externos necessários.

### 5.2 Qualidade do requisito

Cada requisito deve ser claro, testável, necessário, viável, priorizado e rastreável. Quando houver incerteza, ela deve ser registrada como hipótese ou pergunta, nunca tratada como fato.

### 5.3 Critérios de aceite

Critérios de aceite devem descrever condições observáveis de sucesso, incluindo cenários normais, erros previsíveis e requisitos não funcionais relevantes. A rastreabilidade mínima é:

```text
Objetivo → requisito → decisão/implementação → validação → evidência de entrega
```

## 6. Ciclo de vida HKA FIELD

| Fase | Objetivo | Principais saídas | Critério de saída |
| --- | --- | --- | --- |
| 1. Descoberta | Entender contexto, objetivo e restrições | visão, requisitos iniciais, premissas e riscos | escopo compreendido e incertezas visíveis. |
| 2. Auditoria | Examinar estado atual e lacunas | diagnóstico técnico, inventário e priorização | riscos e dívida técnica classificados. |
| 3. Planejamento | Definir abordagem e sequência de trabalho | plano, estimativas, dependências e aceite | execução viável e prioridades alinhadas. |
| 4. Arquitetura | Escolher estrutura e contratos | diagrama proporcional, ADRs e estratégia de dados | decisões justificadas e impactos conhecidos. |
| 5. Desenvolvimento | Implementar mudanças com qualidade | código, testes, documentação e revisão | critérios técnicos atendidos. |
| 6. Validação | Confirmar valor e comportamento | evidências de teste, auditorias e métricas | requisitos e riscos aceitos. |
| 7. Entrega e evolução | Disponibilizar e operar com segurança | release, observabilidade, suporte e retrospectiva | operação acompanhada e conhecimento registrado. |

O processo é iterativo: descobertas em qualquer fase podem atualizar requisitos, planejamento ou arquitetura.

## 7. Arquitetura e decisões técnicas

Arquitetura deve separar responsabilidades, preservar limites de domínio e reduzir dependências desnecessárias. Decisões relevantes devem usar um ADR (Architecture Decision Record) contendo:

1. Contexto e problema;
2. Decisão tomada;
3. Alternativas consideradas;
4. Consequências, riscos e plano de reversão;
5. Data, responsável e estado da decisão.

Padrões como Clean Code, SOLID, DRY, KISS, separação de responsabilidades, composição e contratos explícitos devem orientar o código, sem transformar abstrações em complexidade gratuita.

## 8. Qualidade, testes e revisão

Qualidade é responsabilidade de toda a entrega. A estratégia de testes deve ser definida pelo risco e pelo tipo de solução:

- testes unitários para regras e componentes com comportamento relevante;
- testes de integração para contratos, persistência e serviços externos;
- testes ponta a ponta para jornadas críticas;
- validações estáticas: tipos, lint, formatação e análise de dependências;
- revisão humana para mudanças relevantes, segurança e decisões arquiteturais.

### Definition of Done

Uma entrega está concluída quando o requisito e os critérios de aceite foram atendidos, o impacto foi avaliado, as verificações automatizadas aplicáveis passaram, a documentação necessária foi atualizada e o plano de operação/reversão foi definido quando relevante.

## 9. Métricas de qualidade

Métricas são instrumentos de decisão, não metas isoladas. Cada produto deve definir baselines, metas e responsáveis conforme seu contexto.

| Dimensão | Exemplos de métrica | Uso esperado |
| --- | --- | --- |
| Confiabilidade | taxa de erro, falhas por release, MTTR, cumprimento de SLO | identificar regressões e melhorar recuperação. |
| Desempenho | LCP, INP, TTFB, latência p95/p99, tempo de carregamento | priorizar gargalos percebidos pelo usuário e pelo sistema. |
| Qualidade de código | cobertura relevante, falhas de lint/tipo, duplicação, complexidade | reduzir risco de manutenção; nunca usar cobertura isoladamente. |
| Segurança | vulnerabilidades abertas por severidade, idade de dependências, incidentes | reduzir exposição e acompanhar correções. |
| Entrega | frequência de deploy, lead time, taxa de falha de mudança | aperfeiçoar fluxo sem incentivar entregas imprudentes. |
| Experiência | sucesso de tarefa, acessibilidade, erros de formulário, satisfação | validar valor e inclusão. |

Métricas devem ter fonte de dados, periodicidade e ação definida para desvios relevantes.

## 10. Segurança, privacidade e dados

Segurança deve ser incorporada ao desenho e à operação:

- validar e normalizar entradas no limite do sistema;
- aplicar autenticação e autorização adequadas ao risco;
- nunca versionar segredos; utilizar gestão de configuração segura;
- limitar acesso a dados, registrar eventos relevantes e definir retenção;
- atualizar dependências e tratar vulnerabilidades conforme severidade;
- avaliar privacidade, base legal e requisitos regulatórios, incluindo LGPD quando aplicável.

Para funcionalidades sensíveis, realizar modelagem de ameaças e definir controles, evidências e plano de resposta a incidentes.

### 10.1 Privacidade e LGPD por padrão

Privacidade deve acompanhar a evolução do produto e ter o código como uma de suas fontes de evidência:

- toda nova coleta ou mudança de finalidade exige revisão da Política de Privacidade e do inventário de dados;
- toda nova integração que processe dados pessoais exige revisão do fluxo, do papel do fornecedor, da localização conhecida do processamento e dos documentos relacionados;
- bases legais devem ser definidas por finalidade; consentimento não deve ser usado quando outra hipótese legal for mais adequada;
- fornecedores, cookies, ferramentas de analytics, pixels e controles de segurança nunca devem ser declarados sem evidência;
- conformidade absoluta não deve ser afirmada sem avaliação jurídica e evidências operacionais suficientes;
- retenção e descarte devem possuir critério, responsável e revisão, sem prometer automação inexistente;
- documentação deve registrar somente informações verificáveis e permanecer sincronizada com o código;
- mudanças relevantes devem incluir revisão proporcional dos direitos dos titulares, transferências internacionais e medidas de segurança.

## 11. Performance, acessibilidade, SEO e PWA

Interfaces devem ser responsivas, semanticamente estruturadas e navegáveis por teclado e tecnologias assistivas. Otimizações devem ser guiadas por medições reais e incluir, quando aplicável, imagens adequadas, cache, divisão de código, renderização eficiente e limites de consumo de recursos.

Projetos públicos devem definir metadados, estrutura semântica, indexação e métricas de experiência. Projetos PWA devem validar manifest, ícones, service worker, estratégia de cache, atualização e comportamento offline — sem prometer offline quando o fluxo depende de serviços remotos.

## 12. Entrega, operação e evolução

O fluxo de entrega deve ser reproduzível e adequado ao risco. Preferir integração contínua para executar build, verificações estáticas, testes e análise de vulnerabilidades. Releases relevantes devem possuir estratégia de rollback, compatibilidade e comunicação.

Sistemas operados em produção devem ter observabilidade proporcional: logs úteis e protegidos, métricas, alertas acionáveis, monitoramento de disponibilidade e procedimentos de incidente.

## 13. Gestão de riscos

Riscos técnicos, operacionais, de segurança, de prazo e de dependência devem ser registrados com probabilidade, impacto, responsável, mitigação e gatilho de revisão. Riscos aceitos exigem decisão explícita do responsável apropriado.

## 14. Uso responsável de inteligência artificial

IA pode apoiar análise, implementação, testes, documentação e revisão. Seu uso não substitui a responsabilização humana. Antes de aceitar uma sugestão, é necessário verificar contexto, segurança, licenças, qualidade, aderência aos requisitos e ausência de dados sensíveis em ferramentas não autorizadas.

## 15. Comunicação de engenharia

Comunicações técnicas devem apresentar, em nível proporcional à mudança:

1. entendimento da solicitação;
2. análise e alternativas relevantes;
3. impactos, riscos e decisões;
4. plano ou mudança executada;
5. evidências de validação;
6. pendências e próximos passos, quando existirem.

## 16. Checklist reutilizável de entrega

- [ ] Requisitos e critérios de aceite estão claros e rastreáveis.
- [ ] Impactos em arquitetura, dados, segurança e operação foram avaliados.
- [ ] Código segue convenções, está tipado quando aplicável e foi revisado.
- [ ] Build, lint e testes aplicáveis foram executados com sucesso.
- [ ] Acessibilidade, responsividade e desempenho foram avaliados quando há interface.
- [ ] Segredos, dados pessoais e dependências foram tratados adequadamente.
- [ ] Documentação, ADRs, métricas e procedimentos foram atualizados quando necessários.
- [ ] Estratégia de deploy, monitoramento e rollback foi definida quando aplicável.

---

Este guia é um padrão vivo. Alterações devem ser versionadas, justificadas e revisadas para preservar sua aplicabilidade em diferentes produtos e contextos de engenharia.
