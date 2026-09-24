# Agentes e skills locais

Leia [AGENTS.md](../../../AGENTS.md) da raiz, inclusive quando iniciar na pasta do aplicativo. Claude usa [CLAUDE.md](../CLAUDE.md). Nenhum hook, configuração global ou dependência de runtime foi adicionado.

Os três perfis em `.codex/agents/*.toml` na raiz separam implementação (`react-native-engineer`), testes/investigação (`qa-engineer`) e revisão (`code-reviewer`). Omitem modelo/esforço para herdar a sessão. Exemplo: “Use code-reviewer para revisar o diff HEAD~1..HEAD; somente leitura”. Para implementação: “Use react-native-engineer apenas em src/components/X.tsx; QA pode editar tests/X.test.tsx”. Defina arquivos disjuntos; se houver sobreposição, execute sequencialmente.

O reviewer declara `sandbox_mode = "read-only"` e proíbe comandos que escrevam. As permissões efetivas e ferramentas dependem do cliente e da sessão; TOML não substitui a verificação da política efetiva. Não execute runners com cache dentro da revisão somente leitura.

As skills `.agents/skills/trinca-systematic-debugging` e `trinca-verification-before-completion` são locais ao repositório. Exemplos: “Use $trinca-systematic-debugging para reproduzir este bug” e “Use $trinca-verification-before-completion para conferir esta mudança”. Não instalam OMX nem encadeiam outras skills.

Para desativar, mova os três TOMLs para fora de `.codex/agents` e as duas pastas para fora de `.agents/skills`, e abra nova sessão. Isso preserva hooks Claude e configurações pessoais. Descoberta/invocação real deve ser conferida no cliente; validação de sintaxe sozinha não comprova uso.

## Origem

Instruções adaptadas apenas dos perfis reviewer, typescript-pro e mobile-developer de [VoltAgent](https://github.com/VoltAgent/awesome-codex-subagents/tree/70d930a14f58f06d00abdd854ebce82a52a7d857), commit `70d930a14f58f06d00abdd854ebce82a52a7d857`. [Licença MIT e aviso](licenses/awesome-codex-subagents-LICENSE.txt).

Skills adaptadas de systematic-debugging e verification-before-completion de [Superpowers](https://github.com/obra/superpowers/tree/b36e0829c6d0140e93cfef2ca599b1b07d4a7797), commit `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`. [Licença MIT e aviso](licenses/superpowers-LICENSE.txt).

Formato conferido na [documentação oficial de subagentes](https://learn.chatgpt.com/docs/agent-configuration/subagents) e [skills](https://learn.chatgpt.com/docs/build-skills), em 18/09/2026.

CI-29 revisou os seis arquivos `.claude/agents/*.md`, CLAUDE.md, package.json e ci.yml; invariantes conferidas em App.tsx/useProgressPersistence.ts, livesStorage.ts, chapters.ts e levelComposition.test.cjs. Após a atualização do toolchain nesta sessão, o Node exigido é >=22.13.0 <23, com CI em 22.23.2; domínio, componentes e playthrough são verificações distintas. Os hooks e registro de estado existentes permanecem no fluxo.
