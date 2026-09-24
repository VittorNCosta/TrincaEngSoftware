/**
 * Conventional Commits (G-01/G-02).
 *
 * O histórico já seguia a convenção na prática — `feat:`, `chore:`, `docs:`.
 * Isto trava o que era hábito, para que o `release-please` possa versionar
 * lendo o log: sem tipo confiável na mensagem, não há como decidir entre
 * major, minor e patch.
 *
 * Os escopos são as fatias reais do projeto, não uma lista genérica. Escopo
 * segue opcional — obrigar em todo commit gera escopo inventado, que é pior
 * que nenhum.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        // Trilhas de conteúdo
        'campanha',
        'capitulos',
        'dominio',
        // Camadas
        'ui',
        'storage',
        'audio',
        'mapa',
        // Ferramenta e processo
        'ci',
        'deps',
        'roadmap',
        'testes',
      ],
    ],
    // Mensagens em português usam acento e nome próprio; travar caixa aqui só
    // gera commit com título artificial.
    'subject-case': [0],
    'body-max-line-length': [1, 'always', 100],
  },
};
