export type RoundTraySlotSnapshot = {
  bonusSlotActive: boolean;
  coinSlotActive: boolean;
};

export const mergeRoundTraySlotSnapshots = (
  current: RoundTraySlotSnapshot,
  incoming: RoundTraySlotSnapshot,
): RoundTraySlotSnapshot => ({
  bonusSlotActive: current.bonusSlotActive || incoming.bonusSlotActive,
  coinSlotActive: current.coinSlotActive || incoming.coinSlotActive,
});

export const getRoundTrayCapacity = (
  snapshot: RoundTraySlotSnapshot,
  baseCapacity: number,
  maxCapacity: number,
) =>
  Math.max(
    baseCapacity,
    Math.min(
      maxCapacity,
      baseCapacity + Number(snapshot.coinSlotActive) + Number(snapshot.bonusSlotActive),
    ),
  );
