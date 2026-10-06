import { createContext } from 'react';
import type { WorldId } from '../types/game';

// Mantém a mesma arte no tabuleiro, bandeja e animações da partida.
export const WorldArtContext = createContext<WorldId>(1);
