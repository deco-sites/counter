import { ActorState } from "@deco/actors";
import { WatchTarget } from "@deco/actors/watch";

export interface Message {
  user: string;
  content: string;
  timestamp: number;
}

export interface BaseChatEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
}
export interface MessageEvent extends BaseChatEvent<Message[]> {
  type: "message";
}

export interface TypingEvent extends BaseChatEvent<string | null> {
  type: "typing";
}

export interface ConnectedUsersEvent extends BaseChatEvent<string[]> {
  type: "connected-users";
}

export type ChatEvent = MessageEvent | TypingEvent | ConnectedUsersEvent;

export class Chat {
  private messages: Message[] = [];
  private events = new WatchTarget<ChatEvent>();
  private users = new Set<string>();
  private typingUsers = new Set<string>();

  constructor(protected state: ActorState) {
    state.blockConcurrencyWhile(async () => {
      this.messages = await this.state.storage.get<Message[]>("chat") ?? [];
    });
  }

  join(user: string) {
    this.users.add(user);
    this.events.notify({
      type: "connected-users",
      payload: Array.from(this.users),
    });
  }

  leave(user: string) {
    this.users.delete(user);
    this.events.notify({
      type: "connected-users",
      payload: Array.from(this.users),
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
    this.events.notify({ type: "message", payload: this.messages });
    return this.messages;
  }

  setTyping(user: string, isTyping: boolean): void {
    if (isTyping) {
      this.typingUsers.add(user);
    } else {
      this.typingUsers.delete(user);
    }
    const typingUser = this.typingUsers.size > 0
      ? Array.from(this.typingUsers).join(", ")
      : null;
    this.events.notify({
      type: "typing",
      payload: typingUser,
    });
  }

  getUsers(): string[] {
    return Array.from(this.users);
  }
  getMessages(): Message[] {
    return this.messages;
  }

  watch(): AsyncIterableIterator<ChatEvent> {
    return this.events.subscribe();
  }
}
