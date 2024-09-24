import { useEffect, useState } from "preact/hooks";
import { Message } from "../actors/Chat.ts";
import { chat as chatService } from "../actors/client.ts"; // Assuming the `chat` actor is instantiated similarly to `counter`.

export interface Props {
  user: string;
  room: string;
  messages?: Message[];
}

export default function ChatComponent(
  { user, room, messages: initialMessages }: Props,
) {
  const chat = chatService.join(room);
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Watch for new messages
  useEffect(() => {
    const watchMessages = async () => {
      for await (const updatedMessages of await chat.watch()) {
        setMessages(updatedMessages); // Update message list when new messages arrive
      }
    };
    watchMessages();
  }, []);

  // Send a new message
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;
    setIsLoading(true);
    await chat.sendMessage(user, newMessage);
    setNewMessage(""); // Clear the input after sending
    setIsLoading(false);
  };

  return (
    <div class="chat-container flex flex-col items-center justify-center p-4 gap-4">
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
      </div>

      <div class="message-input w-full max-w-lg flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onInput={(e) => setNewMessage(e.currentTarget.value)}
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
