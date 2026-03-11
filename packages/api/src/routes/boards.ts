import { Router, type RequestHandler } from "express";

import { getDatabaseClient } from "../db/client.ts";
import { BoardNotFoundError } from "../features/boards/board-errors.ts";
import {
  createBoardReadRepository,
  createGetBoardUseCase,
  type GetBoardUseCase,
} from "../features/boards/get-board.ts";
import {
  createReorderColumnsRepository,
  createReorderColumnsUseCase,
  ReorderColumnsValidationError,
  type ReorderColumnsUseCase,
} from "../features/boards/reorder-columns.ts";
import {
  createReorderCardsRepository,
  createReorderCardsUseCase,
  ReorderCardsValidationError,
  type ReorderCardsUseCase,
} from "../features/cards/reorder-cards.ts";
import { isUuid } from "../lib/is-uuid.ts";

type BoardsRouterOptions = {
  getBoard?: GetBoardUseCase;
  reorderColumns?: ReorderColumnsUseCase;
  reorderCards?: ReorderCardsUseCase;
};

const createDefaultGetBoard = (): GetBoardUseCase =>
  createGetBoardUseCase(createBoardReadRepository(getDatabaseClient().db));

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
  getBoard,
  reorderColumns,
  reorderCards,
}: BoardsRouterOptions = {}) => {
  const router = Router();

  router.get("/:boardId", createGetBoardHandler({ getBoard }));
  router.post(
    "/:boardId/columns/reorder",
    createReorderColumnsHandler({ getBoard, reorderColumns }),
  );
  router.post("/:boardId/cards/reorder", createReorderCardsHandler({ getBoard, reorderCards }));

  return router;
};
