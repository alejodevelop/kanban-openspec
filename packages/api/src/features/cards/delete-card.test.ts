import { describe, expect, it } from "vitest";

import { CardNotFoundError } from "./update-card.ts";
import { createDeleteCardUseCase } from "./delete-card.ts";

type TestState = {
  cardIds: Set<string>;
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(run: (repository: {
    findCardById: (cardId: string) => Promise<{ id: string } | null>;
    deleteCard: (cardId: string) => Promise<void>;
  }) => Promise<T>) =>
    await run({
      findCardById: async (cardId) => (state.cardIds.has(cardId) ? { id: cardId } : null),
      deleteCard: async (cardId) => {
        state.cardIds.delete(cardId);
      },
    }),
});

describe("delete card use case", () => {
  it("removes an existing card", async () => {
    const state = {
      cardIds: new Set(["card-1", "card-2"]),
    };

    const deleteCard = createDeleteCardUseCase(createRepository(state));

    await deleteCard({ cardId: "card-1" });

    expect([...state.cardIds]).toEqual(["card-2"]);
  });

  it("fails when the card does not exist", async () => {
    const deleteCard = createDeleteCardUseCase(
      createRepository({
        cardIds: new Set(),
      }),
    );

    await expect(deleteCard({ cardId: "missing-card" })).rejects.toBeInstanceOf(CardNotFoundError);
  });
});
