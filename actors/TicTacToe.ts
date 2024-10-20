import { ActorState } from "@deco/actors";
import { WatchTarget } from "@deco/actors/watch";

export interface Move {
  player: string; // "X" or "O"
  position: number; // 0 to 8 for a 3x3 grid
}

export interface BaseTicTacToeEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
}

export interface MoveEvent extends BaseTicTacToeEvent<Move> {
  type: "move";
}

export interface GameOverEvent extends BaseTicTacToeEvent<string> {
  type: "game-over";
}

export interface ConnectedPlayersEvent extends BaseTicTacToeEvent<string[]> {
  type: "connected-players";
}

export interface PlayerAssignmentEvent extends BaseTicTacToeEvent<string> {
  type: "player-assignment";
}

export interface GameFullEvent extends BaseTicTacToeEvent<null> {
  type: "game-full";
}

export type TicTacToeEvent =
  | MoveEvent
  | GameOverEvent
  | ConnectedPlayersEvent
  | PlayerAssignmentEvent
  | GameFullEvent;

export class TicTacToe {
  private board: (string | null)[] = Array(9).fill(null);
  private currentPlayer: string = "X"; // Start with player "X"
  private players = new Map<string, string>(); // Map of playerID to X or O
  private events = new WatchTarget<TicTacToeEvent>();

  constructor(protected state: ActorState) {
    state.blockConcurrencyWhile(async () => {
      this.board = await this.state.storage.get<(string | null)[]>("board") ??
        Array(9).fill(null);
    });
  }

  private assignPlayerMark(playerId: string): string {
    if (this.players.size >= 2) {
      // Notify the player that the game is full
      this.events.notify({ type: "game-full", payload: null });
      return ""; // No mark assigned yet, player must wait
    }

    // Randomly assign the first player to be X or O
    let playerMark: string;
    if (this.players.size === 0) {
      playerMark = Math.random() < 0.5 ? "X" : "O";
    } else {
      // Assign the other player the opposite mark
      const existingMark = Array.from(this.players.values())[0];
      playerMark = existingMark === "X" ? "O" : "X";
    }

    this.players.set(playerId, playerMark);
    return playerMark;
  }

  async makeMove(
    playerId: string,
    position: number,
  ): Promise<(string | null)[]> {
    const playerMark = this.players.get(playerId);

    if (
      !playerMark || this.board[position] || this.players.size < 2 ||
      playerMark !== this.currentPlayer
    ) {
      return this.board; // Invalid move
    }

    this.board[position] = playerMark;
    await this.state.storage.put("board", this.board);

    // Notify the specific move
    this.events.notify({
      type: "move",
      payload: { player: playerMark, position },
    });

    if (this.checkWinner()) {
      this.events.notify({ type: "game-over", payload: `${playerMark} wins!` });
    } else if (this.board.every((cell) => cell !== null)) {
      this.events.notify({ type: "game-over", payload: "It's a draw!" });
    } else {
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    }

    return this.board;
  }

  checkWinner(): boolean {
    const winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (
        this.board[a] && this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return true;
      }
    }
    return false;
  }

  getBoard(): (string | null)[] {
    return this.board;
  }

  getPlayers(): string[] {
    return Array.from(this.players.keys());
  }

  async *watch(playerId: string): AsyncIterableIterator<TicTacToeEvent> {
    // Try to assign the player a mark, but notify if the game is full
    const playerMark = this.assignPlayerMark(playerId);

    // If the game is full, the player must wait until a spot opens
    if (!playerMark) {
      // The player will keep listening for events (including the game becoming available)
      const subscription = this.events.subscribe();

      for await (const event of subscription) {
        yield event;
      }

      // When a spot opens up (a player leaves), we stop and the player can rejoin
      return;
    }

    // Notify other players about the new player
    this.events.notify({
      type: "connected-players",
      payload: Array.from(this.players.keys()),
    });

    // Notify the joining player about their assignment
    yield {
      type: "player-assignment",
      payload: playerMark,
    };

    // Yield events as they happen
    const subscription = this.events.subscribe();

    try {
      for await (const event of subscription) {
        yield event;
      }
    } finally {
      // Cleanup: Remove player when the stream ends
      this.players.delete(playerId);
      this.events.notify({
        type: "connected-players",
        payload: Array.from(this.players.keys()),
      });
    }
  }
}

export default TicTacToe;
