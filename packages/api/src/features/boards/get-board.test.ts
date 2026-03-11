import { describe, expect, it, vi } from "vitest";

import { createGetBoardUseCase } from "./get-board.ts";

type TestState = {
  board: {
    id: string;
    title: string;
  } | null;
  columns: Array<{
    id: string;
    title: string;
    position: number;
  }>;
  cards: Array<{
    id: string;
    columnId: string;
    title: string;
    description: string | null;
    position: number;
  }>;
};

const createRepository = (state: TestState) => ({
  findBoardById: vi.fn(async (boardId: string) => (state.board?.id === boardId ? state.board : null)),
  findColumnsByBoardId: vi.fn(async (boardId: string) =>
    state.board?.id === boardId ? state.columns : [],
  ),
  findCardsByColumnIds: vi.fn(async (columnIds: string[]) =>
    state.cards.filter((card) => columnIds.includes(card.columnId)),
  ),
});

describe("get board use case", () => {
  it("returns null and skips nested queries when the board does not exist", async () => {
    const repository = createRepository({
      board: null,
      columns: [],
      cards: [],
    });
    const getBoard = createGetBoardUseCase(repository);

    await expect(getBoard("missing-board")).resolves.toBeNull();
    expect(repository.findBoardById).toHaveBeenCalledWith("missing-board");
    expect(repository.findColumnsByBoardId).not.toHaveBeenCalled();
    expect(repository.findCardsByColumnIds).not.toHaveBeenCalled();
  });

  it("returns the board aggregate with nested columns and cards", async () => {
    const repository = createRepository({
      board: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Delivery board",
      },
      columns: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Todo",
          position: 0,
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          title: "Done",
          position: 1,
        },
      ],
      cards: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          columnId: "22222222-2222-4222-8222-222222222222",
          title: "Seed sample board",
          description: "Debe quedar primero por posicion",
          position: 0,
        },
        {
          id: "55555555-5555-4555-8555-555555555555",
          columnId: "22222222-2222-4222-8222-222222222222",
          title: "Connect the read endpoint",
          description: null,
          position: 1,
        },
        {
          id: "66666666-6666-4666-8666-666666666666",
          columnId: "33333333-3333-4333-8333-333333333333",
          title: "Verify the frontend contract",
          description: "Debe quedar anidada en Done",
          position: 0,
        },
      ],
    });
    const getBoard = createGetBoardUseCase(repository);

    await expect(getBoard("11111111-1111-4111-8111-111111111111")).resolves.toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Delivery board",
      columns: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Todo",
          position: 0,
          cards: [
            {
              id: "44444444-4444-4444-8444-444444444444",
              title: "Seed sample board",
              description: "Debe quedar primero por posicion",
              position: 0,
            },
            {
              id: "55555555-5555-4555-8555-555555555555",
              title: "Connect the read endpoint",
              description: null,
              position: 1,
            },
          ],
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          title: "Done",
          position: 1,
          cards: [
            {
              id: "66666666-6666-4666-8666-666666666666",
              title: "Verify the frontend contract",
              description: "Debe quedar anidada en Done",
              position: 0,
            },
          ],
        },
      ],
    });
    expect(repository.findColumnsByBoardId).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(repository.findCardsByColumnIds).toHaveBeenCalledWith([
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
    ]);
  });
});
