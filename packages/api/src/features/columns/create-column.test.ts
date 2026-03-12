import { describe, expect, it } from "vitest";

import { BoardNotFoundError } from "../boards/board-errors.ts";
import {
  CreateColumnValidationError,
  createCreateColumnUseCase,
  type ManagedColumn,
} from "./create-column.ts";

type TestState = {
  boards: Set<string>;
  columns: ManagedColumn[];
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(
    run: (repository: {
      findBoardById: (boardId: string) => Promise<{ id: string } | null>;
      findLastPositionInBoard: (boardId: string) => Promise<number | null>;
      insertColumn: (input: { boardId: string; title: string; position: number }) => Promise<ManagedColumn>;
    }) => Promise<T>,
  ) =>
    await run({
      findBoardById: async (boardId) => (state.boards.has(boardId) ? { id: boardId } : null),
      findLastPositionInBoard: async (boardId) => {
        const positions = state.columns
          .filter((column) => column.boardId === boardId)
          .map((column) => column.position)
          .sort((left, right) => right - left);

        return positions[0] ?? null;
      },
      insertColumn: async ({ boardId, title, position }) => {
        const createdColumn = {
          id: `column-${state.columns.length + 1}`,
          boardId,
          title,
          position,
        };

        state.columns.push(createdColumn);
        return createdColumn;
      },
    }),
});

describe("create column use case", () => {
  it("creates a column at the end of the board", async () => {
    const state = {
      boards: new Set(["board-1"]),
      columns: [
        { id: "column-1", boardId: "board-1", title: "Todo", position: 0 },
        { id: "column-2", boardId: "board-1", title: "Doing", position: 1 },
      ],
    };
    const createColumn = createCreateColumnUseCase(createRepository(state));

    await expect(
      createColumn({
        boardId: "board-1",
        title: "  Done  ",
      }),
    ).resolves.toEqual({
      id: "column-3",
      boardId: "board-1",
      title: "Done",
      position: 2,
    });
  });

  it("rejects columns without a valid title", async () => {
    const createColumn = createCreateColumnUseCase(
      createRepository({
        boards: new Set(["board-1"]),
        columns: [],
      }),
    );

    await expect(
      createColumn({
        boardId: "board-1",
        title: "   ",
      }),
    ).rejects.toBeInstanceOf(CreateColumnValidationError);
  });

  it("fails when the board does not exist", async () => {
    const createColumn = createCreateColumnUseCase(
      createRepository({
        boards: new Set(),
        columns: [],
      }),
    );

    await expect(
      createColumn({
        boardId: "missing-board",
        title: "Todo",
      }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});
