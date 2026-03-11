import { describe, expect, it } from "vitest";

import {
  ColumnNotFoundError,
  CreateCardValidationError,
  createCreateCardUseCase,
  type CreateCardInput,
  type CreatedCard,
} from "./create-card.ts";

type TestState = {
  columns: Set<string>;
  cards: CreatedCard[];
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(run: (repository: {
    findColumnById: (columnId: string) => Promise<{ id: string } | null>;
    findLastPositionInColumn: (columnId: string) => Promise<number | null>;
    insertCard: (input: {
      columnId: string;
      title: string;
      description: string | null;
      position: number;
    }) => Promise<CreatedCard>;
  }) => Promise<T>) =>
    await run({
      findColumnById: async (columnId) => (state.columns.has(columnId) ? { id: columnId } : null),
      findLastPositionInColumn: async (columnId) => {
        const positions = state.cards
          .filter((card) => card.columnId === columnId)
          .map((card) => card.position)
          .sort((left, right) => right - left);

        return positions[0] ?? null;
      },
      insertCard: async (input) => {
        const createdCard = {
          id: `card-${state.cards.length + 1}`,
          columnId: input.columnId,
          title: input.title,
          description: input.description,
          position: input.position,
        };

        state.cards.push(createdCard);
        return createdCard;
      },
    }),
});

const createUseCase = (state: TestState) => createCreateCardUseCase(createRepository(state));

describe("create card use case", () => {
  it("rejects cards without a valid title", async () => {
    const createCard = createUseCase({
      columns: new Set(["column-1"]),
      cards: [],
    });

    await expect(
      createCard({
        columnId: "column-1",
        title: "   ",
      }),
    ).rejects.toBeInstanceOf(CreateCardValidationError);
  });

  it("stores null description when the field is omitted", async () => {
    const state = {
      columns: new Set(["column-1"]),
      cards: [],
    };
    const createCard = createUseCase(state);

    const createdCard = await createCard({
      columnId: "column-1",
      title: "  Nueva tarjeta  ",
    });

    expect(createdCard).toMatchObject({
      columnId: "column-1",
      title: "Nueva tarjeta",
      description: null,
      position: 0,
    });
    expect(state.cards).toHaveLength(1);
  });

  it("assigns the next position at the end of the current column", async () => {
    const state = {
      columns: new Set(["column-1"]),
      cards: [
        {
          id: "card-1",
          columnId: "column-1",
          title: "Primera",
          description: null,
          position: 0,
        },
        {
          id: "card-2",
          columnId: "column-1",
          title: "Segunda",
          description: null,
          position: 1,
        },
      ],
    };
    const createCard = createUseCase(state);

    const createdCard = await createCard({
      columnId: "column-1",
      title: "Tercera",
      description: "  Detalle opcional  ",
    });

    expect(createdCard).toMatchObject({
      title: "Tercera",
      description: "Detalle opcional",
      position: 2,
    });
  });

  it("fails when the target column does not exist", async () => {
    const createCard = createUseCase({
      columns: new Set(),
      cards: [],
    });

    await expect(
      createCard({
        columnId: "missing-column",
        title: "Nueva tarjeta",
      } satisfies CreateCardInput),
    ).rejects.toBeInstanceOf(ColumnNotFoundError);
  });
});
