import { asc, eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { boards, columns } from "../../db/schema/index.ts";
import { BoardNotFoundError } from "./board-errors.ts";

type ColumnWriteSession = Pick<DatabaseClient["db"], "select" | "update">;

type ColumnWriteDatabase = ColumnWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type BoardRecord = {
  id: string;
};

type ColumnRecord = {
  id: string;
  position: number;
};

type ReorderColumnsRepositorySession = {
  findBoardById: (boardId: string) => Promise<BoardRecord | null>;
  findColumnsByBoardId: (boardId: string) => Promise<ColumnRecord[]>;
  updateColumnPosition: (columnId: string, position: number) => Promise<void>;
};

type ReorderColumnsRepository = {
  transaction: <T>(run: (repository: ReorderColumnsRepositorySession) => Promise<T>) => Promise<T>;
};

export type ReorderColumnsInput = {
  boardId: string;
  columnIds: unknown;
};

export type ReorderColumnsUseCase = (input: ReorderColumnsInput) => Promise<void>;

export class ReorderColumnsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReorderColumnsValidationError";
  }
}

const normalizeColumnIds = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ReorderColumnsValidationError("Column reorder requires a non-empty columnIds array");
  }

  const columnIds = value.map((entry) => {
    if (typeof entry !== "string" || entry.trim() === "") {
      throw new ReorderColumnsValidationError("Column reorder payload must contain only string ids");
    }

    return entry;
  });

  if (new Set(columnIds).size !== columnIds.length) {
    throw new ReorderColumnsValidationError("Column reorder payload contains duplicate ids");
  }

  return columnIds;
};

const matchesExactly = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const leftIds = new Set(left);
  return right.every((entry) => leftIds.has(entry));
};

const createRepositorySession = (db: ColumnWriteSession): ReorderColumnsRepositorySession => ({
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
  findColumnsByBoardId: async (boardId) =>
    await db
      .select({
        id: columns.id,
        position: columns.position,
      })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position)),
  updateColumnPosition: async (columnId, position) => {
    await db
      .update(columns)
      .set({
        position,
        updatedAt: new Date(),
      })
      .where(eq(columns.id, columnId));
  },
});

export const createReorderColumnsRepository = (db: ColumnWriteDatabase): ReorderColumnsRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as ColumnWriteSession));
    }),
});

export const createReorderColumnsUseCase = (
  repository: ReorderColumnsRepository,
): ReorderColumnsUseCase => {
  return async ({ boardId, columnIds }) => {
    const normalizedColumnIds = normalizeColumnIds(columnIds);

    await repository.transaction(async (transaction) => {
      const board = await transaction.findBoardById(boardId);
      if (board === null) {
        throw new BoardNotFoundError(boardId);
      }

      const currentColumns = await transaction.findColumnsByBoardId(boardId);
      const currentColumnIds = currentColumns.map((column) => column.id);
      if (!matchesExactly(currentColumnIds, normalizedColumnIds)) {
        throw new ReorderColumnsValidationError(
          "Column reorder payload must include each board column exactly once",
        );
      }

      for (const [index, columnId] of normalizedColumnIds.entries()) {
        await transaction.updateColumnPosition(columnId, -index - 1);
      }

      for (const [index, columnId] of normalizedColumnIds.entries()) {
        await transaction.updateColumnPosition(columnId, index);
      }
    });
  };
};
