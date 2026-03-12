import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { HomeRoute } from "./home-route";
import { ApiClientError } from "../lib/api-client";

const boardApiMocks = vi.hoisted(() => ({
  listBoards: vi.fn(),
  getBoard: vi.fn(),
  createCard: vi.fn(),
  reorderColumns: vi.fn(),
  reorderCards: vi.fn(),
}));

vi.mock("../features/boards/board-api", () => ({
  boardApi: boardApiMocks,
}));

const renderHomeRoute = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/boards/:boardId" element={<p>Board detail route</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("HomeRoute", () => {
  beforeEach(() => {
    boardApiMocks.listBoards.mockReset();
    boardApiMocks.getBoard.mockReset();
    boardApiMocks.createCard.mockReset();
    boardApiMocks.reorderColumns.mockReset();
    boardApiMocks.reorderCards.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading state while waiting for the board list", () => {
    boardApiMocks.listBoards.mockReturnValue(new Promise(() => {}));

    renderHomeRoute();

    expect(screen.getByRole("heading", { name: /cargando dashboard/i })).toBeTruthy();
    expect(screen.getByText(/consultando los tableros disponibles/i)).toBeTruthy();
  });

  it("renders the dashboard cards with board summaries", async () => {
    boardApiMocks.listBoards.mockResolvedValue([
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Alpha board",
        columnCount: 0,
        cardCount: 0,
      },
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Delivery board",
        columnCount: 2,
        cardCount: 3,
      },
    ]);

    renderHomeRoute();

    expect(await screen.findByRole("heading", { name: /elige un tablero para continuar/i })).toBeTruthy();

    const boardList = screen.getByRole("list", { name: /boards disponibles/i });
    expect(within(boardList).getByRole("heading", { name: /alpha board/i })).toBeTruthy();
    expect(within(boardList).getByText(/0 columnas/i)).toBeTruthy();
    expect(within(boardList).getByText(/3 tarjetas/i)).toBeTruthy();
    expect(within(boardList).getAllByRole("link", { name: /abrir board/i })).toHaveLength(2);
  });

  it("shows an empty state when no boards are available", async () => {
    boardApiMocks.listBoards.mockResolvedValue([]);

    renderHomeRoute();

    expect(await screen.findByRole("heading", { name: /todavia no hay boards/i })).toBeTruthy();
    expect(screen.getByText(/carga datos de prueba en la api/i)).toBeTruthy();
  });

  it("shows an error state when the board list request fails", async () => {
    boardApiMocks.listBoards.mockRejectedValue(
      new ApiClientError("Request failed with status 500", 500, { error: "Internal Server Error" }),
    );

    renderHomeRoute();

    const errorState = await screen.findByRole("alert");
    expect(within(errorState).getByRole("heading", { name: /error al cargar boards/i })).toBeTruthy();
    expect(within(errorState).getByText(/no pudimos cargar los tableros/i)).toBeTruthy();
  });

  it("navigates to the selected board route", async () => {
    boardApiMocks.listBoards.mockResolvedValue([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Delivery board",
        columnCount: 2,
        cardCount: 3,
      },
    ]);

    const user = userEvent.setup();
    renderHomeRoute();

    await user.click(await screen.findByRole("link", { name: /abrir board/i }));

    expect(await screen.findByText("Board detail route")).toBeTruthy();
  });
});
