---
name: trinca-systematic-debugging
description: Investigar bugs reproduzíveis ou falhas de teste do TrincaMania; não usar para perguntas gerais ou mudanças documentais.
---

# trinca-systematic-debugging

Registre entrada, resultado esperado/observado e comando de reprodução. Investigue o caminho de dados e mudanças recentes antes de propor correção; formule uma hipótese por vez com evidência no código. Teste a hipótese, faça a menor correção autorizada e adicione teste de regressão quando ele representar comportamento real. Prove falha antes e sucesso depois em checkout/worktree isolado, sem reverter arquivos compartilhados. Se não reproduzir, relate a lacuna e os dados necessários. Use os runners e invariantes de AGENTS.md; não exponha segredos em diagnóstico.

Adaptação de obra/superpowers, commit `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`, licença MIT. Origem e avisos: [guia](../../../TrincaMania%20Redesign/TrincaMania-ODS12/docs/AGENTES-CODEX.md).
