import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { cards } from "../../db/schema/index.ts";
import {
  CreateCardValidationError,
  type CreatedCard,
} from "./create-card.ts";
import { normalizeDescription, normalizeTitle } from "./card-fields.ts";

type CardWriteSession = Pick<DatabaseClient["db"], "select" | "update">;

type CardWriteDatabase = CardWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type UpdateCardRepositorySession = {
  findCardById: (cardId: string) => Promise<{ id: string } | null>;
  updateCard: (input: {
    cardId: string;
    title: string;
    description: string | null;
  }) => Promise<CreatedCard>;
};

type UpdateCardRepository = {
  transaction: <T>(run: (repository: UpdateCardRepositorySession) => Promise<T>) => Promise<T>;
};

export type UpdateCardInput = {
  cardId: string;
  title: unknown;
  description?: unknown;
};

export type UpdateCardUseCase = (input: UpdateCardInput) => Promise<CreatedCard>;

export class CardNotFoundError extends Error {
  constructor(cardId: string) {
    super(`Card ${cardId} was not found`);
    this.name = "CardNotFoundError";
  }
}

const createRepositorySession = (db: CardWriteSession): UpdateCardRepositorySession => ({
  findCardById: async (cardId) => {
    const [card] = await db
      .select({
        id: cards.id,
      })
      .from(cards)
      .where(eq(cards.id, cardId))
      .limit(1);

    return card ?? null;
  },
  updateCard: async ({ cardId, title, description }) => {
    const [updatedCard] = await db
      .update(cards)
      .set({
        title,
        description,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, cardId))
      .returning({
        id: cards.id,
        columnId: cards.columnId,
        title: cards.title,
        description: cards.description,
        position: cards.position,
      });

    if (updatedCard === undefined) {
      throw new Error("Card update did not return a record");
    }

    return updatedCard;
  },
});

export const createUpdateCardRepository = (db: CardWriteDatabase): UpdateCardRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as CardWriteSession));
    }),
});

export const createUpdateCardUseCase = (repository: UpdateCardRepository): UpdateCardUseCase => {
  return async ({ cardId, title, description }) => {
    const normalizedTitle = normalizeTitle(title);
    const normalizedDescription = normalizeDescription(description);

    return await repository.transaction(async (transaction) => {
      const card = await transaction.findCardById(cardId);
      if (card === null) {
        throw new CardNotFoundError(cardId);
      }

      return await transaction.updateCard({
        cardId,
        title: normalizedTitle,
        description: normalizedDescription,
      });
    });
  };
};

export { CreateCardValidationError };
