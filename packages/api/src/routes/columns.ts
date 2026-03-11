import { Router, type RequestHandler } from "express";

import { getDatabaseClient } from "../db/client.ts";
import {
  ColumnNotFoundError,
  CreateCardValidationError,
  createCreateCardRepository,
  createCreateCardUseCase,
  type CreateCardUseCase,
} from "../features/cards/create-card.ts";
import { isUuid } from "../lib/is-uuid.ts";

type ColumnsRouterOptions = {
  createCard?: CreateCardUseCase;
};

const createDefaultCreateCard = (): CreateCardUseCase =>
  createCreateCardUseCase(createCreateCardRepository(getDatabaseClient().db));

export const createCreateCardHandler = ({
  createCard = createDefaultCreateCard(),
}: ColumnsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const columnId = Array.isArray(request.params.columnId)
      ? request.params.columnId[0]
      : request.params.columnId;

    if (columnId === undefined || !isUuid(columnId)) {
      response.status(400).json({
        error: "Invalid columnId",
      });
      return;
    }

    const body = request.body as Record<string, unknown> | null;

    try {
      const createdCard = await createCard({
        columnId,
        title: body?.title,
        description: body?.description,
      });

      response.status(201).json(createdCard);
    } catch (error) {
      if (error instanceof CreateCardValidationError) {
        response.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof ColumnNotFoundError) {
        response.status(404).json({
          error: "Column not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to create card",
      });
    }
  };
};

export const createColumnsRouter = ({
  createCard = createDefaultCreateCard(),
}: ColumnsRouterOptions = {}) => {
  const router = Router();

  router.post("/:columnId/cards", createCreateCardHandler({ createCard }));

  return router;
};
