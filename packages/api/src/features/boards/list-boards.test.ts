import { describe, expect, it, vi } from "vitest";

import { createListBoardsUseCase } from "./list-boards.ts";

type BoardSummary = {
  id: string;
  title: string;
  columnCount: number;
  cardCount: number;
};

const createRepository = (boards: BoardSummary[]) => ({
  listBoards: vi.fn(async () => boards),
});

describe("list boards use case", () => {
  it("returns boards in the repository order with summary counts", async () => {
    const repository = createRepository([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Alpha board",
        columnCount: 0,
        cardCount: 0,
      },
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Delivery board",
        columnCount: 2,
        cardCount: 3,
      },
    ]);
    const listBoards = createListBoardsUseCase(repository);

    await expect(listBoards()).resolves.toEqual([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Alpha board",
        columnCount: 0,
        cardCount: 0,
      },
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Delivery board",
        columnCount: 2,
        cardCount: 3,
      },
    ]);
    expect(repository.listBoards).toHaveBeenCalledTimes(1);
  });

  it("returns an empty collection when no boards are available", async () => {
    const repository = createRepository([]);
    const listBoards = createListBoardsUseCase(repository);

    await expect(listBoards()).resolves.toEqual([]);
    expect(repository.listBoards).toHaveBeenCalledTimes(1);
  });
});
