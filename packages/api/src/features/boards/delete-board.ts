import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { boards } from "../../db/schema/index.ts";
import { BoardNotFoundError } from "./board-errors.ts";

type BoardWriteSession = Pick<DatabaseClient["db"], "delete" | "select">;

type BoardWriteDatabase = BoardWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type DeleteBoardRepositorySession = {
  findBoardById: (boardId: string) => Promise<{ id: string } | null>;
  deleteBoard: (boardId: string) => Promise<void>;
};

type DeleteBoardRepository = {
  transaction: <T>(run: (repository: DeleteBoardRepositorySession) => Promise<T>) => Promise<T>;
};

export type DeleteBoardInput = {
  boardId: string;
};

export type DeleteBoardUseCase = (input: DeleteBoardInput) => Promise<void>;

const createRepositorySession = (db: BoardWriteSession): DeleteBoardRepositorySession => ({
  findBoardById: async (boardId) => {
    const [board] = await db
      .select({
        id: boards.id,
      })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    return board ?? null;
  },
  deleteBoard: async (boardId) => {
    await db.delete(boards).where(eq(boards.id, boardId));
  },
});

export const createDeleteBoardRepository = (db: BoardWriteDatabase): DeleteBoardRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as BoardWriteSession));
    }),
});

export const createDeleteBoardUseCase = (repository: DeleteBoardRepository): DeleteBoardUseCase => {
  return async ({ boardId }) => {
    await repository.transaction(async (transaction) => {
      const board = await transaction.findBoardById(boardId);
      if (board === null) {
        throw new BoardNotFoundError(boardId);
      }

      await transaction.deleteBoard(boardId);
    });
  };
};
