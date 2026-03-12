import { describe, expect, it } from "vitest";

import type { BoardView } from "./board-api";
import { BOARD_DRAG_CARD, getCardDragPlan, getColumnReorderPlan } from "./board-reorder";

const buildBoard = (columns: BoardView["columns"]): BoardView => ({
  id: "11111111-1111-4111-8111-111111111111",
  title: "Delivery board",
  columns,
});

describe("board-reorder", () => {
  it("builds a column drag plan that swaps board positions", () => {
    const board = buildBoard([
      { id: "todo", title: "Todo", position: 0, cards: [] },
      { id: "done", title: "Done", position: 1, cards: [] },
    ]);

    const plan = getColumnReorderPlan(board, "todo", "done");

    expect(plan).not.toBeNull();
    expect(plan?.columnIds).toEqual(["done", "todo"]);
    expect(plan?.board.columns.map((column) => ({ id: column.id, position: column.position }))).toEqual([
      { id: "done", position: 0 },
      { id: "todo", position: 1 },
    ]);
  });

  it("builds a card drag plan inside the same column", () => {
    const board = buildBoard([
      {
        id: "todo",
        title: "Todo",
        position: 0,
        cards: [
          { id: "card-1", title: "Definir alcance", description: null, position: 0 },
          { id: "card-2", title: "Probar reorder", description: null, position: 1 },
        ],
      },
    ]);

    const plan = getCardDragPlan(board, "card-1", {
      type: BOARD_DRAG_CARD,
      columnId: "todo",
      cardId: "card-2",
    });

    expect(plan).not.toBeNull();
    expect(plan?.columns).toEqual([{ columnId: "todo", cardIds: ["card-2", "card-1"] }]);
    expect(plan?.board.columns[0]?.cards.map((card) => ({ id: card.id, position: card.position }))).toEqual([
      { id: "card-2", position: 0 },
      { id: "card-1", position: 1 },
    ]);
  });

  it("builds a card drag plan across columns", () => {
    const board = buildBoard([
      {
        id: "todo",
        title: "Todo",
        position: 0,
        cards: [{ id: "card-1", title: "Redactar alcance", description: null, position: 0 }],
      },
      {
        id: "done",
        title: "Done",
        position: 1,
        cards: [{ id: "card-2", title: "Revisado", description: null, position: 0 }],
      },
    ]);

    const plan = getCardDragPlan(board, "card-1", {
      type: BOARD_DRAG_CARD,
      columnId: "done",
      cardId: "card-2",
    });

    expect(plan).not.toBeNull();
    expect(plan?.columns).toEqual([
      { columnId: "todo", cardIds: [] },
      { columnId: "done", cardIds: ["card-1", "card-2"] },
    ]);
    expect(plan?.board.columns[0]?.cards).toEqual([]);
    expect(plan?.board.columns[1]?.cards.map((card) => ({ id: card.id, position: card.position }))).toEqual([
      { id: "card-1", position: 0 },
      { id: "card-2", position: 1 },
    ]);
  });
});
