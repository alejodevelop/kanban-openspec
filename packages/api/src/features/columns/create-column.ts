import { desc, eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { boards, columns } from "../../db/schema/index.ts";
import { BoardNotFoundError } from "../boards/board-errors.ts";

type ColumnWriteSession = Pick<DatabaseClient["db"], "insert" | "select">;

type ColumnWriteDatabase = ColumnWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type BoardRecord = {
  id: string;
};

export type ManagedColumn = {
  id: string;
  boardId: string;
  title: string;
  position: number;
};

export type CreateColumnInput = {
  boardId: string;
  title: unknown;
};

type CreateColumnInsert = {
  boardId: string;
  title: string;
  position: number;
};

type CreateColumnRepositorySession = {
  findBoardById: (boardId: string) => Promise<BoardRecord | null>;
  findLastPositionInBoard: (boardId: string) => Promise<number | null>;
  insertColumn: (input: CreateColumnInsert) => Promise<ManagedColumn>;
};

type CreateColumnRepository = {
  transaction: <T>(run: (repository: CreateColumnRepositorySession) => Promise<T>) => Promise<T>;
};

export type CreateColumnUseCase = (input: CreateColumnInput) => Promise<ManagedColumn>;

export class CreateColumnValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateColumnValidationError";
  }
}

const createRepositorySession = (db: ColumnWriteSession): CreateColumnRepositorySession => ({
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
  findLastPositionInBoard: async (boardId) => {
    const [record] = await db
      .select({
        position: columns.position,
      })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(desc(columns.position))
      .limit(1);

    return record?.position ?? null;
  },
  insertColumn: async ({ boardId, title, position }) => {
    const [createdColumn] = await db
      .insert(columns)
      .values({
        boardId,
        title,
        position,
      })
      .returning({
        id: columns.id,
        boardId: columns.boardId,
        title: columns.title,
        position: columns.position,
      });

    if (createdColumn === undefined) {
      throw new Error("Column insert did not return a record");
    }

    return createdColumn;
  },
});

export const createCreateColumnRepository = (db: ColumnWriteDatabase): CreateColumnRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as ColumnWriteSession));
    }),
});

export const createCreateColumnUseCase = (repository: CreateColumnRepository): CreateColumnUseCase => {
  return async ({ boardId, title }) => {
    const normalizedTitle = normalizeTitle(title);

    return await repository.transaction(async (transaction) => {
      const board = await transaction.findBoardById(boardId);
      if (board === null) {
        throw new BoardNotFoundError(boardId);
      }

      const lastPosition = await transaction.findLastPositionInBoard(boardId);

      return await transaction.insertColumn({
        boardId,
        title: normalizedTitle,
        position: lastPosition === null ? 0 : lastPosition + 1,
      });
    });
  };
};

const normalizeTitle = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new CreateColumnValidationError("Title is required");
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new CreateColumnValidationError("Title is required");
  }

  return normalized;
};
