import { ActorState } from "@deco/actors";
import { WatchTarget } from "@deco/actors/watch";

export class Counter {
  private count: number;
  private watchTarget = new WatchTarget<number>();

  constructor(protected state: ActorState) {
    this.count = 0;
    state.blockConcurrencyWhile(async () => {
      this.count = await this.state.storage.get<number>("counter") ?? 0;
    });
  }

  async increment(): Promise<number> {
    await this.state.storage.put("counter", ++this.count);
    this.watchTarget.notify(this.count);
    return this.count;
  }

  async decrement(): Promise<number> {
    await this.state.storage.put("counter", --this.count);
    this.watchTarget.notify(this.count);
    return this.count;
  }

  getCount(): number {
    return this.count;
  }

  watch(): AsyncIterableIterator<number> {
    return this.watchTarget.subscribe();
  }
}
