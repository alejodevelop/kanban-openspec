import { Router, type RequestHandler } from "express";

import { getDatabaseClient } from "../db/client.ts";
import {
  CreateCardValidationError,
  createCreateCardRepository,
  createCreateCardUseCase,
  type CreateCardUseCase,
} from "../features/cards/create-card.ts";
import {
  createDeleteColumnRepository,
  createDeleteColumnUseCase,
  type DeleteColumnUseCase,
} from "../features/columns/delete-column.ts";
import {
  createUpdateColumnRepository,
  createUpdateColumnUseCase,
  CreateColumnValidationError,
  type UpdateColumnUseCase,
} from "../features/columns/update-column.ts";
import { ColumnNotFoundError } from "../features/columns/column-errors.ts";
import { isUuid } from "../lib/is-uuid.ts";

type ColumnsRouterOptions = {
  createCard?: CreateCardUseCase;
  updateColumn?: UpdateColumnUseCase;
  deleteColumn?: DeleteColumnUseCase;
};

const createDefaultCreateCard = (): CreateCardUseCase =>
  createCreateCardUseCase(createCreateCardRepository(getDatabaseClient().db));

const createDefaultUpdateColumn = (): UpdateColumnUseCase =>
  createUpdateColumnUseCase(createUpdateColumnRepository(getDatabaseClient().db));

const createDefaultDeleteColumn = (): DeleteColumnUseCase =>
  createDeleteColumnUseCase(createDeleteColumnRepository(getDatabaseClient().db));

const readColumnId = (value: string | string[] | undefined): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

export const createCreateCardHandler = ({
  createCard = createDefaultCreateCard(),
}: ColumnsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const columnId = readColumnId(request.params.columnId);

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

export const createUpdateColumnHandler = ({
  updateColumn = createDefaultUpdateColumn(),
}: ColumnsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const columnId = readColumnId(request.params.columnId);
    if (columnId === undefined || !isUuid(columnId)) {
      response.status(400).json({
        error: "Invalid columnId",
      });
      return;
    }

    const body = request.body as Record<string, unknown> | null;

    try {
      const updatedColumn = await updateColumn({
        columnId,
        title: body?.title,
      });

      response.status(200).json(updatedColumn);
    } catch (error) {
      if (error instanceof CreateColumnValidationError) {
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
        error: "Unable to update column",
      });
    }
  };
};

export const createDeleteColumnHandler = ({
  deleteColumn = createDefaultDeleteColumn(),
}: ColumnsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const columnId = readColumnId(request.params.columnId);
    if (columnId === undefined || !isUuid(columnId)) {
      response.status(400).json({
        error: "Invalid columnId",
      });
      return;
    }

    try {
      const deletedColumn = await deleteColumn({ columnId });
      response.status(200).json(deletedColumn);
    } catch (error) {
      if (error instanceof ColumnNotFoundError) {
        response.status(404).json({
          error: "Column not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to delete column",
      });
    }
  };
};

export const createColumnsRouter = ({
  createCard = createDefaultCreateCard(),
  updateColumn,
  deleteColumn,
}: ColumnsRouterOptions = {}) => {
  const router = Router();

  router.patch("/:columnId", createUpdateColumnHandler({ updateColumn }));
  router.delete("/:columnId", createDeleteColumnHandler({ deleteColumn }));
  router.post("/:columnId/cards", createCreateCardHandler({ createCard }));

  return router;
};
