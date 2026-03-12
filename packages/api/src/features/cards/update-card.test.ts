import { describe, expect, it } from "vitest";

import type { CreatedCard } from "./create-card.ts";
import {
  CardNotFoundError,
  CreateCardValidationError,
  createUpdateCardUseCase,
} from "./update-card.ts";

type TestState = {
  cards: CreatedCard[];
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(run: (repository: {
    findCardById: (cardId: string) => Promise<{ id: string } | null>;
    updateCard: (input: {
      cardId: string;
      title: string;
      description: string | null;
    }) => Promise<CreatedCard>;
  }) => Promise<T>) =>
    await run({
      findCardById: async (cardId) => state.cards.find((card) => card.id === cardId) ?? null,
      updateCard: async ({ cardId, title, description }) => {
        const card = state.cards.find((entry) => entry.id === cardId);
        if (card === undefined) {
          throw new Error(`Missing test card ${cardId}`);
        }

        card.title = title;
        card.description = description;
        return { ...card };
      },
    }),
});

describe("update card use case", () => {
  it("normalizes title and description on successful updates", async () => {
    const state = {
      cards: [
        {
          id: "card-1",
          columnId: "column-1",
          title: "Antes",
          description: "Vieja",
          position: 0,
        },
      ],
    };

    const updateCard = createUpdateCardUseCase(createRepository(state));

    const updatedCard = await updateCard({
      cardId: "card-1",
      title: "  Despues  ",
      description: "   ",
    });

    expect(updatedCard).toEqual({
      id: "card-1",
      columnId: "column-1",
      title: "Despues",
      description: null,
      position: 0,
    });
  });

  it("rejects updates without a valid title", async () => {
    const updateCard = createUpdateCardUseCase(
      createRepository({
        cards: [
          {
            id: "card-1",
            columnId: "column-1",
            title: "Antes",
            description: null,
            position: 0,
          },
        ],
      }),
    );

    await expect(
      updateCard({
        cardId: "card-1",
        title: "   ",
      }),
    ).rejects.toBeInstanceOf(CreateCardValidationError);
  });

  it("fails when the card does not exist", async () => {
    const updateCard = createUpdateCardUseCase(createRepository({ cards: [] }));

    await expect(
      updateCard({
        cardId: "missing-card",
        title: "Nueva tarjeta",
      }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });
});
