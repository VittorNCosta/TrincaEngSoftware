/**
 * Value Object: tipo de material reciclável.
 *
 * As cores seguem a resolução CONAMA 275/2001, que padroniza o código de cores
 * da coleta seletiva no Brasil. Isso não é decoração: é o conteúdo que o jogo
 * ensina (ODS 12 — Consumo e Produção Responsáveis).
 */
export type MaterialType =
  'plastico' | 'papel' | 'vidro' | 'metal' | 'organico';

export type MaterialDefinition = {
  /** Cor oficial da lixeira segundo a CONAMA 275/2001. */
  binColor: string;
  binColorDark: string;
  binColorLight: string;
  /** Emoji do quadrado colorido, usado como fallback textual. */
  binEmoji: string;
  id: MaterialType;
  /** Nome da cor por extenso — usado no tutorial e nos modais educativos. */
  colorName: string;
  label: string;
  /** Frase curta de ODS 12 exibida ao fechar a trinca. */
  fact: string;
};

export const MATERIALS: Record<MaterialType, MaterialDefinition> = {
  plastico: {
    binColor: '#D6321E',
    binColorDark: '#9C1F10',
    binColorLight: '#F26A57',
    binEmoji: '\u{1F7E5}',
    id: 'plastico',
    colorName: 'vermelha',
    label: 'Plástico',
    fact: 'Uma garrafa PET leva até 400 anos para se decompor na natureza.',
  },
  papel: {
    binColor: '#0B5FBF',
    binColorDark: '#06407F',
    binColorLight: '#4A93E0',
    binEmoji: '\u{1F7E6}',
    id: 'papel',
    colorName: 'azul',
    label: 'Papel',
    fact: 'Reciclar 1 tonelada de papel evita o corte de cerca de 20 árvores.',
  },
  vidro: {
    binColor: '#1E9E4A',
    binColorDark: '#136B31',
    binColorLight: '#5CCB84',
    binEmoji: '\u{1F7E9}',
    id: 'vidro',
    colorName: 'verde',
    label: 'Vidro',
    fact: 'O vidro é 100% reciclável e pode ser reciclado infinitas vezes.',
  },
  metal: {
    binColor: '#F2B705',
    binColorDark: '#B08403',
    binColorLight: '#FFD65C',
    binEmoji: '\u{1F7E8}',
    id: 'metal',
    colorName: 'amarela',
    label: 'Metal',
    fact: 'Reciclar alumínio economiza até 95% da energia da produção primária.',
  },
  organico: {
    binColor: '#7A4A21',
    binColorDark: '#553112',
    binColorLight: '#A97544',
    binEmoji: '\u{1F7EB}',
    id: 'organico',
    colorName: 'marrom',
    label: 'Orgânico',
    fact: 'Restos de comida viram adubo pela compostagem, e não lixo.',
  },
};

export const MATERIAL_TYPES: MaterialType[] = [
  'plastico',
  'papel',
  'vidro',
  'metal',
  'organico',
];

export const isMaterialType = (value: string): value is MaterialType =>
  MATERIAL_TYPES.includes(value as MaterialType);

export const getMaterial = (material: MaterialType): MaterialDefinition =>
  MATERIALS[material];
