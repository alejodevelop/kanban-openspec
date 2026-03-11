import express from "express";

import { type GetBoardUseCase } from "./features/boards/get-board.ts";
import { type ReorderColumnsUseCase } from "./features/boards/reorder-columns.ts";
import { type CreateCardUseCase } from "./features/cards/create-card.ts";
import { type ReorderCardsUseCase } from "./features/cards/reorder-cards.ts";
import { createHealthRouter, type HealthCheck } from "./routes/health.ts";
import { createBoardsRouter } from "./routes/boards.ts";
import { createColumnsRouter } from "./routes/columns.ts";

type AppOptions = {
  checkDatabase?: HealthCheck;
  getBoard?: GetBoardUseCase;
  createCard?: CreateCardUseCase;
  reorderColumns?: ReorderColumnsUseCase;
  reorderCards?: ReorderCardsUseCase;
};

export const createApp = ({
  checkDatabase,
  getBoard,
  createCard,
  reorderColumns,
  reorderCards,
}: AppOptions = {}) => {
  const app = express();

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json());
  app.use("/health", createHealthRouter({ checkDatabase }));
  app.use("/api/boards", createBoardsRouter({ getBoard, reorderColumns, reorderCards }));
  app.use("/api/columns", createColumnsRouter({ createCard }));

  return app;
};
