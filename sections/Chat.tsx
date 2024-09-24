import { SectionProps } from "@deco/deco";
import { chat as chatService } from "../actors/client.ts";
import { default as Chat } from "../islands/Chat.tsx";
export interface Props {
  /**
   * @format rich-text
   * @description The description of name.
   * @default It Works!
   */
  user?: string;
  room: string;
}

export const loader = async (p: Props, req: Request) => {
  const url = new URL(req.url);
  const room = p.room;
  const chat = chatService.join(room);
  return {
    ...p,
    user: url.searchParams.get("user") ?? "unknown",
    messages: await chat.getMessages(),
  };
};

export default function Section(
  { user = "unknown", messages, room }: SectionProps<typeof loader>,
) {
  return <Chat room={room} user={user} messages={messages} />;
}
