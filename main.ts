import { withActors } from "@deco/actors/hono";
import { Deco, DecoRouteState } from "@deco/deco";
import { bindings as HTMX } from "@deco/deco/htmx";
import { Hono } from "@hono/hono";
import "deco/runtime/htmx/FreshHeadCompat.ts";
import { Layout } from "./_app.tsx";
import { Counter } from "./actors/Counter.ts";
import manifest, { Manifest } from "./manifest.gen.ts";

const server = new Hono<DecoRouteState<Manifest>>();
server.use(withActors([Counter]));

const deco = await Deco.init<Manifest>({
  manifest,
  bindings: HTMX({
    server,
    Layout,
  }),
});

const envPort = Deno.env.get("PORT");

Deno.serve({ handler: deco.fetch.bind(deco), port: envPort ? +envPort : 8000 });
