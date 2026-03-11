import { asc, eq, inArray } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { boards, cards, columns } from "../../db/schema/index.ts";

type BoardReadSession = Pick<DatabaseClient["db"], "select">;

type BoardRecord = {
  id: string;
  title: string;
};

type ColumnRecord = {
  id: string;
  title: string;
  position: number;
};

type CardRecord = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
};

export type BoardCard = {
  id: string;
  title: string;
  description: string | null;
  position: number;
};

export type BoardColumn = {
  id: string;
  title: string;
  position: number;
  cards: BoardCard[];
};

export type BoardView = {
  id: string;
  title: string;
  columns: BoardColumn[];
};

export type GetBoardUseCase = (boardId: string) => Promise<BoardView | null>;

type BoardReadRepository = {
  findBoardById: (boardId: string) => Promise<BoardRecord | null>;
  findColumnsByBoardId: (boardId: string) => Promise<ColumnRecord[]>;
  findCardsByColumnIds: (columnIds: string[]) => Promise<CardRecord[]>;
};

export const createBoardReadRepository = (db: BoardReadSession): BoardReadRepository => ({
  findBoardById: async (boardId) => {
    const [record] = await db
      .select({
        id: boards.id,
        title: boards.title,
      })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1);

    return record ?? null;
  },
  findColumnsByBoardId: async (boardId) => {
    return await db
      .select({
        id: columns.id,
        title: columns.title,
        position: columns.position,
      })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position));
  },
  findCardsByColumnIds: async (columnIds) => {
    if (columnIds.length === 0) {
      return [];
    }

    return await db
      .select({
        id: cards.id,
        columnId: cards.columnId,
        title: cards.title,
        description: cards.description,
        position: cards.position,
      })
      .from(cards)
      .where(inArray(cards.columnId, columnIds))
      .orderBy(asc(cards.columnId), asc(cards.position));
  },
});

export const createGetBoardUseCase = (repository: BoardReadRepository): GetBoardUseCase => {
  return async (boardId) => {
    const board = await repository.findBoardById(boardId);
    if (board === null) {
      return null;
    }

    const columnRecords = await repository.findColumnsByBoardId(boardId);
    const cardRecords = await repository.findCardsByColumnIds(columnRecords.map((column) => column.id));
    const cardsByColumnId = new Map<string, BoardCard[]>();

    for (const card of cardRecords) {
      const existingCards = cardsByColumnId.get(card.columnId) ?? [];
      existingCards.push({
        id: card.id,
        title: card.title,
        description: card.description,
        position: card.position,
      });
      cardsByColumnId.set(card.columnId, existingCards);
    }

    return {
      id: board.id,
      title: board.title,
      columns: columnRecords.map((column) => ({
        id: column.id,
        title: column.title,
        position: column.position,
        cards: cardsByColumnId.get(column.id) ?? [],
      })),
    };
  };
};
