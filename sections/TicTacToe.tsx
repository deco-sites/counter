import { SectionProps } from "@deco/deco";
import { default as TicTacToe } from "../islands/TicTacToe.tsx";
export interface Props {
  /**
   * @format rich-text
   * @description The description of name.
   * @default It Works!
   */
  user?: string;
  room: string;
}

export const loader = (p: Props, req: Request) => {
  const url = new URL(req.url);
  return {
    ...p,
    user: url.searchParams.get("user") ?? crypto.randomUUID(),
  };
};

export default function Section(
  { room, user }: SectionProps<typeof loader>,
) {
  return <TicTacToe room={room} player={user} />;
}
