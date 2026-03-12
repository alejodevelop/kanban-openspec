import { describe, expect, it } from "vitest";

import {
  CreateBoardValidationError,
  createCreateBoardUseCase,
  type ManagedBoard,
} from "./create-board.ts";

type TestState = {
  boards: ManagedBoard[];
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(run: (repository: { insertBoard: (input: { title: string }) => Promise<ManagedBoard> }) => Promise<T>) =>
    await run({
      insertBoard: async ({ title }) => {
        const createdBoard = {
          id: `board-${state.boards.length + 1}`,
          title,
        };

        state.boards.push(createdBoard);
        return createdBoard;
      },
    }),
});

describe("create board use case", () => {
  it("creates a board with a normalized title", async () => {
    const state = { boards: [] };
    const createBoard = createCreateBoardUseCase(createRepository(state));

    const createdBoard = await createBoard({
      title: "  Delivery board  ",
    });

    expect(createdBoard).toEqual({
      id: "board-1",
      title: "Delivery board",
    });
    expect(state.boards).toHaveLength(1);
  });

  it("rejects boards without a valid title", async () => {
    const createBoard = createCreateBoardUseCase(createRepository({ boards: [] }));

    await expect(
      createBoard({
        title: "   ",
      }),
    ).rejects.toBeInstanceOf(CreateBoardValidationError);
  });
});
