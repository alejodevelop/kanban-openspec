import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ApiClientError } from "../../lib/api-client";
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

const buildBoard = (columns: BoardView["columns"]): BoardView => ({
  id: "11111111-1111-4111-8111-111111111111",
  title: "Delivery board",
  columns,
});

describe("BoardRoute", () => {
  beforeEach(() => {
    boardApiMocks.getBoard.mockReset();
    boardApiMocks.createCard.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading state while waiting for the API response", () => {
    boardApiMocks.getBoard.mockReturnValue(new Promise(() => {}));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));

    renderBoardRoute();

    expect(screen.getByRole("heading", { name: /cargando tablero/i })).toBeTruthy();
    expect(screen.getByText(/consultando columnas y tarjetas desde la api/i)).toBeTruthy();
  });

  it("renders the nested board contract returned by the API", async () => {
    boardApiMocks.getBoard.mockResolvedValue(
      buildBoard([
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Todo",
          position: 0,
          cards: [
            {
              id: "card-1",
              title: "Seed sample board",
              description: "Visible in the first column",
              position: 0,
            },
            {
              id: "card-2",
              title: "Connect the frontend",
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
              id: "card-3",
              title: "Validate contract consumption",
              description: "Nested object works without extra mapping",
              position: 0,
            },
          ],
        },
      ]),
    );
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));

    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const boardColumns = [
      ...screen
        .getByRole("list", { name: /columnas del tablero/i })
        .querySelectorAll<HTMLElement>(".board-column"),
    ];
    expect(within(boardColumns[0]).getByRole("heading", { name: /todo/i })).toBeTruthy();
    expect(within(boardColumns[1]).getByRole("heading", { name: /done/i })).toBeTruthy();

    const firstColumnCards = [...boardColumns[0].querySelectorAll(".card-title")].map((element) =>
      element.textContent?.trim(),
    );
    const secondColumnCards = [...boardColumns[1].querySelectorAll(".card-title")].map((element) =>
      element.textContent?.trim(),
    );

    expect(firstColumnCards).toEqual(["Seed sample board", "Connect the frontend"]);
    expect(secondColumnCards).toEqual(["Validate contract consumption"]);
    expect(screen.getByText("Visible in the first column")).toBeTruthy();
    expect(screen.getByText("Nested object works without extra mapping")).toBeTruthy();
  });

  it("shows an empty state when the board exists but has no columns", async () => {
    boardApiMocks.getBoard.mockResolvedValue(buildBoard([]));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));

    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /este tablero todavia no tiene columnas/i })).toBeTruthy();
    expect(screen.queryByRole("list", { name: /columnas del tablero/i })).toBeNull();
  });

  it("shows a not-found state when the backend reports a missing board", async () => {
    boardApiMocks.getBoard.mockRejectedValue(
      new ApiClientError("Request failed with status 404", 404, { error: "Board not found" }),
    );
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));

    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /tablero no encontrado/i })).toBeTruthy();
    expect(screen.getByText(/revisa el `boardid` de la ruta/i)).toBeTruthy();
  });

  it("shows an error state when the board request fails", async () => {
    boardApiMocks.getBoard.mockRejectedValue(
      new ApiClientError("Request failed with status 500", 500, { error: "Internal Server Error" }),
    );
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));

    renderBoardRoute();

    const errorState = await screen.findByRole("alert");
    expect(within(errorState).getByRole("heading", { name: /error al cargar/i })).toBeTruthy();
    expect(within(errorState).getByText(/no pudimos cargar el tablero/i)).toBeTruthy();
  });

  it("keeps a created card visible after reloading the page", async () => {
    const boardState: BoardView = buildBoard([
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
    ]);

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
