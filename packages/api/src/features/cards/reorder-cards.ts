import { eq, inArray } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { boards, cards, columns } from "../../db/schema/index.ts";
import { BoardNotFoundError } from "../boards/board-errors.ts";

type CardWriteSession = Pick<DatabaseClient["db"], "select" | "update">;

type CardWriteDatabase = CardWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type BoardRecord = {
  id: string;
};

type ColumnRecord = {
  id: string;
};

type CardRecord = {
  id: string;
};

type ReorderCardColumn = {
  columnId: string;
  cardIds: string[];
};

type ReorderCardsRepositorySession = {
  findBoardById: (boardId: string) => Promise<BoardRecord | null>;
  findColumnsByBoardId: (boardId: string) => Promise<ColumnRecord[]>;
  findCardsByColumnIds: (columnIds: string[]) => Promise<CardRecord[]>;
  updateCardLocation: (cardId: string, columnId: string, position: number) => Promise<void>;
};

type ReorderCardsRepository = {
  transaction: <T>(run: (repository: ReorderCardsRepositorySession) => Promise<T>) => Promise<T>;
};

export type ReorderCardsInput = {
  boardId: string;
  columns: unknown;
};

export type ReorderCardsUseCase = (input: ReorderCardsInput) => Promise<void>;

export class ReorderCardsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReorderCardsValidationError";
  }
}

const matchesExactly = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const leftIds = new Set(left);
  return right.every((entry) => leftIds.has(entry));
};

const normalizeColumnPayload = (value: unknown): ReorderCardColumn[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ReorderCardsValidationError("Card reorder requires a non-empty columns array");
  }

  const normalizedColumns = value.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new ReorderCardsValidationError("Card reorder payload must contain column objects");
    }

    const payload = entry as Record<string, unknown>;
    if (typeof payload.columnId !== "string" || payload.columnId.trim() === "") {
      throw new ReorderCardsValidationError("Card reorder payload requires a columnId for each column");
    }

    if (!Array.isArray(payload.cardIds)) {
      throw new ReorderCardsValidationError("Card reorder payload requires a cardIds array for each column");
    }

    const cardIds = payload.cardIds.map((cardId) => {
      if (typeof cardId !== "string" || cardId.trim() === "") {
        throw new ReorderCardsValidationError("Card reorder payload must contain only string card ids");
      }

      return cardId;
    });

    if (new Set(cardIds).size !== cardIds.length) {
      throw new ReorderCardsValidationError("Card reorder payload contains duplicate card ids");
    }

    return {
      columnId: payload.columnId,
      cardIds,
    };
  });

  const columnIds = normalizedColumns.map((column) => column.columnId);
  if (new Set(columnIds).size !== columnIds.length) {
    throw new ReorderCardsValidationError("Card reorder payload contains duplicate column ids");
  }

  return normalizedColumns;
};

const createRepositorySession = (db: CardWriteSession): ReorderCardsRepositorySession => ({
  findBoardById: async (boardId) => {
    const [board] = await db
      .select({
        id: boards.id,
      })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    return board ?? null;
  },
  findColumnsByBoardId: async (boardId) =>
    await db
      .select({
        id: columns.id,
      })
      .from(columns)
      .where(eq(columns.boardId, boardId)),
  findCardsByColumnIds: async (columnIds) => {
    if (columnIds.length === 0) {
      return [];
    }

    return await db
      .select({
        id: cards.id,
      })
      .from(cards)
      .where(inArray(cards.columnId, columnIds));
  },
  updateCardLocation: async (cardId, columnId, position) => {
    await db
      .update(cards)
      .set({
        columnId,
        position,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, cardId));
  },
});

export const createReorderCardsRepository = (db: CardWriteDatabase): ReorderCardsRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as CardWriteSession));
    }),
});

export const createReorderCardsUseCase = (repository: ReorderCardsRepository): ReorderCardsUseCase => {
  return async ({ boardId, columns: columnPayload }) => {
    const normalizedColumns = normalizeColumnPayload(columnPayload);
    const payloadColumnIds = normalizedColumns.map((column) => column.columnId);
    const payloadCardIds = normalizedColumns.flatMap((column) => column.cardIds);

    if (new Set(payloadCardIds).size !== payloadCardIds.length) {
      throw new ReorderCardsValidationError("Card reorder payload contains duplicate card ids");
    }

    await repository.transaction(async (transaction) => {
      const board = await transaction.findBoardById(boardId);
      if (board === null) {
        throw new BoardNotFoundError(boardId);
      }

      const boardColumnIds = new Set(
        (await transaction.findColumnsByBoardId(boardId)).map((column) => column.id),
      );
      if (!payloadColumnIds.every((columnId) => boardColumnIds.has(columnId))) {
        throw new ReorderCardsValidationError("Card reorder payload references columns outside the board");
      }

      const currentCardIds = (await transaction.findCardsByColumnIds(payloadColumnIds)).map((card) => card.id);
      if (!matchesExactly(currentCardIds, payloadCardIds)) {
        throw new ReorderCardsValidationError(
          "Card reorder payload must include each affected column card exactly once",
        );
      }

      for (const column of normalizedColumns) {
        for (const [index, cardId] of column.cardIds.entries()) {
          await transaction.updateCardLocation(cardId, column.columnId, -index - 1);
        }
      }

      for (const column of normalizedColumns) {
        for (const [index, cardId] of column.cardIds.entries()) {
          await transaction.updateCardLocation(cardId, column.columnId, index);
        }
      }
    });
  };
};
