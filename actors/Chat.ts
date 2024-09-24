import { ActorState } from "@deco/actors";
import { WatchTarget } from "@deco/actors/watch";

export interface Message {
  user: string;
  content: string;
  timestamp: number;
}

export class Chat {
  private messages: Message[] = [];
  private watchTarget = new WatchTarget<Message[]>();

  constructor(protected state: ActorState) {
    state.blockConcurrencyWhile(async () => {
      this.messages = await this.state.storage.get<Message[]>("chat") ?? [];
    });
  }

  async sendMessage(user: string, content: string): Promise<Message[]> {
    const newMessage: Message = {
      user,
      content,
      timestamp: Date.now(),
    };
    this.messages.push(newMessage);
    await this.state.storage.put("chat", this.messages);
    this.watchTarget.notify(this.messages);
    return this.messages;
  }

  getMessages(): Message[] {
    return this.messages;
  }

  watch(): AsyncIterableIterator<Message[]> {
    return this.watchTarget.subscribe();
  }
}
