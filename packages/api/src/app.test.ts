import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "./app.ts";
import {
  ColumnNotFoundError,
  CreateCardValidationError,
  type CreatedCard,
} from "./features/cards/create-card.ts";
import type { BoardView } from "./features/boards/get-board.ts";

const VALID_BOARD_ID = "11111111-1111-4111-8111-111111111111";
const VALID_COLUMN_ID = "22222222-2222-4222-8222-222222222222";

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
          cards: [],
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
    await expect(response.json()).resolves.toEqual(board);
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
});
