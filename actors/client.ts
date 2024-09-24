import { actors } from "@deco/actors/proxy";
import type { Chat } from "../actors/Chat.ts";
import type { Counter } from "../actors/Counter.ts";

export const counter = actors.proxy<Counter>("Counter").id(
  "GLOBAL_COUNTER",
);

export const chatProxy = actors.proxy<Chat>("Chat");

export const chat = {
  join: (room: string) => chatProxy.id(room),
};
