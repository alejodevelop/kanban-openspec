import { afterEach, describe, expect, it } from "vitest";

import { createDatabaseClient, getDatabaseClient, resetDatabaseClient } from "./client.ts";

const TEST_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/kanban";

afterEach(async () => {
  await resetDatabaseClient();
});

describe("database client", () => {
  it("creates a typed Drizzle client over the shared kanban schema", async () => {
    const client = createDatabaseClient({
      databaseUrl: TEST_DATABASE_URL,
    });

    expect(client.db.query.boards).toBeDefined();
    expect(client.db.query.columns).toBeDefined();
    expect(client.db.query.cards).toBeDefined();

    await client.close();
  });

  it("reuses the shared database client instance", () => {
    const firstClient = getDatabaseClient({
      databaseUrl: TEST_DATABASE_URL,
    });
    const secondClient = getDatabaseClient({
      databaseUrl: "postgresql://ignored:ignored@127.0.0.1:5432/another",
    });

    expect(secondClient).toBe(firstClient);
  });
});
