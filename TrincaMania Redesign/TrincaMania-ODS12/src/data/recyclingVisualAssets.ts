import { ImageSourcePropType } from 'react-native';
import { MaterialType } from '../domain/recycling/value-objects/MaterialType';

export const RECYCLING_ASSETS: Record<
  MaterialType,
  { lixeira: ImageSourcePropType; simbolo: ImageSourcePropType }
> = {
  plastico: {
    lixeira: require('../../assets/ui/recycling/lixeira-plastico.png'),
    simbolo: require('../../assets/ui/recycling/simbolo-plastico.png'),
  },
  papel: {
    lixeira: require('../../assets/ui/recycling/lixeira-papel.png'),
    simbolo: require('../../assets/ui/recycling/simbolo-papel.png'),
  },
  vidro: {
    lixeira: require('../../assets/ui/recycling/lixeira-vidro.png'),
    simbolo: require('../../assets/ui/recycling/simbolo-vidro.png'),
  },
  metal: {
    lixeira: require('../../assets/ui/recycling/lixeira-metal.png'),
    simbolo: require('../../assets/ui/recycling/simbolo-metal.png'),
  },
  organico: {
    lixeira: require('../../assets/ui/recycling/lixeira-organico.png'),
    simbolo: require('../../assets/ui/recycling/simbolo-organico.png'),
  },
};
