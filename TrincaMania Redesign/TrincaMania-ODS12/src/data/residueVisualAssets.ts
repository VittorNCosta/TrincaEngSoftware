import type { ImageSourcePropType } from 'react-native';
import {
  getCardById,
  getCardsFor,
} from '../domain/recycling/value-objects/RecyclingCard';
import type { MaterialType } from '../domain/recycling/value-objects/MaterialType';
import type { WorldId } from '../types/game';
import { getVisualWorldId } from './worldVisualAssets';

type ResidueVisual = { image: ImageSourcePropType; label: string };
const RESIDUE_VISUALS: Record<
  number,
  Partial<Record<MaterialType, ResidueVisual[]>>
> = {
  1: {
    plastico: [
      {
        image: require('../../assets/residuos/w01_01_garrafa_pet.png'),
        label: 'Garrafa pet',
      },
      {
        image: require('../../assets/residuos/w01_02_copo_plastico.png'),
        label: 'Copo plastico',
      },
      {
        image: require('../../assets/residuos/w01_03_sacola.png'),
        label: 'Sacola',
      },
    ],
    papel: [
      {
        image: require('../../assets/residuos/w01_04_jornal.png'),
        label: 'Jornal',
      },
      {
        image: require('../../assets/residuos/w01_05_caixa_papelao.png'),
        label: 'Caixa papelao',
      },
      {
        image: require('../../assets/residuos/w01_06_folha_amassada.png'),
        label: 'Folha amassada',
      },
    ],
    metal: [
      {
        image: require('../../assets/residuos/w01_07_lata_bebida.png'),
        label: 'Lata bebida',
      },
      {
        image: require('../../assets/residuos/w01_08_lata_conserva.png'),
        label: 'Lata conserva',
      },
      {
        image: require('../../assets/residuos/w01_09_tampa_metal.png'),
        label: 'Tampa metal',
      },
    ],
  },
  2: {
    plastico: [
      {
        image: require('../../assets/residuos/w02_01_frasco_detergente.png'),
        label: 'Frasco detergente',
      },
      {
        image: require('../../assets/residuos/w02_02_pote_plastico.png'),
        label: 'Pote plastico',
      },
      {
        image: require('../../assets/residuos/w02_03_embalagem_plastica.png'),
        label: 'Embalagem plastica',
      },
    ],
    papel: [
      {
        image: require('../../assets/residuos/w02_04_caixa_cereal.png'),
        label: 'Caixa cereal',
      },
      {
        image: require('../../assets/residuos/w02_05_tubo_papelao.png'),
        label: 'Tubo papelao',
      },
      {
        image: require('../../assets/residuos/w02_06_saco_papel.png'),
        label: 'Saco papel',
      },
    ],
    vidro: [
      {
        image: require('../../assets/residuos/w02_07_garrafa_vidro.png'),
        label: 'Garrafa vidro',
      },
      {
        image: require('../../assets/residuos/w02_08_pote_vidro.png'),
        label: 'Pote vidro',
      },
      {
        image: require('../../assets/residuos/w02_09_copo_vidro.png'),
        label: 'Copo vidro',
      },
    ],
  },
  3: {
    metal: [
      {
        image: require('../../assets/residuos/w03_01_chapa_metal.png'),
        label: 'Chapa metal',
      },
      {
        image: require('../../assets/residuos/w03_02_cano_metal.png'),
        label: 'Cano metal',
      },
      {
        image: require('../../assets/residuos/w03_03_engrenagem.png'),
        label: 'Engrenagem',
      },
    ],
    papel: [
      {
        image: require('../../assets/residuos/w03_04_papelao_dobrado.png'),
        label: 'Papelao dobrado',
      },
      {
        image: require('../../assets/residuos/w03_05_revista.png'),
        label: 'Revista',
      },
      {
        image: require('../../assets/residuos/w03_06_caixa_ovos_papelao.png'),
        label: 'Caixa ovos papelao',
      },
    ],
    plastico: [
      {
        image: require('../../assets/residuos/w03_07_bandeja_plastica.png'),
        label: 'Bandeja plastica',
      },
      {
        image: require('../../assets/residuos/w03_08_balde_plastico.png'),
        label: 'Balde plastico',
      },
      {
        image: require('../../assets/residuos/w03_09_tampa_plastica.png'),
        label: 'Tampa plastica',
      },
    ],
  },
  4: {
    plastico: [
      {
        image: require('../../assets/residuos/w04_01_garrafa_cortada.png'),
        label: 'Garrafa cortada',
      },
      {
        image: require('../../assets/residuos/w04_02_vaso_plastico_quebrado.png'),
        label: 'Vaso plastico quebrado',
      },
      {
        image: require('../../assets/residuos/w04_03_regador_plastico_quebrado.png'),
        label: 'Regador plastico quebrado',
      },
    ],
    metal: [
      {
        image: require('../../assets/residuos/w04_04_lata_tinta_vazia.png'),
        label: 'Lata tinta vazia',
      },
      {
        image: require('../../assets/residuos/w04_05_lata_plantio_vazia.png'),
        label: 'Lata plantio vazia',
      },
      {
        image: require('../../assets/residuos/w04_06_balde_metal.png'),
        label: 'Balde metal',
      },
    ],
    papel: [
      {
        image: require('../../assets/residuos/w04_07_tubete_papelao.png'),
        label: 'Tubete papelao',
      },
      {
        image: require('../../assets/residuos/w04_08_caixa_mudas_papelao.png'),
        label: 'Caixa mudas papelao',
      },
      {
        image: require('../../assets/residuos/w04_09_saco_papel_rasgado.png'),
        label: 'Saco papel rasgado',
      },
    ],
  },
  5: {
    organico: [
      {
        image: require('../../assets/residuos/w05_01_folhas_secas.png'),
        label: 'Folhas secas',
      },
      {
        image: require('../../assets/residuos/w05_02_gravetos.png'),
        label: 'Gravetos',
      },
      {
        image: require('../../assets/residuos/w05_03_borra_cafe_filtro.png'),
        label: 'Borra cafe filtro',
      },
    ],
    papel: [
      {
        image: require('../../assets/residuos/w05_04_papelao_picado.png'),
        label: 'Papelao picado',
      },
      {
        image: require('../../assets/residuos/w05_05_saco_kraft.png'),
        label: 'Saco kraft',
      },
      {
        image: require('../../assets/residuos/w05_06_rolo_papel.png'),
        label: 'Rolo papel',
      },
    ],
    metal: [
      {
        image: require('../../assets/residuos/w05_07_balde_metal_amassado.png'),
        label: 'Balde metal amassado',
      },
      {
        image: require('../../assets/residuos/w05_08_peneira_metal_quebrada.png'),
        label: 'Peneira metal quebrada',
      },
      {
        image: require('../../assets/residuos/w05_09_tambor_metal.png'),
        label: 'Tambor metal',
      },
    ],
  },
  6: {
    plastico: [
      {
        image: require('../../assets/residuos/w06_01_galao_plastico.png'),
        label: 'Galao plastico',
      },
      {
        image: require('../../assets/residuos/w06_02_cesta_plastica_quebrada.png'),
        label: 'Cesta plastica quebrada',
      },
      {
        image: require('../../assets/residuos/w06_03_pote_margarina.png'),
        label: 'Pote margarina',
      },
    ],
    papel: [
      {
        image: require('../../assets/residuos/w06_04_caixa_entrega.png'),
        label: 'Caixa entrega',
      },
      {
        image: require('../../assets/residuos/w06_05_pilha_papeis.png'),
        label: 'Pilha papeis',
      },
      {
        image: require('../../assets/residuos/w06_06_cartela_papelao.png'),
        label: 'Cartela papelao',
      },
    ],
    metal: [
      {
        image: require('../../assets/residuos/w06_07_lata_oleo.png'),
        label: 'Lata oleo',
      },
      {
        image: require('../../assets/residuos/w06_08_panela_velha.png'),
        label: 'Panela velha',
      },
      {
        image: require('../../assets/residuos/w06_09_arame_enrolado.png'),
        label: 'Arame enrolado',
      },
    ],
  },
  7: {
    plastico: [
      {
        image: require('../../assets/residuos/w07_01_engradado_plastico.png'),
        label: 'Engradado plastico',
      },
      {
        image: require('../../assets/residuos/w07_02_frasco_shampoo.png'),
        label: 'Frasco shampoo',
      },
      {
        image: require('../../assets/residuos/w07_03_embalagem_refil.png'),
        label: 'Embalagem refil',
      },
    ],
    vidro: [
      {
        image: require('../../assets/residuos/w07_04_garrafa_retornavel.png'),
        label: 'Garrafa retornavel',
      },
      {
        image: require('../../assets/residuos/w07_05_pote_conserva.png'),
        label: 'Pote conserva',
      },
      {
        image: require('../../assets/residuos/w07_06_frasco_vidro.png'),
        label: 'Frasco vidro',
      },
    ],
    metal: [
      {
        image: require('../../assets/residuos/w07_07_lata_aerosol_vazia.png'),
        label: 'Lata aerosol vazia',
      },
      {
        image: require('../../assets/residuos/w07_08_caixa_metal.png'),
        label: 'Caixa metal',
      },
      {
        image: require('../../assets/residuos/w07_09_tambor_pequeno.png'),
        label: 'Tambor pequeno',
      },
    ],
  },
  8: {
    papel: [
      {
        image: require('../../assets/residuos/w08_01_folheto.png'),
        label: 'Folheto',
      },
      {
        image: require('../../assets/residuos/w08_02_envelope.png'),
        label: 'Envelope',
      },
      {
        image: require('../../assets/residuos/w08_03_pasta_papelao.png'),
        label: 'Pasta papelao',
      },
    ],
    plastico: [
      {
        image: require('../../assets/residuos/w08_04_copo_descartavel.png'),
        label: 'Copo descartavel',
      },
      {
        image: require('../../assets/residuos/w08_05_garrafa_agua.png'),
        label: 'Garrafa agua',
      },
      {
        image: require('../../assets/residuos/w08_06_tampa_copo.png'),
        label: 'Tampa copo',
      },
    ],
    vidro: [
      {
        image: require('../../assets/residuos/w08_07_garrafa_suco_vidro.png'),
        label: 'Garrafa suco vidro',
      },
      {
        image: require('../../assets/residuos/w08_08_copo_vidro_lascado.png'),
        label: 'Copo vidro lascado',
      },
      {
        image: require('../../assets/residuos/w08_09_pote_vidro_baixo.png'),
        label: 'Pote vidro baixo',
      },
    ],
  },
  9: {
    metal: [
      {
        image: require('../../assets/residuos/w09_01_porca_metal.png'),
        label: 'Porca metal',
      },
      {
        image: require('../../assets/residuos/w09_02_parafuso_metal.png'),
        label: 'Parafuso metal',
      },
      {
        image: require('../../assets/residuos/w09_03_mola_metal.png'),
        label: 'Mola metal',
      },
    ],
    plastico: [
      {
        image: require('../../assets/residuos/w09_04_tubo_plastico.png'),
        label: 'Tubo plastico',
      },
      {
        image: require('../../assets/residuos/w09_05_peca_plastica.png'),
        label: 'Peca plastica',
      },
      {
        image: require('../../assets/residuos/w09_06_carretel_plastico.png'),
        label: 'Carretel plastico',
      },
    ],
    vidro: [
      {
        image: require('../../assets/residuos/w09_07_caco_vidro.png'),
        label: 'Caco vidro',
      },
      {
        image: require('../../assets/residuos/w09_08_placa_vidro.png'),
        label: 'Placa vidro',
      },
      {
        image: require('../../assets/residuos/w09_09_frasco_vidro_quebrado.png'),
        label: 'Frasco vidro quebrado',
      },
    ],
  },
  10: {
    papel: [
      {
        image: require('../../assets/residuos/w10_01_programa_papel.png'),
        label: 'Programa papel',
      },
      {
        image: require('../../assets/residuos/w10_02_cracha_papel.png'),
        label: 'Cracha papel',
      },
      {
        image: require('../../assets/residuos/w10_03_caixa_documentos.png'),
        label: 'Caixa documentos',
      },
    ],
    plastico: [
      {
        image: require('../../assets/residuos/w10_04_garrafa_plastica_amassada.png'),
        label: 'Garrafa plastica amassada',
      },
      {
        image: require('../../assets/residuos/w10_05_bandeja_embalagem.png'),
        label: 'Bandeja embalagem',
      },
      {
        image: require('../../assets/residuos/w10_06_sacola_embalagem.png'),
        label: 'Sacola embalagem',
      },
    ],
    metal: [
      {
        image: require('../../assets/residuos/w10_07_lata_bebida_amassada.png'),
        label: 'Lata bebida amassada',
      },
      {
        image: require('../../assets/residuos/w10_08_tampa_rosca_metal.png'),
        label: 'Tampa rosca metal',
      },
      {
        image: require('../../assets/residuos/w10_09_recipiente_aluminio.png'),
        label: 'Recipiente aluminio',
      },
    ],
  },
};

const FALLBACK_WORLD: Record<MaterialType, number> = {
  plastico: 1,
  papel: 1,
  metal: 1,
  vidro: 2,
  organico: 5,
};

export const getResidueVisual = (
  cardId: string | undefined,
  worldId: WorldId,
): ResidueVisual | undefined => {
  const card = cardId ? getCardById(cardId) : undefined;
  if (!card || card.role !== 'residuo') return undefined;
  const pool =
    RESIDUE_VISUALS[getVisualWorldId(worldId)]?.[card.material] ??
    RESIDUE_VISUALS[FALLBACK_WORLD[card.material]][card.material];
  const variants = getCardsFor(card.material, 'residuo');
  const index = Math.max(
    0,
    variants.findIndex((entry) => entry.id === card.id),
  );
  return pool?.[index % pool.length];
};
