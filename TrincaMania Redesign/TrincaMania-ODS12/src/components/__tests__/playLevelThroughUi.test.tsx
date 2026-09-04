import { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { GameBoard } from '../GameBoard';
import { Tray } from '../Tray';
import {
  countRemainingTiles,
  getPlayableTiles,
  revealAvailableMysteryTiles,
} from '../../domain/recycling/services/BoardService';
import { playTile } from '../../domain/recycling/services/PlayService';
import { activeMatchRule } from '../../domain/recycling/policies/MatchRuleRegistry';
import { generatePlayableLevel } from '../../utils/levelGenerator';
import {
  createSeededRandom,
  stableHash,
} from '../../utils/deterministicRandom';
import { BASE_TRAY_CAPACITY } from '../../storage/trayBoostStorage';
import { Level, Tile } from '../../types/game';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { criarJogador } = require('../../../tests/lib/solver.cjs');

/**
 * Uma fase jogada do começo ao fim **pela interface**.
 *
 * ## O que isto cobre que os outros não cobrem
 *
 * `tests/simulateFullPlaythrough.cjs` prova que todo tabuleiro fecha, mas
 * chamando `playTile` direto: se a tela nunca oferecesse a peça certa para
 * tocar, ele passaria igual. `tests/campaignProgression.test.cjs` prova que a
 * carreira é atravessável, mas sem renderizar nada. Os smoke tests de
 * componente provam que cada peça aparece, não que dá para vencer com elas.
 *
 * Aqui o toque é de verdade: `fireEvent.press` num `Pressable` que o
 * `GameBoard` renderizou, e a partida só avança se a tela tiver colocado
 * aquela peça na árvore, habilitada e não bloqueada. Isso pega uma classe de
 * defeito que nenhum dos outros pega — a de tabuleiro válido que a tela torna
 * injogável, porque o `isTileBlocked` do `GameBoard` discorda do
 * `getPlayableTiles` do domínio, ou porque o `onPress` perdeu o id no caminho.
 *
 * ## Por que uma fase e não as 103
 *
 * Renderizar árvore React é ordens de grandeza mais caro que rodar a regra, e a
 * pergunta "este tabuleiro fecha?" já tem dono. O que se verifica aqui é a
 * fiação entre domínio e apresentação, que é a mesma nas 103 — uma partida
 * completa exercita todos os estados que interessam (peça bloqueada liberando,
 * bandeja enchendo, trinca saindo, tabuleiro esvaziando).
 */

const jogador = criarJogador({
  countRemainingTiles,
  getPlayableTiles,
  playTile,
});

type PartidaProps = {
  capacity: number;
  level: Level;
  onChange: (estado: { board: Tile[]; status: string; tray: Tile[] }) => void;
};

/**
 * Miniatura do `GameScreen`: só o que liga toque a regra de jogo.
 *
 * O `GameScreen` de verdade tem ~3000 linhas de navegação, som, storage e
 * animação (é o Q-07 do roadmap). Renderizá-lo inteiro aqui mediria aquilo,
 * não isto — e a fiação que este teste quer verificar, `GameBoard` →
 * `onTilePress` → `playTile` → novo tabuleiro, é a mesma nos dois.
 */
const Partida = ({ capacity, level, onChange }: PartidaProps) => {
  const [board, setBoard] = useState<Tile[]>(() =>
    revealAvailableMysteryTiles(
      level.tiles.map((tile) => ({ ...tile, removed: false })),
    ),
  );
  const [tray, setTray] = useState<Tile[]>([]);

  return (
    <>
      <GameBoard
        disabled={false}
        tiles={board}
        onTilePress={(tileId) => {
          const resultado = playTile(
            board,
            tray,
            tileId,
            capacity,
            activeMatchRule,
          );

          setBoard(resultado.board);
          setTray(resultado.tray);
          onChange({
            board: resultado.board,
            status: resultado.status,
            tray: resultado.tray,
          });
        }}
      />
      <Tray activeCapacity={capacity} tiles={tray} />
    </>
  );
};

describe('jogar uma fase pela interface', () => {
  it('vence w1-001 tocando peça por peça, e a tela oferece cada jogada do caminho', () => {
    const level = generatePlayableLevel('w1-001', {
      random: createSeededRandom(stableHash('ui-playthrough:w1-001')),
    });

    // O caminho vencedor é calculado antes de renderizar, pelo mesmo
    // solucionador da auditoria de tabuleiro. O teste não procura a jogada: ele
    // já sabe qual é e cobra que a tela permita fazê-la.
    const board = revealAvailableMysteryTiles(
      level.tiles.map((tile) => ({ ...tile, removed: false })),
    );
    const solucao = jogador.simulateLevel(
      level,
      board,
      BASE_TRAY_CAPACITY,
      activeMatchRule,
    );

    expect(solucao.solved).toBe(true);
    expect(solucao.path).toHaveLength(level.tiles.length);

    let ultimo = { board, status: 'playing', tray: [] as Tile[] };

    const { getByTestId, queryByTestId } = render(
      <Partida
        capacity={BASE_TRAY_CAPACITY}
        level={level}
        onChange={(estado) => {
          ultimo = estado;
        }}
      />,
    );

    solucao.path.forEach((tileId: string, jogada: number) => {
      // A peça do caminho tem que estar na tela na hora de jogá-la. Se sumiu
      // antes, a apresentação removeu peça que a regra ainda considera no
      // tabuleiro — e é melhor falhar aqui, dizendo qual jogada, do que no
      // `getByTestId` seguinte sem contexto nenhum.
      expect(queryByTestId(`board-tile-${tileId}`)).not.toBeNull();

      fireEvent.press(getByTestId(`board-tile-${tileId}`));

      expect(ultimo.status).not.toBe('lost');
      expect(ultimo.tray.length).toBeLessThanOrEqual(BASE_TRAY_CAPACITY);
      expect(countRemainingTiles(ultimo.board)).toBe(
        level.tiles.length - (jogada + 1),
      );
    });

    expect(ultimo.status).toBe('won');
    expect(ultimo.tray).toHaveLength(0);
    expect(countRemainingTiles(ultimo.board)).toBe(0);

    // Tabuleiro vencido não deixa peça na tela.
    level.tiles.forEach((tile) => {
      expect(queryByTestId(`board-tile-${tile.id}`)).toBeNull();
    });
  });

  it('peça bloqueada por outra em cima não responde ao toque', () => {
    const level = generatePlayableLevel('w1-005', {
      random: createSeededRandom(stableHash('ui-blocked:w1-005')),
    });
    const board = revealAvailableMysteryTiles(
      level.tiles.map((tile) => ({ ...tile, removed: false })),
    );

    const jogaveis = new Set(getPlayableTiles(board).map((tile) => tile.id));
    const bloqueada = board.find((tile) => !jogaveis.has(tile.id));

    // Se todo mundo estiver jogável nesta semente, não há o que verificar aqui
    // — mas num tabuleiro em camadas isso não acontece, e falhar essa premissa
    // em silêncio esconderia o teste inteiro.
    expect(bloqueada).toBeDefined();

    let toques = 0;

    const { getByTestId } = render(
      <Partida
        capacity={BASE_TRAY_CAPACITY}
        level={level}
        onChange={() => {
          toques += 1;
        }}
      />,
    );

    fireEvent.press(getByTestId(`board-tile-${bloqueada!.id}`));

    // O `onPress` do BoardTile intercepta o toque bloqueado antes de chamar
    // `onPress(tile.id)`: sacode, toca o som e volta. Nenhuma jogada acontece.
    expect(toques).toBe(0);
  });
});
