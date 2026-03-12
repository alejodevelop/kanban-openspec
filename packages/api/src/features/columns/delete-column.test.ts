import { describe, expect, it } from "vitest";

import { createDeleteColumnUseCase } from "./delete-column.ts";
import { ColumnNotFoundError } from "./column-errors.ts";

type TestState = {
  columns: Array<{
    id: string;
    boardId: string;
    position: number;
  }>;
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(
    run: (repository: {
      findColumnById: (columnId: string) => Promise<{ id: string; boardId: string; position: number } | null>;
      deleteColumn: (columnId: string) => Promise<void>;
      findColumnsAfterPosition: (boardId: string, position: number) => Promise<Array<{ id: string; position: number }>>;
      updateColumnPosition: (columnId: string, position: number) => Promise<void>;
    }) => Promise<T>,
  ) =>
    await run({
      findColumnById: async (columnId) => state.columns.find((column) => column.id === columnId) ?? null,
      deleteColumn: async (columnId) => {
        state.columns = state.columns.filter((column) => column.id !== columnId);
      },
      findColumnsAfterPosition: async (boardId, position) =>
        state.columns
          .filter((column) => column.boardId === boardId && column.position > position)
          .sort((left, right) => left.position - right.position)
          .map((column) => ({ id: column.id, position: column.position })),
      updateColumnPosition: async (columnId, position) => {
        const column = state.columns.find((entry) => entry.id === columnId);
        if (column === undefined) {
          throw new Error(`Missing test column ${columnId}`);
        }

        column.position = position;
      },
    }),
});

describe("delete column use case", () => {
  it("removes a column and compacts the remaining positions", async () => {
    const state = {
      columns: [
        { id: "column-1", boardId: "board-1", position: 0 },
        { id: "column-2", boardId: "board-1", position: 1 },
        { id: "column-3", boardId: "board-1", position: 2 },
      ],
    };
    const deleteColumn = createDeleteColumnUseCase(createRepository(state));

    await expect(deleteColumn({ columnId: "column-2" })).resolves.toEqual({
      boardId: "board-1",
    });

    expect(state.columns).toEqual([
      { id: "column-1", boardId: "board-1", position: 0 },
      { id: "column-3", boardId: "board-1", position: 1 },
    ]);
  });

  it("fails when the column does not exist", async () => {
    const deleteColumn = createDeleteColumnUseCase(createRepository({ columns: [] }));

    await expect(deleteColumn({ columnId: "missing-column" })).rejects.toBeInstanceOf(ColumnNotFoundError);
  });
});
