import { describe, expect, it } from "vitest";

import { BoardNotFoundError } from "./board-errors.ts";
import { createDeleteBoardUseCase } from "./delete-board.ts";

type TestState = {
  boards: Array<{ id: string }>;
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(
    run: (repository: {
      findBoardById: (boardId: string) => Promise<{ id: string } | null>;
      deleteBoard: (boardId: string) => Promise<void>;
    }) => Promise<T>,
  ) =>
    await run({
      findBoardById: async (boardId) => state.boards.find((board) => board.id === boardId) ?? null,
      deleteBoard: async (boardId) => {
        state.boards = state.boards.filter((board) => board.id !== boardId);
      },
    }),
});

describe("delete board use case", () => {
  it("deletes an existing board", async () => {
    const state = {
      boards: [{ id: "board-1" }, { id: "board-2" }],
    };
    const deleteBoard = createDeleteBoardUseCase(createRepository(state));

    await deleteBoard({ boardId: "board-1" });

    expect(state.boards).toEqual([{ id: "board-2" }]);
  });

  it("fails when the board does not exist", async () => {
    const deleteBoard = createDeleteBoardUseCase(createRepository({ boards: [] }));

    await expect(deleteBoard({ boardId: "missing-board" })).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});
