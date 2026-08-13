import { MatchRule } from './MatchRule';
import { RecyclingCycleMatchRule } from './RecyclingCycleMatchRule';
import { SameMaterialMatchRule } from './SameMaterialMatchRule';

export type MatchRuleId = 'recycling-cycle' | 'same-material';

export const MATCH_RULES: Record<MatchRuleId, MatchRule> = {
  'recycling-cycle': RecyclingCycleMatchRule,
  'same-material': SameMaterialMatchRule,
};

/**
 * Regra ativa do jogo. A versão ODS 12 roda no ciclo da reciclagem — é o que
 * dá sentido educativo à trinca. Trocar aqui troca o jogo inteiro, porque o
 * gerador de níveis também consulta a regra para distribuir as peças.
 */
export const DEFAULT_MATCH_RULE_ID: MatchRuleId = 'recycling-cycle';

export const getMatchRule = (ruleId: MatchRuleId = DEFAULT_MATCH_RULE_ID): MatchRule =>
  MATCH_RULES[ruleId] ?? MATCH_RULES[DEFAULT_MATCH_RULE_ID];

export const activeMatchRule: MatchRule = getMatchRule();
