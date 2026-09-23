# Instruções para agentes

## Entrega de tarefas e issues

Ao concluir uma tarefa ou issue neste repositório:

1. Trabalhe em um branch próprio baseado na branch de destino atual; nunca faça push direto para `develop` ou `main`.
2. Revise o diff e os arquivos que serão publicados. Inclua apenas as mudanças da tarefa; deixe de fora arquivos locais, credenciais, cobertura e artefatos não relacionados.
3. Faça as verificações previstas pelas instruções do projeto e crie um commit com mensagem Conventional Commits.
4. Depois de concluir a implementação e as verificações, publique o branch em `origin` sem pedir confirmação adicional. O push inicia as verificações configuradas em `.github/workflows/ci.yml`.
5. Quando a sessão também autorizar a criação de pull requests, abra ou atualize um para `develop` e vincule a issue com `Closes #<n>`. A issue só deve ser considerada concluída depois do merge.

Se a tarefa estiver incompleta, bloqueada, ou as verificações falharem, não a apresente como concluída. Se não for possível publicar por conflito ou falha de autenticação, mantenha o commit local e informe o impedimento.
