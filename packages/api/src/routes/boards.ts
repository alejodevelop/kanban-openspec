import { Router, type RequestHandler } from "express";

import { getDatabaseClient } from "../db/client.ts";
import {
  createBoardReadRepository,
  createGetBoardUseCase,
  type GetBoardUseCase,
} from "../features/boards/get-board.ts";
import { isUuid } from "../lib/is-uuid.ts";

type BoardsRouterOptions = {
  getBoard?: GetBoardUseCase;
};

const createDefaultGetBoard = (): GetBoardUseCase =>
  createGetBoardUseCase(createBoardReadRepository(getDatabaseClient().db));

export const createGetBoardHandler = ({
  getBoard = createDefaultGetBoard(),
}: BoardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const boardId = Array.isArray(request.params.boardId)
      ? request.params.boardId[0]
      : request.params.boardId;

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

export const createBoardsRouter = ({ getBoard = createDefaultGetBoard() }: BoardsRouterOptions = {}) => {
  const router = Router();

  router.get("/:boardId", createGetBoardHandler({ getBoard }));

  return router;
};
