import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { loadEnv } from "../config/env.ts";
import { schema } from "./schema/index.ts";

export type DatabaseClient = {
  pool: Pool;
  db: NodePgDatabase<typeof schema>;
  checkHealth: () => Promise<void>;
  close: () => Promise<void>;
};

type DatabaseClientConfig = {
  databaseUrl: string;
};

export const createDatabaseClient = ({ databaseUrl }: DatabaseClientConfig): DatabaseClient => {
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const db = drizzle(pool, { schema });

  return {
    pool,
    db,
    checkHealth: async () => {
      await pool.query("select 1");
    },
    close: async () => {
      await pool.end();
    },
  };
};

let sharedClient: DatabaseClient | undefined;

export const getDatabaseClient = (
  config: DatabaseClientConfig = { databaseUrl: loadEnv().databaseUrl },
): DatabaseClient => {
  sharedClient ??= createDatabaseClient(config);
  return sharedClient;
};

export const resetDatabaseClient = async (): Promise<void> => {
  if (sharedClient === undefined) {
    return;
  }

  await sharedClient.close();
  sharedClient = undefined;
};
