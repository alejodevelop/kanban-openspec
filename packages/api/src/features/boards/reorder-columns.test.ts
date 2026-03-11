import { describe, expect, it } from "vitest";

import { BoardNotFoundError } from "./board-errors.ts";
import {
  createReorderColumnsUseCase,
  ReorderColumnsValidationError,
  type ReorderColumnsInput,
} from "./reorder-columns.ts";

type TestState = {
  boards: Set<string>;
  columns: Array<{
    id: string;
    boardId: string;
    position: number;
  }>;
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(
    run: (repository: {
      findBoardById: (boardId: string) => Promise<{ id: string } | null>;
      findColumnsByBoardId: (boardId: string) => Promise<Array<{ id: string; position: number }>>;
      updateColumnPosition: (columnId: string, position: number) => Promise<void>;
    }) => Promise<T>,
  ) =>
    await run({
      findBoardById: async (boardId) => (state.boards.has(boardId) ? { id: boardId } : null),
      findColumnsByBoardId: async (boardId) =>
        state.columns
          .filter((column) => column.boardId === boardId)
          .sort((left, right) => left.position - right.position)
          .map((column) => ({
            id: column.id,
            position: column.position,
          })),
      updateColumnPosition: async (columnId, position) => {
        const column = state.columns.find((entry) => entry.id === columnId);
        if (column === undefined) {
          throw new Error(`Missing test column ${columnId}`);
        }

        column.position = position;
      },
    }),
});

const createUseCase = (state: TestState) => createReorderColumnsUseCase(createRepository(state));

describe("reorder columns use case", () => {
  it("rewrites board column positions contiguously", async () => {
    const state: TestState = {
      boards: new Set(["board-1"]),
      columns: [
        { id: "column-1", boardId: "board-1", position: 0 },
        { id: "column-2", boardId: "board-1", position: 1 },
        { id: "column-3", boardId: "board-1", position: 2 },
      ],
    };
    const reorderColumns = createUseCase(state);

    await reorderColumns({
      boardId: "board-1",
      columnIds: ["column-3", "column-1", "column-2"],
    } satisfies ReorderColumnsInput);

    expect(
      state.columns
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((column) => ({
          id: column.id,
          position: column.position,
        })),
    ).toEqual([
      { id: "column-3", position: 0 },
      { id: "column-1", position: 1 },
      { id: "column-2", position: 2 },
    ]);
  });

  it("rejects payloads that do not cover the full board scope", async () => {
    const state: TestState = {
      boards: new Set(["board-1"]),
      columns: [
        { id: "column-1", boardId: "board-1", position: 0 },
        { id: "column-2", boardId: "board-1", position: 1 },
      ],
    };
    const reorderColumns = createUseCase(state);

    await expect(
      reorderColumns({
        boardId: "board-1",
        columnIds: ["column-2"],
      }),
    ).rejects.toBeInstanceOf(ReorderColumnsValidationError);

    expect(
      state.columns
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((column) => column.id),
    ).toEqual(["column-1", "column-2"]);
  });

  it("fails when the board does not exist", async () => {
    const reorderColumns = createUseCase({
      boards: new Set(),
      columns: [],
    });

    await expect(
      reorderColumns({
        boardId: "missing-board",
        columnIds: ["column-1"],
      }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});
