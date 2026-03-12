import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client.ts";
import { cards } from "../../db/schema/index.ts";
import { CardNotFoundError } from "./update-card.ts";

type CardWriteSession = Pick<DatabaseClient["db"], "delete" | "select">;

type CardWriteDatabase = CardWriteSession & {
  transaction: DatabaseClient["db"]["transaction"];
};

type DeleteCardRepositorySession = {
  findCardById: (cardId: string) => Promise<{ id: string } | null>;
  deleteCard: (cardId: string) => Promise<void>;
};

type DeleteCardRepository = {
  transaction: <T>(run: (repository: DeleteCardRepositorySession) => Promise<T>) => Promise<T>;
};

export type DeleteCardInput = {
  cardId: string;
};

export type DeleteCardUseCase = (input: DeleteCardInput) => Promise<void>;

const createRepositorySession = (db: CardWriteSession): DeleteCardRepositorySession => ({
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
  deleteCard: async (cardId) => {
    await db.delete(cards).where(eq(cards.id, cardId));
  },
});

export const createDeleteCardRepository = (db: CardWriteDatabase): DeleteCardRepository => ({
  transaction: async (run) =>
    await db.transaction(async (transaction) => {
      return await run(createRepositorySession(transaction as CardWriteSession));
    }),
});

export const createDeleteCardUseCase = (repository: DeleteCardRepository): DeleteCardUseCase => {
  return async ({ cardId }) => {
    await repository.transaction(async (transaction) => {
      const card = await transaction.findCardById(cardId);
      if (card === null) {
        throw new CardNotFoundError(cardId);
      }

      await transaction.deleteCard(cardId);
    });
  };
};
