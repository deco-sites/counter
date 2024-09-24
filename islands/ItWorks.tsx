import { useEffect, useState } from "preact/hooks";
import { counter } from "../actors/client.ts";

export interface Props {
  /**
   * @format rich-text
   * @description The description of name.
   * @default It Works!
   */
  name?: string;
  count?: number;
}

export default function Island({ name = "It Works!", count = 0 }: Props) {
  const [currentCount, setCurrentCount] = useState(count);
  const [isLoading, setIsLoading] = useState(false);

  // Watch for counter updates
  useEffect(() => {
    const watchCounter = async () => {
      for await (const event of await counter.watch()) {
        setCurrentCount(event); // Update count on new event
      }
    };
    watchCounter();
  }, []);

  // Increment counter
  const increment = async () => {
    setIsLoading(true);
    const newCount = await counter.increment();
    setCurrentCount(newCount);
    setIsLoading(false);
  };

  // Decrement counter
  const decrement = async () => {
    setIsLoading(true);
    const newCount = await counter.decrement();
    setCurrentCount(newCount);
    setIsLoading(false);
  };

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
            onClick={decrement}
            class="btn btn-sm btn-circle btn-outline no-animation"
            disabled={isLoading}
          >
            <span class={isLoading ? "hidden" : "inline"}>-</span>
            <span
              class={isLoading ? "loading loading-spinner inline" : "hidden"}
            />
          </button>
          <span id="count">{currentCount}</span>
          <button
            onClick={increment}
            class="btn btn-sm btn-circle btn-outline no-animation"
            disabled={isLoading}
          >
            <span class={isLoading ? "hidden" : "inline"}>+</span>
            <span
              class={isLoading ? "loading loading-spinner inline" : "hidden"}
            />
          </button>
        </div>
        <div class="text-sm">Powered by Fresh & Preact Hooks</div>
      </div>
    </div>
  );
}
