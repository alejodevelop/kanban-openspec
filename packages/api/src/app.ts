import express from "express";

import { type GetBoardUseCase } from "./features/boards/get-board.ts";
import { type ListBoardsUseCase } from "./features/boards/list-boards.ts";
import { type ReorderColumnsUseCase } from "./features/boards/reorder-columns.ts";
import { type CreateCardUseCase } from "./features/cards/create-card.ts";
import { type DeleteCardUseCase } from "./features/cards/delete-card.ts";
import { type ReorderCardsUseCase } from "./features/cards/reorder-cards.ts";
import { type UpdateCardUseCase } from "./features/cards/update-card.ts";
import { createHealthRouter, type HealthCheck } from "./routes/health.ts";
import { createBoardsRouter } from "./routes/boards.ts";
import { createCardsRouter } from "./routes/cards.ts";
import { createColumnsRouter } from "./routes/columns.ts";

type AppOptions = {
  checkDatabase?: HealthCheck;
  listBoards?: ListBoardsUseCase;
  getBoard?: GetBoardUseCase;
  createCard?: CreateCardUseCase;
  updateCard?: UpdateCardUseCase;
  deleteCard?: DeleteCardUseCase;
  reorderColumns?: ReorderColumnsUseCase;
  reorderCards?: ReorderCardsUseCase;
};

export const createApp = ({
  checkDatabase,
  listBoards,
  getBoard,
  createCard,
  updateCard,
  deleteCard,
  reorderColumns,
  reorderCards,
}: AppOptions = {}) => {
  const app = express();

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json());
  app.use("/health", createHealthRouter({ checkDatabase }));
  app.use("/api/boards", createBoardsRouter({ listBoards, getBoard, reorderColumns, reorderCards }));
  app.use("/api/columns", createColumnsRouter({ createCard }));
  app.use("/api/cards", createCardsRouter({ updateCard, deleteCard }));

  return app;
};
