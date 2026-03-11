import { describe, expect, it } from "vitest";

import { BoardNotFoundError } from "../boards/board-errors.ts";
import { createReorderCardsUseCase, ReorderCardsValidationError } from "./reorder-cards.ts";

type TestState = {
  boards: Set<string>;
  columns: Array<{
    id: string;
    boardId: string;
  }>;
  cards: Array<{
    id: string;
    columnId: string;
    position: number;
  }>;
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(
    run: (repository: {
      findBoardById: (boardId: string) => Promise<{ id: string } | null>;
      findColumnsByBoardId: (boardId: string) => Promise<Array<{ id: string }>>;
      findCardsByColumnIds: (columnIds: string[]) => Promise<Array<{ id: string }>>;
      updateCardLocation: (cardId: string, columnId: string, position: number) => Promise<void>;
    }) => Promise<T>,
  ) =>
    await run({
      findBoardById: async (boardId) => (state.boards.has(boardId) ? { id: boardId } : null),
      findColumnsByBoardId: async (boardId) =>
        state.columns
          .filter((column) => column.boardId === boardId)
          .map((column) => ({
            id: column.id,
          })),
      findCardsByColumnIds: async (columnIds) =>
        state.cards
          .filter((card) => columnIds.includes(card.columnId))
          .map((card) => ({
            id: card.id,
          })),
      updateCardLocation: async (cardId, columnId, position) => {
        const card = state.cards.find((entry) => entry.id === cardId);
        if (card === undefined) {
          throw new Error(`Missing test card ${cardId}`);
        }

        card.columnId = columnId;
        card.position = position;
      },
    }),
});

const createUseCase = (state: TestState) => createReorderCardsUseCase(createRepository(state));

describe("reorder cards use case", () => {
  it("reorders cards inside the same column with contiguous positions", async () => {
    const state: TestState = {
      boards: new Set(["board-1"]),
      columns: [{ id: "column-1", boardId: "board-1" }],
      cards: [
        { id: "card-1", columnId: "column-1", position: 0 },
        { id: "card-2", columnId: "column-1", position: 1 },
        { id: "card-3", columnId: "column-1", position: 2 },
      ],
    };
    const reorderCards = createUseCase(state);

    await reorderCards({
      boardId: "board-1",
      columns: [
        {
          columnId: "column-1",
          cardIds: ["card-3", "card-1", "card-2"],
        },
      ],
    });

    expect(
      state.cards
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((card) => ({
          id: card.id,
          columnId: card.columnId,
          position: card.position,
        })),
    ).toEqual([
      { id: "card-3", columnId: "column-1", position: 0 },
      { id: "card-1", columnId: "column-1", position: 1 },
      { id: "card-2", columnId: "column-1", position: 2 },
    ]);
  });

  it("moves cards between board columns and rewrites both scopes", async () => {
    const state: TestState = {
      boards: new Set(["board-1"]),
      columns: [
        { id: "column-1", boardId: "board-1" },
        { id: "column-2", boardId: "board-1" },
      ],
      cards: [
        { id: "card-1", columnId: "column-1", position: 0 },
        { id: "card-2", columnId: "column-1", position: 1 },
        { id: "card-3", columnId: "column-2", position: 0 },
      ],
    };
    const reorderCards = createUseCase(state);

    await reorderCards({
      boardId: "board-1",
      columns: [
        {
          columnId: "column-1",
          cardIds: ["card-1"],
        },
        {
          columnId: "column-2",
          cardIds: ["card-2", "card-3"],
        },
      ],
    });

    expect(
      state.cards
        .slice()
        .sort((left, right) => left.columnId.localeCompare(right.columnId) || left.position - right.position)
        .map((card) => ({
          id: card.id,
          columnId: card.columnId,
          position: card.position,
        })),
    ).toEqual([
      { id: "card-1", columnId: "column-1", position: 0 },
      { id: "card-2", columnId: "column-2", position: 0 },
      { id: "card-3", columnId: "column-2", position: 1 },
    ]);
  });

  it("rejects payloads with inconsistent affected cards", async () => {
    const state: TestState = {
      boards: new Set(["board-1"]),
      columns: [{ id: "column-1", boardId: "board-1" }],
      cards: [
        { id: "card-1", columnId: "column-1", position: 0 },
        { id: "card-2", columnId: "column-1", position: 1 },
      ],
    };
    const reorderCards = createUseCase(state);

    await expect(
      reorderCards({
        boardId: "board-1",
        columns: [
          {
            columnId: "column-1",
            cardIds: ["card-2"],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ReorderCardsValidationError);

    expect(
      state.cards
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((card) => card.id),
    ).toEqual(["card-1", "card-2"]);
  });

  it("fails when the board does not exist", async () => {
    const reorderCards = createUseCase({
      boards: new Set(),
      columns: [],
      cards: [],
    });

    await expect(
      reorderCards({
        boardId: "missing-board",
        columns: [
          {
            columnId: "column-1",
            cardIds: [],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});
