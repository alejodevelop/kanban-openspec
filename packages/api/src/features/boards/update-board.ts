import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { boards } from "../../db/schema/index.ts";
import { BoardNotFoundError } from "./board-errors.ts";
import { CreateBoardValidationError, type ManagedBoard } from "./create-board.ts";

type BoardWriteSession = Pick<DatabaseClient["db"], "select" | "update">;

type BoardWriteDatabase = BoardWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type UpdateBoardRepositorySession = {
  findBoardById: (boardId: string) => Promise<{ id: string } | null>;
  updateBoard: (input: { boardId: string; title: string }) => Promise<ManagedBoard>;
};

type UpdateBoardRepository = {
  transaction: <T>(run: (repository: UpdateBoardRepositorySession) => Promise<T>) => Promise<T>;
};

export type UpdateBoardInput = {
  boardId: string;
  title: unknown;
};

export type UpdateBoardUseCase = (input: UpdateBoardInput) => Promise<ManagedBoard>;

const createRepositorySession = (db: BoardWriteSession): UpdateBoardRepositorySession => ({
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
  updateBoard: async ({ boardId, title }) => {
    const [updatedBoard] = await db
      .update(boards)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(boards.id, boardId))
      .returning({
        id: boards.id,
        title: boards.title,
      });

    if (updatedBoard === undefined) {
      throw new Error("Board update did not return a record");
    }

    return updatedBoard;
  },
});

export const createUpdateBoardRepository = (db: BoardWriteDatabase): UpdateBoardRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as BoardWriteSession));
    }),
});

export const createUpdateBoardUseCase = (repository: UpdateBoardRepository): UpdateBoardUseCase => {
  return async ({ boardId, title }) => {
    const normalizedTitle = normalizeTitle(title);

    return await repository.transaction(async (transaction) => {
      const board = await transaction.findBoardById(boardId);
      if (board === null) {
        throw new BoardNotFoundError(boardId);
      }

      return await transaction.updateBoard({
        boardId,
        title: normalizedTitle,
      });
    });
  };
};

const normalizeTitle = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new CreateBoardValidationError("Title is required");
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new CreateBoardValidationError("Title is required");
  }

  return normalized;
};

export { CreateBoardValidationError };
