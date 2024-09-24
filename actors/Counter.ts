import { ActorState } from "@deco/actors";

export class Counter {
  private count: number;
  private subscribers: Record<string, (count: number) => void> = {};

  constructor(protected state: ActorState) {
    this.count = 0;
    state.blockConcurrencyWhile(async () => {
      this.count = await this.state.storage.get<number>("counter") ?? 0;
    });
  }

  async increment(): Promise<number> {
    await this.state.storage.put("counter", ++this.count);
    this.notifySubscribers();
    return this.count;
  }

  async decrement(): Promise<number> {
    await this.state.storage.put("counter", --this.count);
    this.notifySubscribers();
    return this.count;
  }

  getCount(): number {
    return this.count;
  }

  watch(): AsyncIterableIterator<number> {
    const subscription = crypto.randomUUID();
    const queue: Array<(value: IteratorResult<number>) => void> = [];

    const pushQueue = (value: IteratorResult<number>) => {
      queue.forEach((resolve) => resolve(value));
    };

    const nextPromise = () =>
      new Promise<IteratorResult<number>>((resolve) => {
        queue.push(resolve);
      });

    const iterator: AsyncIterableIterator<number> = {
      next: () => nextPromise(),
      return: () => {
        // Clean up the subscription when iterator.return() is called
        delete this.subscribers[subscription];
        // Return the "done" value for the iterator
        return Promise.resolve({ value: undefined, done: true });
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    this.subscribers[subscription] = (count: number) => {
      pushQueue({ value: count, done: false });
    };

    return iterator;
  }

  private notifySubscribers() {
    Object.values(this.subscribers).forEach((subscriber) =>
      subscriber(this.count)
    );
  }
}
