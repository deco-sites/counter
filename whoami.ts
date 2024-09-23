import { context } from "@deco/deco";

export const whoAmI = () =>
  context.isDeploy
    ? `https://counter-${context.deploymentId}.decocluster.com`
    : `http://localhost:${Deno.env.get("PORT") ?? "8000"}`;
