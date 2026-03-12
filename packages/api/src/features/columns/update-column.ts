import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { columns } from "../../db/schema/index.ts";
import { CreateColumnValidationError, type ManagedColumn } from "./create-column.ts";
import { ColumnNotFoundError } from "./column-errors.ts";

type ColumnWriteSession = Pick<DatabaseClient["db"], "select" | "update">;

type ColumnWriteDatabase = ColumnWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type UpdateColumnRepositorySession = {
  findColumnById: (columnId: string) => Promise<{ id: string } | null>;
  updateColumn: (input: { columnId: string; title: string }) => Promise<ManagedColumn>;
};

type UpdateColumnRepository = {
  transaction: <T>(run: (repository: UpdateColumnRepositorySession) => Promise<T>) => Promise<T>;
};

export type UpdateColumnInput = {
  columnId: string;
  title: unknown;
};

export type UpdateColumnUseCase = (input: UpdateColumnInput) => Promise<ManagedColumn>;

const createRepositorySession = (db: ColumnWriteSession): UpdateColumnRepositorySession => ({
  findColumnById: async (columnId) => {
    const [column] = await db
      .select({
        id: columns.id,
      })
      .from(columns)
      .where(eq(columns.id, columnId))
      .limit(1);

    return column ?? null;
  },
  updateColumn: async ({ columnId, title }) => {
    const [updatedColumn] = await db
      .update(columns)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(columns.id, columnId))
      .returning({
        id: columns.id,
        boardId: columns.boardId,
        title: columns.title,
        position: columns.position,
      });

    if (updatedColumn === undefined) {
      throw new Error("Column update did not return a record");
    }

    return updatedColumn;
  },
});

export const createUpdateColumnRepository = (db: ColumnWriteDatabase): UpdateColumnRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as ColumnWriteSession));
    }),
});

export const createUpdateColumnUseCase = (repository: UpdateColumnRepository): UpdateColumnUseCase => {
  return async ({ columnId, title }) => {
    const normalizedTitle = normalizeTitle(title);

    return await repository.transaction(async (transaction) => {
      const column = await transaction.findColumnById(columnId);
      if (column === null) {
        throw new ColumnNotFoundError(columnId);
      }

      return await transaction.updateColumn({
        columnId,
        title: normalizedTitle,
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

export { CreateColumnValidationError };
