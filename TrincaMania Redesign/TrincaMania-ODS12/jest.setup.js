/* global jest */
// Setup para a suíte de testes de componente (Jest + jest-expo).
//
// `jest` é o global injetado pelo test runner em tempo de execução — o
// comentário acima só evita falso positivo do `no-undef` do ESLint, que não
// conhece o ambiente Jest neste arquivo `.js` puro (o eslint.config.js do
// projeto não foi alterado para isso).
// AsyncStorage não tem módulo nativo disponível sob o Jest, então os
// componentes que passam por storage (Tray/BoardTile tocam som, ResultModal
// toca vidas/progresso) precisam do mock oficial do próprio pacote.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ResultModal usa <SafeAreaView> de react-native-safe-area-context sem um
// <SafeAreaProvider> próprio (quem provê isso é o App.tsx real). O mock
// oficial do pacote resolve os hooks/contexto com valores fixos em vez de
// lançar "No safe area value available".
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// `src/utils/sounds.ts` (usado por BoardTile e, via ChestOpeningModal, por
// ResultModal) faz patch síncrono em `AudioModule.AudioPlayer.prototype` só
// de importar 'expo-audio'. Sob o Jest, a classe nativa não existe e isso
// derruba o require com "Cannot read properties of undefined (reading
// 'prototype')" antes mesmo de qualquer som tocar — o mock automático do
// jest-expo não cobre essa API baseada em SharedObject/JSI. Substituímos o
// módulo inteiro por um stub mínimo o bastante para os métodos que
// `sounds.ts` chama (play/pause/seekTo/remove).
jest.mock('expo-audio', () => {
  const createFakePlayer = () => ({
    loop: false,
    playing: false,
    volume: 1,
    pause: jest.fn(),
    play: jest.fn(),
    remove: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  });

  return {
    createAudioPlayer: jest.fn(() => createFakePlayer()),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    setIsAudioActiveAsync: jest.fn(() => Promise.resolve()),
    useAudioPlayer: jest.fn(() => createFakePlayer()),
  };
});
