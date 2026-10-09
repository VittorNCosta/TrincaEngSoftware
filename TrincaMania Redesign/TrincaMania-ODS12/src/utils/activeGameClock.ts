/** Counts active play time, retaining fractions across pauses. */
export class ActiveGameClock {
  private accumulatedMs = 0;
  private startedAt: number | undefined;
  constructor(private readonly now: () => number = () => performance.now()) {}
  setRunning(running: boolean) {
    if (running && this.startedAt === undefined) this.startedAt = this.now();
    if (!running && this.startedAt !== undefined) {
      this.accumulatedMs += Math.max(0, this.now() - this.startedAt);
      this.startedAt = undefined;
    }
  }
  readSeconds() {
    const delta =
      this.startedAt === undefined
        ? 0
        : Math.max(0, this.now() - this.startedAt);
    return Math.floor((this.accumulatedMs + delta) / 1000);
  }
  reset() {
    this.accumulatedMs = 0;
    if (this.startedAt !== undefined) this.startedAt = this.now();
  }
}
