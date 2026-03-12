import { desc, eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { cards, columns } from "../../db/schema/index.ts";
import { normalizeDescription, normalizeTitle } from "./card-fields.ts";

type CardWriteSession = Pick<DatabaseClient["db"], "insert" | "select">;

type CardWriteDatabase = CardWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type ColumnRecord = {
  id: string;
};

export type CreatedCard = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
};

export type CreateCardInput = {
  columnId: string;
  title: unknown;
  description?: unknown;
};

type CreateCardInsert = {
  columnId: string;
  title: string;
  description: string | null;
  position: number;
};

type CreateCardRepositorySession = {
  findColumnById: (columnId: string) => Promise<ColumnRecord | null>;
  findLastPositionInColumn: (columnId: string) => Promise<number | null>;
  insertCard: (input: CreateCardInsert) => Promise<CreatedCard>;
};

type CreateCardRepository = {
  transaction: <T>(run: (repository: CreateCardRepositorySession) => Promise<T>) => Promise<T>;
};

export type CreateCardUseCase = (input: CreateCardInput) => Promise<CreatedCard>;

export class CreateCardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateCardValidationError";
  }
}

export class ColumnNotFoundError extends Error {
  constructor(columnId: string) {
    super(`Column ${columnId} was not found`);
    this.name = "ColumnNotFoundError";
  }
}

const createRepositorySession = (db: CardWriteSession): CreateCardRepositorySession => ({
  findColumnById: async (columnId) => {
    const [record] = await db
      .select({
        id: columns.id,
      })
      .from(columns)
      .where(eq(columns.id, columnId))
      .limit(1);

    return record ?? null;
  },
  findLastPositionInColumn: async (columnId) => {
    const [record] = await db
      .select({
        position: cards.position,
      })
      .from(cards)
      .where(eq(cards.columnId, columnId))
      .orderBy(desc(cards.position))
      .limit(1);

    return record?.position ?? null;
  },
  insertCard: async (input) => {
    const [createdCard] = await db
      .insert(cards)
      .values({
        columnId: input.columnId,
        title: input.title,
        description: input.description,
        position: input.position,
      })
      .returning({
        id: cards.id,
        columnId: cards.columnId,
        title: cards.title,
        description: cards.description,
        position: cards.position,
      });

    if (createdCard === undefined) {
      throw new Error("Card insert did not return a record");
    }

    return createdCard;
  },
});

export const createCreateCardRepository = (db: CardWriteDatabase): CreateCardRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as CardWriteSession));
    }),
});

export const createCreateCardUseCase = (repository: CreateCardRepository): CreateCardUseCase => {
  return async ({ columnId, title, description }) => {
    const normalizedTitle = normalizeTitle(title);
    const normalizedDescription = normalizeDescription(description);

    return await repository.transaction(async (transaction) => {
      const column = await transaction.findColumnById(columnId);
      if (column === null) {
        throw new ColumnNotFoundError(columnId);
      }

      const lastPosition = await transaction.findLastPositionInColumn(columnId);

      return await transaction.insertCard({
        columnId,
        title: normalizedTitle,
        description: normalizedDescription,
        position: lastPosition === null ? 0 : lastPosition + 1,
      });
    });
  };
};
