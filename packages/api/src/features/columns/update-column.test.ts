import { describe, expect, it } from "vitest";

import type { ManagedColumn } from "./create-column.ts";
import {
  CreateColumnValidationError,
  createUpdateColumnUseCase,
} from "./update-column.ts";
import { ColumnNotFoundError } from "./column-errors.ts";

type TestState = {
  columns: ManagedColumn[];
};

const createRepository = (state: TestState) => ({
  transaction: async <T>(
    run: (repository: {
      findColumnById: (columnId: string) => Promise<{ id: string } | null>;
      updateColumn: (input: { columnId: string; title: string }) => Promise<ManagedColumn>;
    }) => Promise<T>,
  ) =>
    await run({
      findColumnById: async (columnId) => state.columns.find((column) => column.id === columnId) ?? null,
      updateColumn: async ({ columnId, title }) => {
        const column = state.columns.find((entry) => entry.id === columnId);
        if (column === undefined) {
          throw new Error(`Missing test column ${columnId}`);
        }

        column.title = title;
        return { ...column };
      },
    }),
});

describe("update column use case", () => {
  it("updates the column title without changing its board or position", async () => {
    const state = {
      columns: [
        {
          id: "column-1",
          boardId: "board-1",
          title: "Antes",
          position: 2,
        },
      ],
    };
    const updateColumn = createUpdateColumnUseCase(createRepository(state));

    await expect(
      updateColumn({
        columnId: "column-1",
        title: "  Despues  ",
      }),
    ).resolves.toEqual({
      id: "column-1",
      boardId: "board-1",
      title: "Despues",
      position: 2,
    });
  });

  it("rejects updates without a valid title", async () => {
    const updateColumn = createUpdateColumnUseCase(
      createRepository({
        columns: [{ id: "column-1", boardId: "board-1", title: "Antes", position: 0 }],
      }),
    );

    await expect(
      updateColumn({
        columnId: "column-1",
        title: "   ",
      }),
    ).rejects.toBeInstanceOf(CreateColumnValidationError);
  });

  it("fails when the column does not exist", async () => {
    const updateColumn = createUpdateColumnUseCase(createRepository({ columns: [] }));

    await expect(
      updateColumn({
        columnId: "missing-column",
        title: "Nuevo titulo",
      }),
    ).rejects.toBeInstanceOf(ColumnNotFoundError);
  });
});
