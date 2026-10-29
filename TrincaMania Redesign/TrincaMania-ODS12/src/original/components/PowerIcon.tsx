import { RedesignedIcon } from '../../components/RedesignedIcon';

import { PowerUpType } from '../../types/game';
import { ForestObjectIcon } from './ForestObjectIcon';

export type PowerIconName = PowerUpType | 'star';

type PowerIconProps = {
  name: PowerIconName;
  size?: number;
  fill?: string;
  outline?: string;
};

/** Bold silhouettes and small painted highlights remain readable at HUD size. */
export function PowerIcon({ name, size = 64, fill, outline }: PowerIconProps) {
  if (name !== 'star') {
    return (
      <ForestObjectIcon name={name} size={size} muted={outline !== undefined} />
    );
  }
  return (
    <RedesignedIcon
      family="PODERES"
      name="estrela-poder"
      size={size}
      fill={fill}
      outline={outline}
    />
  );
}
