import { eq } from "drizzle-orm";

import { loadEnv } from "../config/env.ts";
import { createDatabaseClient } from "../db/client.ts";
import { boards, cards as cardsTable, columns as columnsTable } from "../db/schema/index.ts";

const DEMO_BOARD_ID = "11111111-1111-4111-8111-111111111111";

const DEMO_COLUMNS = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    boardId: DEMO_BOARD_ID,
    title: "Todo",
    position: 0,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    boardId: DEMO_BOARD_ID,
    title: "Done",
    position: 1,
  },
];

const DEMO_CARDS = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    columnId: "22222222-2222-4222-8222-222222222222",
    title: "Seed sample board",
    description: "Datos de prueba para GET /api/boards/:boardId",
    position: 0,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    columnId: "22222222-2222-4222-8222-222222222222",
    title: "Connect the frontend",
    description: null,
    position: 1,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    columnId: "33333333-3333-4333-8333-333333333333",
    title: "Verify nested contract",
    description: "Board -> columns -> cards",
    position: 0,
  },
];

const seedBoardReadDemo = async () => {
  const env = loadEnv();
  const databaseClient = createDatabaseClient({ databaseUrl: env.databaseUrl });

  try {
    await databaseClient.db.transaction(async (tx) => {
      await tx.delete(boards).where(eq(boards.id, DEMO_BOARD_ID));
      await tx.insert(boards).values({
        id: DEMO_BOARD_ID,
        title: "Delivery board",
      });
      await tx.insert(columnsTable).values(DEMO_COLUMNS);
      await tx.insert(cardsTable).values(DEMO_CARDS);
    });

    console.log(`Seeded demo board ${DEMO_BOARD_ID}`);
    console.log(`Frontend route: /boards/${DEMO_BOARD_ID}`);
  } finally {
    await databaseClient.close();
  }
};

void seedBoardReadDemo().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  console.error(`Failed to seed board-read demo data: ${message}`);
  process.exitCode = 1;
});
