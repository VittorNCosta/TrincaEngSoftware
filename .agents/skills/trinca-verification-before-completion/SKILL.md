---
name: trinca-verification-before-completion
description: Verificar mudanças relevantes no TrincaMania antes de declarar conclusão, escolhendo evidências conforme o escopo.
---

# trinca-verification-before-completion

Leia os scripts atuais do package.json do aplicativo e o CI. Para lógica, execute teste dirigido e npm test; para componente interativo, npm run test:ui -- --runInBand; TypeScript exige npm run typecheck. Mudanças de geração/progressão podem exigir npm run test:playthrough. Para scripts execute cenários de sucesso/falha sem mutações remotas; para documentação confira links e formatação, sem impor TDD. Execute verificações aplicáveis após a última alteração e inspecione exit code e saída. Não confunda simulação automatizada com validação manual Android/iOS. No relatório final informe comandos, resultados, falhas e checks não executados, sem alegar conclusão com base apenas em intenção. Não inicie outras skills nem peça aprovação repetida para ajustes já autorizados.

Adaptação de obra/superpowers, commit `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`, licença MIT. Origem e avisos: [guia](../../../TrincaMania%20Redesign/TrincaMania-ODS12/docs/AGENTES-CODEX.md).
