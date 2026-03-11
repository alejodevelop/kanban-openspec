import type { Server } from "node:http";
import { pathToFileURL } from "node:url";

import { createApp } from "./app.ts";
import { loadEnv, type RuntimeEnv } from "./config/env.ts";
import { getDatabaseClient } from "./db/client.ts";
import type { HealthCheck } from "./routes/health.ts";

type StartServerOptions = {
  env?: RuntimeEnv;
  checkDatabase?: HealthCheck;
  host?: string;
};

const getPort = (server: Server): number | string => {
  const address = server.address();
  if (address === null) {
    throw new Error("Server address is unavailable");
  }

  return typeof address === "string" ? address : address.port;
};

export const startServer = async ({
  env = loadEnv(),
  checkDatabase,
  host,
}: StartServerOptions = {}): Promise<Server> => {
  const resolvedCheckDatabase =
    checkDatabase ?? (() => getDatabaseClient({ databaseUrl: env.databaseUrl }).checkHealth());
  const app = createApp({ checkDatabase: resolvedCheckDatabase });

  return await new Promise<Server>((resolve, reject) => {
    let server: Server;
    const onListening = () => {
      queueMicrotask(() => {
        resolve(server);
      });
    };
    server =
      host === undefined ? app.listen(env.port, onListening) : app.listen(env.port, host, onListening);

    server.on("error", reject);
  });
};

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer()
    .then((server) => {
      const port = getPort(server);
      console.log(`API runtime listening on port ${port}`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown startup error";
      console.error(`Failed to start API runtime: ${message}`);
      process.exitCode = 1;
    });
}
