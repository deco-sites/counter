import { useEffect, useState } from "preact/hooks";
import type { TicTacToeEvent } from "../actors/TicTacToe.ts";
import { tictactoe as tictactoService } from "../actors/client.ts"; // Assuming the TicTacToe actor is instantiated similarly.

export interface Props {
  player: string;
  room: string;
}

export default function TicTacToeComponent({ player, room }: Props) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [players, setPlayers] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [playerMark, setPlayerMark] = useState<string | null>(null); // Track the player's mark (X or O)
  const [waiting, setWaiting] = useState<boolean>(false); // Track if the player is waiting for a spot

  const tictactoe = tictactoService.join(room);
  const eventHandler: {
    [E in TicTacToeEvent as E["type"]]: (event: E) => void;
  } = {
    "connected-players": (evnt) => {
      setPlayers(evnt.payload);
    },
    "move": (evnt) => {
      const { player, position } = evnt.payload;
      setBoard((prevBoard) => {
        const newBoard = [...prevBoard];
        newBoard[position] = player;
        return newBoard;
      });
    },
    "player-assignment": (evnt) => {
      setPlayerMark(evnt.payload); // Set the player's mark ("X" or "O")
      setWaiting(false); // No longer waiting, player can start playing
    },
    "game-full": () => {
      setWaiting(true); // The player is waiting for a spot to open
    },
    "game-over": (evnt) => {
      setGameOver(evnt.payload);
    },
  };

  function handleEvent<E extends TicTacToeEvent>(event: E) {
    const handler = eventHandler[event.type] as
      | ((event: E) => void)
      | undefined;
    handler?.(event);
  }

  useEffect(() => {
    const joinGame = async () => {
      try {
        const watchIterator = await tictactoe.watch(player); // Call the watch method to join
        for await (const event of watchIterator) {
          handleEvent(event);
        }
      } catch (error) {
        console.error("Failed to watch the game:", error);
      }
    };

    joinGame();

    return () => {
      // No explicit leave logic is necessary
    };
  }, [room, player]);

  const makeMove = async (index: number) => {
    if (!gameOver && board[index] === null && !waiting) {
      await tictactoe.makeMove(player, index); // Trigger a move
    }
  };

  return (
    <div class="flex flex-col items-center justify-center gap-4">
      {/* Player Information */}
      <div class="text-center">
        {waiting
          ? (
            <p class="text-lg font-bold text-gray-700">
              Game is full. Waiting for a spot to open...
            </p>
          )
          : (
            <>
              <p class="text-lg font-bold text-gray-700">
                Players:{" "}
                <span class="text-indigo-600">{players.join(", ")}</span>
              </p>
              <p class="text-lg font-bold text-gray-700">
                Your Mark: <span class="text-indigo-600">{playerMark}</span>
              </p>
            </>
          )}
      </div>

      {/* TicTacToe Board */}
      <div class="grid grid-cols-3 gap-4 w-full max-w-xs">
        {board.map((cell, index) => (
          <button
            key={index}
            class={`w-24 h-24 text-3xl font-bold border-2 border-gray-300 rounded-md 
              ${
              cell ? "bg-gray-200 text-gray-500" : "bg-white hover:bg-indigo-50"
            } 
              flex items-center justify-center`}
            onClick={() => makeMove(index)}
            disabled={!!cell || gameOver !== null || waiting}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Game Over Message */}
      {gameOver && (
        <div class="text-lg font-bold text-red-500">
          {gameOver}
        </div>
      )}
    </div>
  );
}
