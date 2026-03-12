import type { DatabaseClient } from "../../db/client.ts";
import { boards } from "../../db/schema/index.ts";

type BoardWriteSession = Pick<DatabaseClient["db"], "insert">;

type BoardWriteDatabase = BoardWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

export type ManagedBoard = {
  id: string;
  title: string;
};

export type CreateBoardInput = {
  title: unknown;
};

type CreateBoardRepositorySession = {
  insertBoard: (input: { title: string }) => Promise<ManagedBoard>;
};

type CreateBoardRepository = {
  transaction: <T>(run: (repository: CreateBoardRepositorySession) => Promise<T>) => Promise<T>;
};

export type CreateBoardUseCase = (input: CreateBoardInput) => Promise<ManagedBoard>;

export class CreateBoardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateBoardValidationError";
  }
}

const createRepositorySession = (db: BoardWriteSession): CreateBoardRepositorySession => ({
  insertBoard: async ({ title }) => {
    const [createdBoard] = await db
      .insert(boards)
      .values({
        title,
      })
      .returning({
        id: boards.id,
        title: boards.title,
      });

    if (createdBoard === undefined) {
      throw new Error("Board insert did not return a record");
    }

    return createdBoard;
  },
});

export const createCreateBoardRepository = (db: BoardWriteDatabase): CreateBoardRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as BoardWriteSession));
    }),
});

export const createCreateBoardUseCase = (repository: CreateBoardRepository): CreateBoardUseCase => {
  return async ({ title }) => {
    const normalizedTitle = normalizeTitle(title);

    return await repository.transaction(async (transaction) => {
      return await transaction.insertBoard({
        title: normalizedTitle,
      });
    });
  };
};

const normalizeTitle = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new CreateBoardValidationError("Title is required");
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new CreateBoardValidationError("Title is required");
  }

  return normalized;
};
