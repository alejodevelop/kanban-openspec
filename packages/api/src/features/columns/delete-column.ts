import { and, asc, eq, gt } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { columns } from "../../db/schema/index.ts";
import { ColumnNotFoundError } from "./column-errors.ts";

type ColumnWriteSession = Pick<DatabaseClient["db"], "delete" | "select" | "update">;

type ColumnWriteDatabase = ColumnWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type DeletedColumnRecord = {
  id: string;
  boardId: string;
  position: number;
};

type DeleteColumnRepositorySession = {
  findColumnById: (columnId: string) => Promise<DeletedColumnRecord | null>;
  deleteColumn: (columnId: string) => Promise<void>;
  findColumnsAfterPosition: (boardId: string, position: number) => Promise<Array<{ id: string; position: number }>>;
  updateColumnPosition: (columnId: string, position: number) => Promise<void>;
};

type DeleteColumnRepository = {
  transaction: <T>(run: (repository: DeleteColumnRepositorySession) => Promise<T>) => Promise<T>;
};

export type DeleteColumnInput = {
  columnId: string;
};

export type DeletedColumn = {
  boardId: string;
};

export type DeleteColumnUseCase = (input: DeleteColumnInput) => Promise<DeletedColumn>;

const createRepositorySession = (db: ColumnWriteSession): DeleteColumnRepositorySession => ({
  findColumnById: async (columnId) => {
    const [column] = await db
      .select({
        id: columns.id,
        boardId: columns.boardId,
        position: columns.position,
      })
      .from(columns)
      .where(eq(columns.id, columnId))
      .limit(1);

    return column ?? null;
  },
  deleteColumn: async (columnId) => {
    await db.delete(columns).where(eq(columns.id, columnId));
  },
  findColumnsAfterPosition: async (boardId, position) =>
    await db
      .select({
        id: columns.id,
        position: columns.position,
      })
      .from(columns)
      .where(and(eq(columns.boardId, boardId), gt(columns.position, position)))
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

export const createDeleteColumnRepository = (db: ColumnWriteDatabase): DeleteColumnRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as ColumnWriteSession));
    }),
});

export const createDeleteColumnUseCase = (repository: DeleteColumnRepository): DeleteColumnUseCase => {
  return async ({ columnId }) => {
    return await repository.transaction(async (transaction) => {
      const column = await transaction.findColumnById(columnId);
      if (column === null) {
        throw new ColumnNotFoundError(columnId);
      }

      await transaction.deleteColumn(columnId);

      const remainingColumns = await transaction.findColumnsAfterPosition(column.boardId, column.position);
      for (const remainingColumn of remainingColumns) {
        await transaction.updateColumnPosition(remainingColumn.id, remainingColumn.position - 1);
      }

      return {
        boardId: column.boardId,
      };
    });
  };
};
