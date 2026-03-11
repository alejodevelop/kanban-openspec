const DEFAULT_PORT = 3001;

export type RuntimeEnv = {
  port: number;
  databaseUrl: string;
};

const parsePort = (value: string | undefined): number => {
  if (value === undefined || value === "") {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65_535) {
    throw new Error("PORT must be an integer between 0 and 65535");
  }

  return parsed;
};

const parseDatabaseUrl = (value: string | undefined): string => {
  if (value === undefined || value === "") {
    throw new Error("DATABASE_URL is required");
  }

  return value;
};

export const loadEnv = (input: NodeJS.ProcessEnv = process.env): RuntimeEnv => ({
  port: parsePort(input.PORT),
  databaseUrl: parseDatabaseUrl(input.DATABASE_URL),
});
