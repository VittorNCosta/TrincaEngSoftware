/* Classificação compartilhada pelo painel, pelo markdown e pelas issues.
 * Heurística de escopo/risco, não benchmark nem histórico do modelo executor.
 * Referência: https://developers.openai.com/api/docs/models (15/09/2026).
 */
(function (root) {
  const CODEX_MODEL_INFO = {
    luna: {
      id: 'gpt-5.6-luna',
      display: 'GPT-5.6 Luna',
      label: 'modelo-codex-luna',
      color: '6B7280',
    },
    terra: {
      id: 'gpt-5.6-terra',
      display: 'GPT-5.6 Terra',
      label: 'modelo-codex-terra',
      color: '1B7FBD',
    },
    sol: {
      id: 'gpt-5.6-sol',
      display: 'GPT-5.6 Sol',
      label: 'modelo-codex-sol',
      color: '5A32A3',
    },
  };
  // Prioridade de entrega não mede complexidade: branch, pasta e comentário
  // podem ser P0 e ainda ser mecânicos. Refactors de save podem ser P2 e arriscados.
  const LUNA_IDS = new Set([
    'F0-06',
    'C-08b',
    'C-16',
    'C-28',
    'C-29',
    'A-02',
    'A-34',
    'A-35',
    'L-07',
    'L-09',
    'L-10',
    'L-15',
    'G-01',
    'G-07',
    'G-11',
    'G-12',
    'G-13',
    'G-14',
    'G-15',
    'G-17',
    'CI-02',
    'CI-03',
    'CI-10',
    'CI-27',
    'O-06',
  ]);
  const SOL_IDS = new Set([
    'C-02',
    'C-03',
    'C-06',
    'C-07',
    'C-11',
    'C-12',
    'C-25',
    'C-26',
    'L-16',
    'G-08',
    'G-18',
    'G-19',
    'G-20',
    'CI-04',
    'CI-18',
    'CI-19',
    'CI-21',
    'CI-22',
    'CI-26',
    'CI-28',
    'Q-07',
    'Q-08',
    'Q-09',
    'Q-13',
    'O-02',
    'O-03',
    'O-05',
    'O-08',
    'O-09',
    'R-09',
    'R-16',
    'R-17',
  ]);
  const recomendarModeloCodex = ({ id, bloco, quem }) => {
    if (quem === 'voce')
      return {
        modelo: null,
        motivo:
          'Execução humana: decisão, conta, produção ou validação externa.',
      };
    if (SOL_IDS.has(id) || bloco === 'sec')
      return {
        modelo: 'sol',
        motivo:
          'Maior risco: regras, persistência, refactor amplo, segurança ou publicação.',
      };
    if (LUNA_IDS.has(id))
      return {
        modelo: 'luna',
        motivo: 'Mudança mecânica e delimitada, com critério de aceite direto.',
      };
    if (bloco === 'a' && quem === 'both')
      return {
        modelo: 'terra',
        motivo:
          'Preparar briefing e integrar arte; geração por ferramenta de imagem e validação humana.',
      };
    if (bloco === 's' && quem === 'both')
      return {
        modelo: 'terra',
        motivo:
          'Preparar especificação e integrar áudio; produção e escuta exigem ferramenta externa e humano.',
      };
    return {
      modelo: 'terra',
      motivo:
        'Implementação, conteúdo, configuração ou teste de complexidade moderada.',
    };
  };
  const api = { CODEX_MODEL_INFO, recomendarModeloCodex };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CodexModels = api;
})(globalThis);
