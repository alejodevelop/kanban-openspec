import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { BoardRoute } from "../../routes/board-route";
import type { BoardView, CreatedCard } from "./board-api";

const boardApiMocks = vi.hoisted(() => ({
  getBoard: vi.fn(),
  createCard: vi.fn(),
}));

vi.mock("./board-api", () => ({
  boardApi: boardApiMocks,
}));

const renderBoardRoute = () =>
  render(
    <MemoryRouter initialEntries={["/boards/11111111-1111-4111-8111-111111111111"]}>
      <Routes>
        <Route path="/boards/:boardId" element={<BoardRoute />} />
      </Routes>
    </MemoryRouter>,
  );

describe("BoardRoute", () => {
  beforeEach(() => {
    boardApiMocks.getBoard.mockReset();
    boardApiMocks.createCard.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps a created card visible after reloading the page", async () => {
    const boardState: BoardView = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Delivery board",
      columns: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Todo",
          position: 0,
          cards: [
            {
              id: "card-1",
              title: "Sembrar datos base",
              description: null,
              position: 0,
            },
          ],
        },
      ],
    };

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createCard.mockImplementation(
      async (columnId: string, payload: { title: string; description?: string }): Promise<CreatedCard> => {
        const targetColumn = boardState.columns.find((column) => column.id === columnId);
        if (targetColumn === undefined) {
          throw new Error("Missing test column");
        }

        const createdCard = {
          id: `card-${targetColumn.cards.length + 1}`,
          columnId,
          title: payload.title.trim(),
          description: payload.description?.trim() ? payload.description.trim() : null,
          position: targetColumn.cards.length,
        };

        targetColumn.cards.push({
          id: createdCard.id,
          title: createdCard.title,
          description: createdCard.description,
          position: createdCard.position,
        });

        return createdCard;
      },
    );

    const user = userEvent.setup();
    const firstRender = renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const todoColumn = screen.getByRole("heading", { name: /todo/i }).closest("article");
    if (todoColumn === null) {
      throw new Error("Expected Todo column article");
    }

    await user.type(within(todoColumn).getByLabelText(/titulo para todo/i), "Nueva tarjeta");
    await user.type(
      within(todoColumn).getByLabelText(/descripcion para todo/i),
      "Visible tambien despues del reload",
    );
    await user.click(within(todoColumn).getByRole("button", { name: /crear tarjeta/i }));

    expect(await screen.findByText("Visible tambien despues del reload")).toBeTruthy();

    firstRender.unmount();
    renderBoardRoute();

    const reloadedColumn = await screen.findByRole("heading", { name: /todo/i });
    const reloadedArticle = reloadedColumn.closest("article");
    if (reloadedArticle === null) {
      throw new Error("Expected reloaded Todo column article");
    }

    const reloadedCardList = reloadedArticle.querySelector(".card-list");
    if (!(reloadedCardList instanceof HTMLElement)) {
      throw new Error("Expected card list on reloaded Todo column");
    }

    await waitFor(() => {
      expect(within(reloadedCardList).getByText("Nueva tarjeta")).toBeTruthy();
      expect(within(reloadedCardList).getByText("Visible tambien despues del reload")).toBeTruthy();
    });
  });
});
