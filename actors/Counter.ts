import { ActorState } from "@deco/actors";

export class Counter {
  private count: number;

  constructor(protected state: ActorState) {
    this.count = 0;
    state.blockConcurrencyWhile(async () => {
      this.count = await this.state.storage.get<number>("counter") ?? 0;
    });
  }

  async increment(): Promise<number> {
    await this.state.storage.put("counter", ++this.count);
    return this.count;
  }

  async decrement(): Promise<number> {
    await this.state.storage.put("counter", --this.count);
    return this.count;
  }

  getCount(): number {
    return this.count;
  }
}
