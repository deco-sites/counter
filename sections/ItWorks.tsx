import { SectionProps } from "@deco/deco";
import { counter } from "../actors/client.ts";
import { default as Counter } from "../islands/ItWorks.tsx";
export interface Props {
  /**
   * @format rich-text
   * @description The description of name.
   * @default It Works!
   */
  name?: string;
}

export const loader = async (p: Props) => {
  return { ...p, count: await counter.getCount() };
};

export default function Section(
  { name = "It Works!", count }: SectionProps<typeof loader>,
) {
  return <Counter name={name} count={count} />;
}
