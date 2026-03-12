import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "./app.ts";
import { BoardNotFoundError } from "./features/boards/board-errors.ts";
import {
  ColumnNotFoundError,
  CreateCardValidationError,
  type CreatedCard,
} from "./features/cards/create-card.ts";
import { CardNotFoundError, type UpdateCardUseCase } from "./features/cards/update-card.ts";
import type { DeleteCardUseCase } from "./features/cards/delete-card.ts";
import { ReorderColumnsValidationError } from "./features/boards/reorder-columns.ts";
import { ReorderCardsValidationError } from "./features/cards/reorder-cards.ts";
import type { BoardView } from "./features/boards/get-board.ts";
import type { BoardSummary } from "./features/boards/list-boards.ts";

const VALID_BOARD_ID = "11111111-1111-4111-8111-111111111111";
const VALID_COLUMN_ID = "22222222-2222-4222-8222-222222222222";
const VALID_CARD_ID = "44444444-4444-4444-8444-444444444444";

const openServer = async (app: ReturnType<typeof createApp>) => {
  return await new Promise<import("node:http").Server>((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.on("error", reject);
  });
};

const getBaseUrl = (server: import("node:http").Server): string => {
  const address = server.address() as AddressInfo | null;
  if (address === null) {
    throw new Error("Expected test server to expose an address");
  }

  return `http://127.0.0.1:${address.port}`;
};

describe("app business routes", () => {
  const openServers = new Set<import("node:http").Server>();

  afterEach(async () => {
    await Promise.all(
      [...openServers].map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }),
      ),
    );
    openServers.clear();
  });

  it("returns a board aggregate from the read endpoint", async () => {
    const board: BoardView = {
      id: VALID_BOARD_ID,
      title: "Delivery board",
      columns: [
        {
          id: VALID_COLUMN_ID,
          title: "Todo",
          position: 0,
          cards: [
            {
              id: "card-1",
              title: "Seed sample board",
              description: "Datos visibles para el frontend",
              position: 0,
            },
            {
              id: "card-2",
              title: "Connect GET /api/boards/:boardId",
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
              title: "Verify nested contract",
              description: "Board -> columns -> cards",
              position: 0,
            },
          ],
        },
      ],
    };

    const app = createApp({
      getBoard: async (boardId) => (boardId === VALID_BOARD_ID ? board : null),
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards/${VALID_BOARD_ID}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    await expect(response.json()).resolves.toEqual(board);
  });

  it("returns the board collection with summary counts", async () => {
    const boards: BoardSummary[] = [
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Alpha board",
        columnCount: 0,
        cardCount: 0,
      },
      {
        id: VALID_BOARD_ID,
        title: "Delivery board",
        columnCount: 2,
        cardCount: 3,
      },
    ];

    const app = createApp({
      listBoards: async () => boards,
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(boards);
  });

  it("returns an empty collection when no boards exist", async () => {
    const app = createApp({
      listBoards: async () => [],
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it("returns not found when the requested board does not exist", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards/${VALID_BOARD_ID}`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Board not found",
    });
  });

  it("answers CORS preflight requests for browser clients", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/columns/${VALID_COLUMN_ID}/cards`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-methods")).toContain("PATCH");
    expect(response.headers.get("access-control-allow-methods")).toContain("DELETE");
    expect(response.headers.get("access-control-allow-headers")).toContain("Content-Type");
  });

  it("rejects invalid board identifiers before calling the use case", async () => {
    const app = createApp({
      getBoard: async () => {
        throw new Error("Should not be called for invalid identifiers");
      },
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards/not-a-uuid`);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid boardId",
    });
  });

  it("creates a card through the column mutation endpoint", async () => {
    const createdCard: CreatedCard = {
      id: "card-1",
      columnId: VALID_COLUMN_ID,
      title: "Nueva tarjeta",
      description: null,
      position: 2,
    };
    const app = createApp({
      getBoard: async () => null,
      createCard: async ({ columnId, title }) => ({
        ...createdCard,
        columnId,
        title: String(title).trim(),
      }),
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/columns/${VALID_COLUMN_ID}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "  Nueva tarjeta  ",
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ...createdCard,
      title: "Nueva tarjeta",
    });
  });

  it("returns a client error when card payload validation fails", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new CreateCardValidationError("Title is required");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/columns/${VALID_COLUMN_ID}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "   ",
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Title is required",
    });
  });

  it("returns not found when the target column does not exist", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async ({ columnId }) => {
        throw new ColumnNotFoundError(columnId);
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/columns/${VALID_COLUMN_ID}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Nueva tarjeta",
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Column not found",
    });
  });

  it("updates a card through the card mutation endpoint", async () => {
    const updateCard: UpdateCardUseCase = async ({ cardId, title, description }) => ({
      id: cardId,
      columnId: VALID_COLUMN_ID,
      title: String(title).trim(),
      description: typeof description === "string" && description.trim() !== "" ? description.trim() : null,
      position: 0,
    });

    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      updateCard,
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/cards/${VALID_CARD_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "  Tarjeta editada  ",
        description: "  Ajustada en el modal  ",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: VALID_CARD_ID,
      columnId: VALID_COLUMN_ID,
      title: "Tarjeta editada",
      description: "Ajustada en el modal",
      position: 0,
    });
  });

  it("returns a client error when card update validation fails", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      updateCard: async () => {
        throw new CreateCardValidationError("Title is required");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/cards/${VALID_CARD_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "   ",
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Title is required",
    });
  });

  it("returns not found when updating a missing card", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      updateCard: async ({ cardId }) => {
        throw new CardNotFoundError(cardId);
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/cards/${VALID_CARD_ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Tarjeta editada",
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Card not found",
    });
  });

  it("deletes a card through the card mutation endpoint", async () => {
    const deletedCardIds: string[] = [];
    const deleteCard: DeleteCardUseCase = async ({ cardId }) => {
      deletedCardIds.push(cardId);
    };

    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      deleteCard,
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/cards/${VALID_CARD_ID}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);
    expect(deletedCardIds).toEqual([VALID_CARD_ID]);
  });

  it("returns not found when deleting a missing card", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      deleteCard: async ({ cardId }) => {
        throw new CardNotFoundError(cardId);
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/cards/${VALID_CARD_ID}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Card not found",
    });
  });

  it("reorders columns through the board mutation endpoint", async () => {
    let board: BoardView = {
      id: VALID_BOARD_ID,
      title: "Delivery board",
      columns: [
        {
          id: VALID_COLUMN_ID,
          title: "Todo",
          position: 0,
          cards: [],
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          title: "Doing",
          position: 1,
          cards: [],
        },
      ],
    };

    const app = createApp({
      getBoard: async (boardId) => (boardId === VALID_BOARD_ID ? board : null),
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      reorderColumns: async ({ boardId, columnIds }) => {
        if (boardId !== VALID_BOARD_ID || !Array.isArray(columnIds)) {
          throw new Error("Unexpected reorderColumns call");
        }

        const columnsById = new Map(board.columns.map((column) => [column.id, column]));
        board = {
          ...board,
          columns: columnIds.map((columnId, index) => {
            const column = columnsById.get(String(columnId));
            if (column === undefined) {
              throw new Error(`Missing test column ${String(columnId)}`);
            }

            return {
              ...column,
              position: index,
            };
          }),
        };
      },
      reorderCards: async () => {
        throw new Error("Unexpected reorderCards call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards/${VALID_BOARD_ID}/columns/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        columnIds: ["33333333-3333-4333-8333-333333333333", VALID_COLUMN_ID],
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      columns: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          position: 0,
        },
        {
          id: VALID_COLUMN_ID,
          position: 1,
        },
      ],
    });
  });

  it("reorders cards between columns through the board mutation endpoint", async () => {
    let board: BoardView = {
      id: VALID_BOARD_ID,
      title: "Delivery board",
      columns: [
        {
          id: VALID_COLUMN_ID,
          title: "Todo",
          position: 0,
          cards: [
            {
              id: "card-1",
              title: "Primera",
              description: null,
              position: 0,
            },
            {
              id: "card-2",
              title: "Segunda",
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
              title: "Tercera",
              description: null,
              position: 0,
            },
          ],
        },
      ],
    };

    const app = createApp({
      getBoard: async (boardId) => (boardId === VALID_BOARD_ID ? board : null),
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      reorderColumns: async () => {
        throw new Error("Unexpected reorderColumns call");
      },
      reorderCards: async ({ boardId, columns }) => {
        if (boardId !== VALID_BOARD_ID || !Array.isArray(columns)) {
          throw new Error("Unexpected reorderCards call");
        }

        const cardsById = new Map(
          board.columns.flatMap((column) =>
            column.cards.map((card) => [
              card.id,
              {
                ...card,
              },
            ]),
          ),
        );

        board = {
          ...board,
          columns: board.columns.map((column) => {
            const payload = columns.find(
              (entry): entry is { columnId: string; cardIds: string[] } =>
                typeof entry === "object" &&
                entry !== null &&
                "columnId" in entry &&
                "cardIds" in entry &&
                (entry as { columnId?: unknown }).columnId === column.id &&
                Array.isArray((entry as { cardIds?: unknown }).cardIds),
            );

            if (payload === undefined) {
              return column;
            }

            return {
              ...column,
              cards: payload.cardIds.map((cardId, index) => {
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
          }),
        };
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards/${VALID_BOARD_ID}/cards/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        columns: [
          {
            columnId: VALID_COLUMN_ID,
            cardIds: ["card-1"],
          },
          {
            columnId: "33333333-3333-4333-8333-333333333333",
            cardIds: ["card-2", "card-3"],
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      columns: [
        {
          id: VALID_COLUMN_ID,
          cards: [{ id: "card-1", position: 0 }],
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          cards: [
            { id: "card-2", position: 0 },
            { id: "card-3", position: 1 },
          ],
        },
      ],
    });
  });

  it("returns a client error when the reorder payload is invalid", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      reorderColumns: async () => {
        throw new ReorderColumnsValidationError(
          "Column reorder payload must include each board column exactly once",
        );
      },
      reorderCards: async () => {
        throw new Error("Unexpected reorderCards call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards/${VALID_BOARD_ID}/columns/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        columnIds: [VALID_COLUMN_ID],
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Column reorder payload must include each board column exactly once",
    });
  });

  it("returns not found when the board reorder target does not exist", async () => {
    const app = createApp({
      getBoard: async () => null,
      createCard: async () => {
        throw new Error("Unexpected createCard call");
      },
      reorderColumns: async ({ boardId }) => {
        throw new BoardNotFoundError(boardId);
      },
      reorderCards: async () => {
        throw new ReorderCardsValidationError("Unexpected reorderCards call");
      },
    });
    const server = await openServer(app);
    openServers.add(server);

    const response = await fetch(`${getBaseUrl(server)}/api/boards/${VALID_BOARD_ID}/columns/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        columnIds: [VALID_COLUMN_ID],
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Board not found",
    });
  });
});
