import { Router, type RequestHandler } from "express";

import { getDatabaseClient } from "../db/client.ts";
import { createDeleteCardRepository, createDeleteCardUseCase, type DeleteCardUseCase } from "../features/cards/delete-card.ts";
import {
  CardNotFoundError,
  CreateCardValidationError,
  createUpdateCardRepository,
  createUpdateCardUseCase,
  type UpdateCardUseCase,
} from "../features/cards/update-card.ts";
import { isUuid } from "../lib/is-uuid.ts";

type CardsRouterOptions = {
  updateCard?: UpdateCardUseCase;
  deleteCard?: DeleteCardUseCase;
};

const createDefaultUpdateCard = (): UpdateCardUseCase =>
  createUpdateCardUseCase(createUpdateCardRepository(getDatabaseClient().db));

const createDefaultDeleteCard = (): DeleteCardUseCase =>
  createDeleteCardUseCase(createDeleteCardRepository(getDatabaseClient().db));

const readCardId = (value: string | string[] | undefined): string | undefined => {
  return Array.isArray(value) ? value[0] : value;
};

export const createUpdateCardHandler = ({
  updateCard = createDefaultUpdateCard(),
}: CardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const cardId = readCardId(request.params.cardId);
    if (cardId === undefined || !isUuid(cardId)) {
      response.status(400).json({
        error: "Invalid cardId",
      });
      return;
    }

    const body = request.body as Record<string, unknown> | null;

    try {
      const updatedCard = await updateCard({
        cardId,
        title: body?.title,
        description: body?.description,
      });

      response.status(200).json(updatedCard);
    } catch (error) {
      if (error instanceof CreateCardValidationError) {
        response.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof CardNotFoundError) {
        response.status(404).json({
          error: "Card not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to update card",
      });
    }
  };
};

export const createDeleteCardHandler = ({
  deleteCard = createDefaultDeleteCard(),
}: CardsRouterOptions = {}): RequestHandler => {
  return async (request, response) => {
    const cardId = readCardId(request.params.cardId);
    if (cardId === undefined || !isUuid(cardId)) {
      response.status(400).json({
        error: "Invalid cardId",
      });
      return;
    }

    try {
      await deleteCard({ cardId });
      response.status(204).send();
    } catch (error) {
      if (error instanceof CardNotFoundError) {
        response.status(404).json({
          error: "Card not found",
        });
        return;
      }

      response.status(500).json({
        error: "Unable to delete card",
      });
    }
  };
};

export const createCardsRouter = ({ updateCard, deleteCard }: CardsRouterOptions = {}) => {
  const router = Router();

  router.patch("/:cardId", createUpdateCardHandler({ updateCard }));
  router.delete("/:cardId", createDeleteCardHandler({ deleteCard }));

  return router;
};
