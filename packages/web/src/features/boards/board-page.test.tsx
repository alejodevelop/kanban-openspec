import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ApiClientError } from "../../lib/api-client";
import { BoardRoute } from "../../routes/board-route";
import type { BoardView, CreatedCard } from "./board-api";

const boardApiMocks = vi.hoisted(() => ({
  getBoard: vi.fn(),
  createColumn: vi.fn(),
  updateColumn: vi.fn(),
  deleteColumn: vi.fn(),
  createCard: vi.fn(),
  updateCard: vi.fn(),
  deleteCard: vi.fn(),
  reorderColumns: vi.fn(),
  reorderCards: vi.fn(),
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

const rejectUnexpectedMutations = () => {
  boardApiMocks.createColumn.mockRejectedValue(new Error("Unexpected createColumn call"));
  boardApiMocks.updateColumn.mockRejectedValue(new Error("Unexpected updateColumn call"));
  boardApiMocks.deleteColumn.mockRejectedValue(new Error("Unexpected deleteColumn call"));
  boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
  boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
  boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
  boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
  boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
};

describe("BoardRoute", () => {
  beforeEach(() => {
    boardApiMocks.getBoard.mockReset();
    boardApiMocks.createColumn.mockReset();
    boardApiMocks.updateColumn.mockReset();
    boardApiMocks.deleteColumn.mockReset();
    boardApiMocks.createCard.mockReset();
    boardApiMocks.updateCard.mockReset();
    boardApiMocks.deleteCard.mockReset();
    boardApiMocks.reorderColumns.mockReset();
    boardApiMocks.reorderCards.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows a loading state while waiting for the API response", () => {
    boardApiMocks.getBoard.mockReturnValue(new Promise(() => {}));
    rejectUnexpectedMutations();

    renderBoardRoute();

    expect(screen.getByRole("heading", { name: /cargando tablero/i })).toBeTruthy();
    expect(screen.getByText(/preparando columnas, tarjetas y acciones contextuales/i)).toBeTruthy();
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
    rejectUnexpectedMutations();

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
    rejectUnexpectedMutations();

    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /este tablero todavia no tiene columnas/i })).toBeTruthy();
    expect(await screen.findByRole("button", { name: /crear columna|nueva columna/i })).toBeTruthy();
    expect(screen.queryByRole("list", { name: /columnas del tablero/i })).toBeNull();
  });

  it("shows a not-found state when the backend reports a missing board", async () => {
    boardApiMocks.getBoard.mockRejectedValue(
      new ApiClientError("Request failed with status 404", 404, { error: "Board not found" }),
    );
    rejectUnexpectedMutations();

    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /tablero no encontrado/i })).toBeTruthy();
    expect(screen.getByText(/el `boardid` ya no existe/i)).toBeTruthy();
  });

  it("shows an error state when the board request fails", async () => {
    boardApiMocks.getBoard.mockRejectedValue(
      new ApiClientError("Request failed with status 500", 500, { error: "Internal Server Error" }),
    );
    rejectUnexpectedMutations();

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
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
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

    await user.click(within(todoColumn).getByRole("button", { name: /agregar tarjeta/i }));
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

  it("reorders columns and keeps the new order after reloading the page", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [],
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        title: "Done",
        position: 1,
        cards: [],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
    boardApiMocks.reorderColumns.mockImplementation(async (_boardId: string, payload: { columnIds: string[] }) => {
      const columnsById = new Map(boardState.columns.map((column) => [column.id, column]));
      boardState.columns = payload.columnIds.map((columnId, index) => {
        const column = columnsById.get(columnId);
        if (column === undefined) {
          throw new Error(`Missing test column ${columnId}`);
        }

        return {
          ...column,
          position: index,
        };
      });

      return structuredClone(boardState);
    });

    const user = userEvent.setup();
    const firstRender = renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const todoColumn = screen.getByRole("heading", { name: /todo/i }).closest("article");
    if (todoColumn === null) {
      throw new Error("Expected Todo column article");
    }

    await user.click(within(todoColumn).getByRole("button", { name: /mas/i }));
    await user.click(within(todoColumn).getByRole("menuitem", { name: /mover todo a la derecha/i }));

    await waitFor(() => {
      const boardColumns = [
        ...screen
          .getByRole("list", { name: /columnas del tablero/i })
          .querySelectorAll<HTMLElement>(".board-column"),
      ];

      expect(within(boardColumns[0]).getByRole("heading", { name: /done/i })).toBeTruthy();
      expect(within(boardColumns[1]).getByRole("heading", { name: /todo/i })).toBeTruthy();
    });

    firstRender.unmount();
    renderBoardRoute();

    await waitFor(() => {
      const boardColumns = [
        ...screen
          .getByRole("list", { name: /columnas del tablero/i })
          .querySelectorAll<HTMLElement>(".board-column"),
      ];

      expect(within(boardColumns[0]).getByRole("heading", { name: /done/i })).toBeTruthy();
      expect(within(boardColumns[1]).getByRole("heading", { name: /todo/i })).toBeTruthy();
    });
  });

  it("reorders cards inside the same column through the board controls", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [
          {
            id: "card-1",
            title: "Definir alcance",
            description: null,
            position: 0,
          },
          {
            id: "card-2",
            title: "Probar reorder",
            description: null,
            position: 1,
          },
        ],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockImplementation(
      async (_boardId: string, payload: { columns: Array<{ columnId: string; cardIds: string[] }> }) => {
        boardState.columns = boardState.columns.map((column) => {
          const update = payload.columns.find((entry) => entry.columnId === column.id);
          if (update === undefined) {
            return column;
          }

          const cardsById = new Map(column.cards.map((card) => [card.id, card]));
          return {
            ...column,
            cards: update.cardIds.map((cardId, index) => {
              const card = cardsById.get(cardId);
              if (card === undefined) {
                throw new Error(`Missing test card ${cardId}`);
              }

              return {
                ...card,
                position: index,
              };
            }),
          };
        });

        return structuredClone(boardState);
      },
    );

    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const firstCard = screen.getByText("Definir alcance").closest("li");
    if (firstCard === null) {
      throw new Error("Expected first card list item");
    }

    await user.click(within(firstCard).getByRole("button", { name: /mas/i }));
    await user.click(within(firstCard).getByRole("menuitem", { name: /bajar definir alcance/i }));

    await waitFor(() => {
      const cardTitles = [...screen.getAllByText(/definir alcance|probar reorder/i)].map((element) =>
        element.textContent?.trim(),
      );

      expect(cardTitles).toEqual(["Probar reorder", "Definir alcance"]);
    });
  });

  it("moves a card to another column through the board controls", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [
          {
            id: "card-1",
            title: "Redactar alcance",
            description: null,
            position: 0,
          },
        ],
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        title: "Done",
        position: 1,
        cards: [],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockImplementation(
      async (_boardId: string, payload: { columns: Array<{ columnId: string; cardIds: string[] }> }) => {
        const cardsById = new Map(
          boardState.columns.flatMap((column) =>
            column.cards.map((card) => [
              card.id,
              {
                ...card,
              },
            ]),
          ),
        );

        boardState.columns = boardState.columns.map((column) => {
          const update = payload.columns.find((entry) => entry.columnId === column.id);
          if (update === undefined) {
            return column;
          }

          return {
            ...column,
            cards: update.cardIds.map((cardId, index) => {
              const card = cardsById.get(cardId);
              if (card === undefined) {
                throw new Error(`Missing test card ${cardId}`);
              }

              return {
                ...card,
                position: index,
              };
            }),
          };
        });

        return structuredClone(boardState);
      },
    );

    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const cardItem = screen.getByText("Redactar alcance").closest("li");
    if (cardItem === null) {
      throw new Error("Expected card list item");
    }

    await user.click(within(cardItem).getByRole("button", { name: /mas/i }));
    await user.click(within(cardItem).getByRole("menuitem", { name: /mover redactar alcance a done/i }));

    await waitFor(() => {
      const doneColumn = screen.getByRole("heading", { name: /done/i }).closest("article");
      if (doneColumn === null) {
        throw new Error("Expected Done column article");
      }

      expect(within(doneColumn).getByText("Redactar alcance")).toBeTruthy();
    });
  });

  it("restores the previous board and shows an error when a reorder fails", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [],
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        title: "Done",
        position: 1,
        cards: [],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
    boardApiMocks.reorderColumns.mockRejectedValue(
      new ApiClientError("Request failed with status 500", 500, { error: "Internal Server Error" }),
    );

    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const todoColumn = screen.getByRole("heading", { name: /todo/i }).closest("article");
    if (todoColumn === null) {
      throw new Error("Expected Todo column article");
    }

    await user.click(within(todoColumn).getByRole("button", { name: /mas/i }));
    await user.click(within(todoColumn).getByRole("menuitem", { name: /mover todo a la derecha/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/no pudimos guardar el nuevo orden/i)).toBeTruthy();
    });

    const boardColumns = [
      ...screen.getByRole("list", { name: /columnas del tablero/i }).querySelectorAll<HTMLElement>(".board-column"),
    ];

    expect(within(boardColumns[0]).getByRole("heading", { name: /todo/i })).toBeTruthy();
    expect(within(boardColumns[1]).getByRole("heading", { name: /done/i })).toBeTruthy();
  });

  it("edits a created card without reloading the page", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.createCard.mockImplementation(
      async (columnId: string, payload: { title: string; description?: string }): Promise<CreatedCard> => {
        const createdCard = {
          id: "card-1",
          columnId,
          title: payload.title.trim(),
          description: payload.description?.trim() ? payload.description.trim() : null,
          position: 0,
        };

        boardState.columns[0]?.cards.push({
          id: createdCard.id,
          title: createdCard.title,
          description: createdCard.description,
          position: createdCard.position,
        });

        return createdCard;
      },
    );
    boardApiMocks.updateCard.mockImplementation(
      async (cardId: string, payload: { title: string; description?: string }): Promise<CreatedCard> => {
        const firstColumn = boardState.columns[0];
        if (firstColumn === undefined) {
          throw new Error("Missing test column");
        }

        const card = firstColumn.cards.find((entry) => entry.id === cardId);
        if (card === undefined) {
          throw new Error("Missing test card");
        }

        card.title = payload.title.trim();
        card.description = payload.description?.trim() ? payload.description.trim() : null;

        return {
          id: card.id,
          columnId: firstColumn.id,
          title: card.title,
          description: card.description,
          position: card.position,
        };
      },
    );

    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const todoColumn = screen.getByRole("heading", { name: /todo/i }).closest("article");
    if (todoColumn === null) {
      throw new Error("Expected Todo column article");
    }

    await user.click(within(todoColumn).getByRole("button", { name: /agregar tarjeta/i }));
    await user.type(within(todoColumn).getByLabelText(/titulo para todo/i), "Nueva tarjeta");
    await user.type(within(todoColumn).getByLabelText(/descripcion para todo/i), "Borrador inicial");
    await user.click(within(todoColumn).getByRole("button", { name: /crear tarjeta/i }));

    expect(await screen.findByText("Borrador inicial")).toBeTruthy();
    expect(boardApiMocks.getBoard).toHaveBeenCalledTimes(1);

    const createdCard = screen.getByText("Nueva tarjeta").closest("li");
    if (createdCard === null) {
      throw new Error("Expected created card list item");
    }

    await user.click(within(createdCard).getByRole("button", { name: /mas/i }));
    await user.click(within(createdCard).getByRole("menuitem", { name: /^editar$/i }));

    const editDialog = await screen.findByRole("dialog", { name: /editar tarjeta/i });
    const titleField = within(editDialog).getByLabelText(/titulo de la tarjeta/i) as HTMLInputElement;
    const descriptionField = within(editDialog).getByRole("textbox", {
      name: /descripcion de la tarjeta/i,
    }) as HTMLTextAreaElement;

    fireEvent.change(titleField, { target: { value: "Tarjeta ajustada" } });
    fireEvent.change(descriptionField, { target: { value: "Actualizada sin reload completo" } });
    await user.click(within(editDialog).getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText("Tarjeta ajustada")).toBeTruthy();
      expect(screen.getByText("Actualizada sin reload completo")).toBeTruthy();
    });
    expect(boardApiMocks.getBoard).toHaveBeenCalledTimes(1);
  });

  it("removes a deleted card from the board and keeps it absent after reloading", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [
          {
            id: "card-1",
            title: "Tarjeta descartable",
            description: "Se elimina con confirmacion",
            position: 0,
          },
        ],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
    boardApiMocks.deleteCard.mockImplementation(async (cardId: string) => {
      const firstColumn = boardState.columns[0];
      if (firstColumn !== undefined) {
        firstColumn.cards = firstColumn.cards.filter((card) => card.id !== cardId);
      }
    });

    const user = userEvent.setup();
    const firstRender = renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();
    expect(screen.getByText("Tarjeta descartable")).toBeTruthy();

    const disposableCard = screen.getByText("Tarjeta descartable").closest("li");
    if (disposableCard === null) {
      throw new Error("Expected disposable card list item");
    }

    await user.click(within(disposableCard).getByRole("button", { name: /mas/i }));
    await user.click(within(disposableCard).getByRole("menuitem", { name: /^eliminar$/i }));

    const deleteDialog = screen.getByRole("dialog", { name: /eliminar tarjeta descartable/i });
    await user.click(within(deleteDialog).getByRole("button", { name: /^eliminar$/i }));

    await waitFor(() => {
      expect(screen.queryByText("Tarjeta descartable")).toBeNull();
    });

    firstRender.unmount();
    renderBoardRoute();

    await screen.findByRole("heading", { name: /delivery board/i });
    expect(screen.queryByText("Tarjeta descartable")).toBeNull();
  });

  it("creates a column from the board view and reloads the board", async () => {
    const boardState: BoardView = buildBoard([]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
    boardApiMocks.updateColumn.mockRejectedValue(new Error("Unexpected updateColumn call"));
    boardApiMocks.deleteColumn.mockRejectedValue(new Error("Unexpected deleteColumn call"));
    boardApiMocks.createColumn.mockImplementation(async (_boardId: string, payload: { title: string }) => {
      boardState.columns.push({
        id: "column-1",
        title: payload.title.trim(),
        position: 0,
        cards: [],
      });

      return {
        id: "column-1",
        boardId: boardState.id,
        title: payload.title.trim(),
        position: 0,
      };
    });

    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const createColumnControl = await screen.findByRole("button", { name: /crear columna|nueva columna/i });
    if (/nueva columna/i.test(createColumnControl.textContent ?? "")) {
      await user.click(createColumnControl);
    }

    await user.type(screen.getByLabelText(/titulo de la nueva columna/i), "Done");
    await user.click(screen.getByRole("button", { name: /crear columna/i }));

    expect(boardApiMocks.createColumn).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
      title: "Done",
    });
    expect(await screen.findByRole("heading", { name: /done/i })).toBeTruthy();
  });

  it("renames a column from the board view", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createColumn.mockRejectedValue(new Error("Unexpected createColumn call"));
    boardApiMocks.deleteColumn.mockRejectedValue(new Error("Unexpected deleteColumn call"));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
    boardApiMocks.updateColumn.mockImplementation(async (columnId: string, payload: { title: string }) => {
      const column = boardState.columns.find((entry) => entry.id === columnId);
      if (column === undefined) {
        throw new Error("Missing test column");
      }

      column.title = payload.title.trim();
      return {
        id: column.id,
        boardId: boardState.id,
        title: column.title,
        position: column.position,
      };
    });
    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const todoColumn = screen.getByRole("heading", { name: /todo/i }).closest("article");
    if (todoColumn === null) {
      throw new Error("Expected Todo column article");
    }

    await user.click(within(todoColumn).getByRole("button", { name: /mas/i }));
    await user.click(within(todoColumn).getByRole("menuitem", { name: /^renombrar$/i }));

    const renameDialog = await screen.findByRole("dialog", { name: /renombrar todo/i });
    const titleField = within(renameDialog).getByLabelText(/titulo de la columna/i) as HTMLInputElement;
    fireEvent.change(titleField, { target: { value: "Doing" } });
    await waitFor(() => {
      expect(titleField.value).toBe("Doing");
    });
    await user.click(within(renameDialog).getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(boardApiMocks.updateColumn).toHaveBeenCalledWith("22222222-2222-4222-8222-222222222222", {
        title: "Doing",
      });
    });
    expect(await screen.findByRole("heading", { name: /doing/i })).toBeTruthy();
  });

  it("deletes a column from the board view after confirmation", async () => {
    const boardState: BoardView = buildBoard([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Todo",
        position: 0,
        cards: [],
      },
    ]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createColumn.mockRejectedValue(new Error("Unexpected createColumn call"));
    boardApiMocks.updateColumn.mockRejectedValue(new Error("Unexpected updateColumn call"));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));
    boardApiMocks.deleteColumn.mockImplementation(async (columnId: string) => {
      boardState.columns = boardState.columns.filter((column) => column.id !== columnId);
      return { boardId: boardState.id };
    });
    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const todoColumn = screen.getByRole("heading", { name: /todo/i }).closest("article");
    if (todoColumn === null) {
      throw new Error("Expected Todo column article");
    }

    await user.click(within(todoColumn).getByRole("button", { name: /mas/i }));
    await user.click(within(todoColumn).getByRole("menuitem", { name: /^eliminar$/i }));

    const deleteDialog = screen.getByRole("dialog", { name: /eliminar todo/i });
    await user.click(within(deleteDialog).getByRole("button", { name: /^eliminar$/i }));

    expect(boardApiMocks.deleteColumn).toHaveBeenCalledWith("22222222-2222-4222-8222-222222222222");
    expect(await screen.findByRole("heading", { name: /este tablero todavia no tiene columnas/i })).toBeTruthy();
  });

  it("shows a validation message when creating a column fails", async () => {
    const boardState: BoardView = buildBoard([]);

    boardApiMocks.getBoard.mockImplementation(async () => structuredClone(boardState));
    boardApiMocks.createColumn.mockRejectedValue(
      new ApiClientError("Request failed with status 400", 400, { error: "Title is required" }),
    );
    boardApiMocks.updateColumn.mockRejectedValue(new Error("Unexpected updateColumn call"));
    boardApiMocks.deleteColumn.mockRejectedValue(new Error("Unexpected deleteColumn call"));
    boardApiMocks.createCard.mockRejectedValue(new Error("Unexpected createCard call"));
    boardApiMocks.updateCard.mockRejectedValue(new Error("Unexpected updateCard call"));
    boardApiMocks.deleteCard.mockRejectedValue(new Error("Unexpected deleteCard call"));
    boardApiMocks.reorderColumns.mockRejectedValue(new Error("Unexpected reorderColumns call"));
    boardApiMocks.reorderCards.mockRejectedValue(new Error("Unexpected reorderCards call"));

    const user = userEvent.setup();
    renderBoardRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    await user.type(screen.getByLabelText(/titulo de la nueva columna/i), "   ");
    await user.click(screen.getByRole("button", { name: /crear columna/i }));

    expect(await screen.findByText(/ingresa un titulo valido para crear la columna/i)).toBeTruthy();
  });
});
