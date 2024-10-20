import { defineConfig } from "$fresh/server.ts";
import { withActors } from "@deco/actors/hono";
import { Deco, DecoRouteState } from "@deco/deco";
import { framework as htmxFramework } from "@deco/deco/htmx";
import { Hono } from "@hono/hono";
import { plugins } from "deco/plugins/deco.ts";
import "deco/runtime/htmx/FreshHeadCompat.ts";
import { TicTacToe } from "site/actors/TicTacToe.ts";
import { Chat } from "./actors/Chat.ts";
import { Counter } from "./actors/Counter.ts";
import manifest, { Manifest } from "./manifest.gen.ts";

const server = new Hono<DecoRouteState<Manifest>>();
server.use(withActors([Counter, Chat, TicTacToe]));

const deco = await Deco.init<Manifest>({
  manifest,
  bindings: {
    server,
    framework: htmxFramework,
  },
});

export default defineConfig({
  plugins: plugins({
    manifest,
    deco,
  }),
});
