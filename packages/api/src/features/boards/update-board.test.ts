import { describe, expect, it } from "vitest";

import { BoardNotFoundError } from "./board-errors.ts";
import type { ManagedBoard } from "./create-board.ts";
import {
  CreateBoardValidationError,
  createUpdateBoardUseCase,
} from "./update-board.ts";

type TestState = {
  boards: ManagedBoard[];
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(
    run: (repository: {
      findBoardById: (boardId: string) => Promise<{ id: string } | null>;
      updateBoard: (input: { boardId: string; title: string }) => Promise<ManagedBoard>;
    }) => Promise<T>,
  ) =>
    await run({
      findBoardById: async (boardId) => state.boards.find((board) => board.id === boardId) ?? null,
      updateBoard: async ({ boardId, title }) => {
        const board = state.boards.find((entry) => entry.id === boardId);
        if (board === undefined) {
          throw new Error(`Missing test board ${boardId}`);
        }

        board.title = title;
        return { ...board };
      },
    }),
});

describe("update board use case", () => {
  it("updates the board title with normalized data", async () => {
    const state = {
      boards: [
        {
          id: "board-1",
          title: "Antes",
        },
      ],
    };

    const updateBoard = createUpdateBoardUseCase(createRepository(state));

    await expect(
      updateBoard({
        boardId: "board-1",
        title: "  Despues  ",
      }),
    ).resolves.toEqual({
      id: "board-1",
      title: "Despues",
    });
  });

  it("rejects updates without a valid title", async () => {
    const updateBoard = createUpdateBoardUseCase(
      createRepository({
        boards: [{ id: "board-1", title: "Antes" }],
      }),
    );

    await expect(
      updateBoard({
        boardId: "board-1",
        title: "   ",
      }),
    ).rejects.toBeInstanceOf(CreateBoardValidationError);
  });

  it("fails when the board does not exist", async () => {
    const updateBoard = createUpdateBoardUseCase(createRepository({ boards: [] }));

    await expect(
      updateBoard({
        boardId: "missing-board",
        title: "Nuevo nombre",
      }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});
