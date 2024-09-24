import { actors } from "@deco/actors/proxy";
import { SectionProps } from "@deco/deco";
import { useScriptAsDataURI, useSection } from "@deco/deco/hooks";
import { Counter } from "../actors/Counter.ts";

export interface Props {
  /**
   * @format rich-text
   * @description The description of name.
   * @default It Works!
   */
  name?: string;
  op?: "decrement" | "increment";
}

export const counter = actors.proxy(Counter).id(
  "GLOBAL_COUNTER",
);

export const loader = async (p: Props) => {
  if (p.op === "decrement") {
    return { ...p, count: await counter.decrement() };
  } else if (p.op === "increment") {
    return { ...p, count: await counter.increment() };
  }
  const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
  const count = await Promise.race([
    timeout.then(() => -9999999),
    counter.getCount(),
  ]);
  return { ...p, count };
};
export default function Section(
  { name = "It Works!", count }: SectionProps<typeof loader>,
) {
  /**
   * useSection is a nice hook for getting the HTMX link to render this section,
   * but with the following Props
   */
  const downLink = useSection({ props: { op: "decrement" } });
  const upLink = useSection({ props: { op: "increment" } });
  return (
    <div
      id="it-works"
      class="container py-10 flex flex-col h-screen w-full items-center justify-center gap-16"
    >
      <div
        class="leading-10 text-6xl"
        dangerouslySetInnerHTML={{
          __html: name,
        }}
      />

      <div class="flex flex-col items-center justify-center gap-2">
        <div class="flex items-center gap-4">
          <button
            hx-target="#it-works"
            hx-swap="outerHTML"
            hx-method="POST"
            hx-post={downLink} // htmx link for this section with the down vote props
            class="btn btn-sm btn-circle btn-outline no-animation"
          >
            <span class="inline [.htmx-request_&]:hidden">
              -
            </span>
            <span class="loading loading-spinner hidden [.htmx-request_&]:inline" />
          </button>
          <span id="count">{count}</span>
          <script
            type={"module"}
            src={useScriptAsDataURI((mcount: number) => {
              const count = document.getElementById("count");
              const eventSource = new EventSource(
                `/live/invoke/site/loaders/watchCount.ts`,
              );
              eventSource.addEventListener("message", (data) => {
                if (count && data.data !== `${mcount}`) {
                  count.innerText = data.data;
                }
              });
            }, count)}
          />
          <button
            hx-target="#it-works"
            hx-swap="outerHTML"
            hx-post={upLink} // htmx link for this section with the up vote props
            class="btn btn-sm btn-circle btn-outline no-animation"
          >
            <span class="inline [.htmx-request_&]:hidden">
              +
            </span>
            <span class="loading loading-spinner hidden [.htmx-request_&]:inline" />
          </button>
        </div>
        <div class="text-sm">Powered by HTMX</div>
      </div>
    </div>
  );
}
