import { Router, type RequestHandler } from "express";

import { getDatabaseClient } from "../db/client.ts";
import { BoardNotFoundError } from "../features/boards/board-errors.ts";
import {
  createCreateBoardRepository,
  createCreateBoardUseCase,
  CreateBoardValidationError,
  type CreateBoardUseCase,
} from "../features/boards/create-board.ts";
import {
  createDeleteBoardRepository,
  createDeleteBoardUseCase,
  type DeleteBoardUseCase,
} from "../features/boards/delete-board.ts";
import {
  createBoardReadRepository,
  createGetBoardUseCase,
  type GetBoardUseCase,
} from "../features/boards/get-board.ts";
import {
  createBoardListRepository,
  createListBoardsUseCase,
  type ListBoardsUseCase,
} from "../features/boards/list-boards.ts";
import {
  createReorderColumnsRepository,
  createReorderColumnsUseCase,
  ReorderColumnsValidationError,
  type ReorderColumnsUseCase,
} from "../features/boards/reorder-columns.ts";
import {
  createUpdateBoardRepository,
  createUpdateBoardUseCase,
  type UpdateBoardUseCase,
} from "../features/boards/update-board.ts";
import {
  createCreateColumnRepository,
  createCreateColumnUseCase,
  CreateColumnValidationError,
  type CreateColumnUseCase,
} from "../features/columns/create-column.ts";
import {
  createReorderCardsRepository,
  createReorderCardsUseCase,
  ReorderCardsValidationError,
  type ReorderCardsUseCase,
} from "../features/cards/reorder-cards.ts";
import { isUuid } from "../lib/is-uuid.ts";

type BoardsRouterOptions = {
  listBoards?: ListBoardsUseCase;
  getBoard?: GetBoardUseCase;
  createBoard?: CreateBoardUseCase;
  updateBoard?: UpdateBoardUseCase;
  deleteBoard?: DeleteBoardUseCase;
  createColumn?: CreateColumnUseCase;
  reorderColumns?: ReorderColumnsUseCase;
  reorderCards?: ReorderCardsUseCase;
};

const createDefaultListBoards = (): ListBoardsUseCase =>
  createListBoardsUseCase(createBoardListRepository(getDatabaseClient().db));

const createDefaultGetBoard = (): GetBoardUseCase =>
  createGetBoardUseCase(createBoardReadRepository(getDatabaseClient().db));

const createDefaultCreateBoard = (): CreateBoardUseCase =>
  createCreateBoardUseCase(createCreateBoardRepository(getDatabaseClient().db));

const createDefaultUpdateBoard = (): UpdateBoardUseCase =>
  createUpdateBoardUseCase(createUpdateBoardRepository(getDatabaseClient().db));

const createDefaultDeleteBoard = (): DeleteBoardUseCase =>
  createDeleteBoardUseCase(createDeleteBoardRepository(getDatabaseClient().db));

const createDefaultCreateColumn = (): CreateColumnUseCase =>
  createCreateColumnUseCase(createCreateColumnRepository(getDatabaseClient().db));

const createDefaultReorderColumns = (): ReorderColumnsUseCase =>
  createReorderColumnsUseCase(createReorderColumnsRepository(getDatabaseClient().db));

const createDefaultReorderCards = (): ReorderCardsUseCase =>
  createReorderCardsUseCase(createReorderCardsRepository(getDatabaseClient().db));

const readBoardId = (value: string | string[] | undefined): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

export const createGetBoardHandler = ({
  getBoard = createDefaultGetBoard(),
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const boardId = readBoardId(request.params.boardId);

    if (boardId === undefined || !isUuid(boardId)) {
      response.status(400).json({
        error: "Invalid boardId",
      });
      return;
    }

    try {
      const board = await getBoard(boardId);
      if (board === null) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(200).json(board);
    } catch {
      response.status(500).json({
        error: "Unable to load board",
      });
    }
  };
};

export const createListBoardsHandler = ({
  listBoards = createDefaultListBoards(),
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (_request, response) => {
    try {
      const boards = await listBoards();
      response.status(200).json(boards);
    } catch {
      response.status(500).json({
        error: "Unable to list boards",
      });
    }
  };
};

export const createCreateBoardHandler = ({
  createBoard = createDefaultCreateBoard(),
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const body = request.body as Record<string, unknown> | null;

    try {
      const createdBoard = await createBoard({
        title: body?.title,
      });

      response.status(201).json(createdBoard);
    } catch (error) {
      if (error instanceof CreateBoardValidationError) {
        response.status(400).json({
          error: error.message,
        });
        return;
      }

      response.status(500).json({
        error: "Unable to create board",
      });
    }
  };
};

export const createUpdateBoardHandler = ({
  updateBoard = createDefaultUpdateBoard(),
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const boardId = readBoardId(request.params.boardId);
    if (boardId === undefined || !isUuid(boardId)) {
      response.status(400).json({
        error: "Invalid boardId",
      });
      return;
    }

    const body = request.body as Record<string, unknown> | null;

    try {
      const updatedBoard = await updateBoard({
        boardId,
        title: body?.title,
      });

      response.status(200).json(updatedBoard);
    } catch (error) {
      if (error instanceof CreateBoardValidationError) {
        response.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof BoardNotFoundError) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to update board",
      });
    }
  };
};

export const createDeleteBoardHandler = ({
  deleteBoard = createDefaultDeleteBoard(),
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const boardId = readBoardId(request.params.boardId);
    if (boardId === undefined || !isUuid(boardId)) {
      response.status(400).json({
        error: "Invalid boardId",
      });
      return;
    }

    try {
      await deleteBoard({ boardId });
      response.status(204).send();
    } catch (error) {
      if (error instanceof BoardNotFoundError) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to delete board",
      });
    }
  };
};

export const createCreateColumnHandler = ({
  createColumn = createDefaultCreateColumn(),
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const boardId = readBoardId(request.params.boardId);
    if (boardId === undefined || !isUuid(boardId)) {
      response.status(400).json({
        error: "Invalid boardId",
      });
      return;
    }

    const body = request.body as Record<string, unknown> | null;

    try {
      const createdColumn = await createColumn({
        boardId,
        title: body?.title,
      });

      response.status(201).json(createdColumn);
    } catch (error) {
      if (error instanceof CreateColumnValidationError) {
        response.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof BoardNotFoundError) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to create column",
      });
    }
  };
};

export const createReorderColumnsHandler = ({
  getBoard,
  reorderColumns,
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const loadBoard = getBoard ?? createDefaultGetBoard();
    const executeReorderColumns = reorderColumns ?? createDefaultReorderColumns();
    const boardId = readBoardId(request.params.boardId);
    if (boardId === undefined || !isUuid(boardId)) {
      response.status(400).json({
        error: "Invalid boardId",
      });
      return;
    }

    const body = request.body as Record<string, unknown> | null;

    try {
      await executeReorderColumns({
        boardId,
        columnIds: body?.columnIds,
      });

      const board = await loadBoard(boardId);
      if (board === null) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(200).json(board);
    } catch (error) {
      if (error instanceof ReorderColumnsValidationError) {
        response.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof BoardNotFoundError) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to reorder columns",
      });
    }
  };
};

export const createReorderCardsHandler = ({
  getBoard,
  reorderCards,
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const loadBoard = getBoard ?? createDefaultGetBoard();
    const executeReorderCards = reorderCards ?? createDefaultReorderCards();
    const boardId = readBoardId(request.params.boardId);
    if (boardId === undefined || !isUuid(boardId)) {
      response.status(400).json({
        error: "Invalid boardId",
      });
      return;
    }

    const body = request.body as Record<string, unknown> | null;

    try {
      await executeReorderCards({
        boardId,
        columns: body?.columns,
      });

      const board = await loadBoard(boardId);
      if (board === null) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(200).json(board);
    } catch (error) {
      if (error instanceof ReorderCardsValidationError) {
        response.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof BoardNotFoundError) {
        response.status(404).json({
          error: "Board not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to reorder cards",
      });
    }
  };
};

export const createBoardsRouter = ({
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  reorderColumns,
  reorderCards,
}: BoardsRouterOptions = {}) => {
  const router = Router();

  router.get("/", createListBoardsHandler({ listBoards }));
  router.post("/", createCreateBoardHandler({ createBoard }));
  router.get("/:boardId", createGetBoardHandler({ getBoard }));
  router.patch("/:boardId", createUpdateBoardHandler({ updateBoard }));
  router.delete("/:boardId", createDeleteBoardHandler({ deleteBoard }));
  router.post("/:boardId/columns", createCreateColumnHandler({ createColumn }));
  router.post(
    "/:boardId/columns/reorder",
    createReorderColumnsHandler({ getBoard, reorderColumns }),
  );
  router.post("/:boardId/cards/reorder", createReorderCardsHandler({ getBoard, reorderCards }));

  return router;
};
