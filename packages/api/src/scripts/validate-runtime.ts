import type { Server } from "node:http";

import { loadEnv } from "../config/env.ts";
import { resetDatabaseClient } from "../db/client.ts";
import { startServer } from "../server.ts";

const closeServer = async (server: Server): Promise<void> =>
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const env = loadEnv();
const server = await startServer({ env });

try {
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Server address is unavailable for validation");
  }

  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(`Healthcheck failed with status ${response.status}: ${JSON.stringify(body)}`);
  }

  console.log(`Runtime validation passed on port ${address.port}: ${JSON.stringify(body)}`);
} finally {
  await closeServer(server);
  await resetDatabaseClient();
}
