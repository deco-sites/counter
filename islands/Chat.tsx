import { useEffect, useState } from "preact/hooks";
import type { ChatEvent, Message } from "../actors/Chat.ts";
import { chat as chatservice } from "../actors/client.ts"; // Assuming the `chat` actor is instantiated similarly.

export interface Props {
  user: string;
  room: string;
  messages?: Message[];
  users?: string[];
}

export default function ChatComponent(
  { user, room, messages: initialMessages, users: initialUsers }: Props,
) {
  const chat = chatservice.join(room);
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [users, setUsers] = useState<string[]>(initialUsers ?? []);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<number | undefined>(
    undefined,
  );

  const eventHandler: {
    [E in ChatEvent as E["type"]]: (event: E) => void;
  } = {
    "connected-users": (evnt) => {
      setUsers(evnt.payload);
    },
    message: (evnt) => {
      setMessages(evnt.payload);
    },
    typing: (evnt) => {
      setTypingUser(evnt.payload);
    },
  };
  function handleEvent<E extends ChatEvent>(event: E) {
    const handler = eventHandler[event.type] as
      | ((event: E) => void)
      | undefined;
    handler?.(event);
  }

  useEffect(() => {
    chat.join(user);
    return () => chat.leave(user);
  }, [room, user]);

  // Watch for typing events
  useEffect(() => {
    const watch = async () => {
      for await (const event of await chat.watch()) {
        handleEvent(event);
      }
    };
    watch();
  }, [user]);

  // Detect user typing
  // deno-lint-ignore no-explicit-any
  const handleTyping = async (e: any) => {
    const target = e?.currentTarget?.value;
    if (!target) {
      return;
    }
    setNewMessage(e.currentTarget.value);

    if (typingTimeout) clearTimeout(typingTimeout);

    await chat.setTyping(user, true); // Notify chat actor that the user is typing

    // Set a timeout to stop typing notification after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      chat.setTyping(user, false); // Notify chat actor that the user stopped typing
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Send a new message
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;
    setIsLoading(true);
    await chat.sendMessage(user, newMessage);
    setNewMessage("");
    setIsLoading(false);
  };

  return (
    <div class="chat-container flex flex-col items-center justify-center p-4 gap-4">
      <div class="connected-users text-sm">
        <strong>Connected Users:</strong> {users.join(", ")}
      </div>
      <div class="chat-box w-full max-w-lg bg-white border rounded-lg p-4">
        <div class="chat-messages flex flex-col gap-2 overflow-y-auto h-64">
          {messages.map((message) => (
            <div class="message">
              <strong>{message.user}</strong>: {message.content}
              <span class="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
        {typingUser && (
          <div class="typing-notification text-sm text-gray-500">
            {typingUser} is typing...
          </div>
        )}
      </div>

      <div class="message-input w-full max-w-lg flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onInput={handleTyping}
          class="input input-bordered w-full"
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          class="btn btn-primary"
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
