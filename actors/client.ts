import { actors } from "@deco/actors/proxy";
import type { TicTacToe } from "site/actors/TicTacToe.ts";
import type { Chat } from "../actors/Chat.ts";
import type { Counter } from "../actors/Counter.ts";

export const counter = actors.proxy<Counter>("Counter").id(
  "GLOBAL_COUNTER",
);

export const chatProxy = actors.proxy<Chat>("Chat");

export const chat = {
  join: (room: string) => chatProxy.id(room),
};

export const tictactoeProxy = actors.proxy<TicTacToe>("TicTacToe");

export const tictactoe = {
  join(room: string) {
    return tictactoeProxy.id(room);
  },
};
