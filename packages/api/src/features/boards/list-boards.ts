import { asc, countDistinct, eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { boards, cards, columns } from "../../db/schema/index.ts";

type BoardListSession = Pick<DatabaseClient["db"], "select">;

export type BoardSummary = {
  id: string;
  title: string;
  columnCount: number;
  cardCount: number;
};

type BoardListRepository = {
  listBoards: () => Promise<BoardSummary[]>;
};

export type ListBoardsUseCase = () => Promise<BoardSummary[]>;

export const createBoardListRepository = (db: BoardListSession): BoardListRepository => ({
  listBoards: async () => {
    return await db
      .select({
        id: boards.id,
        title: boards.title,
        columnCount: countDistinct(columns.id).mapWith(Number),
        cardCount: countDistinct(cards.id).mapWith(Number),
      })
      .from(boards)
      .leftJoin(columns, eq(columns.boardId, boards.id))
      .leftJoin(cards, eq(cards.columnId, columns.id))
      .groupBy(boards.id, boards.title)
      .orderBy(asc(boards.title), asc(boards.id));
  },
});

export const createListBoardsUseCase = (repository: BoardListRepository): ListBoardsUseCase => {
  return async () => await repository.listBoards();
};
