import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { HomeRoute } from "./home-route";
import { ApiClientError } from "../lib/api-client";

const boardApiMocks = vi.hoisted(() => ({
  listBoards: vi.fn(),
  createBoard: vi.fn(),
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
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
    boardApiMocks.createBoard.mockReset();
    boardApiMocks.updateBoard.mockReset();
    boardApiMocks.deleteBoard.mockReset();
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

    expect(await screen.findByRole("heading", { name: /alpha board/i })).toBeTruthy();

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
    expect(screen.getByText(/crea el primer board desde este dashboard/i)).toBeTruthy();
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

  it("creates a board from the dashboard and refreshes the list", async () => {
    boardApiMocks.listBoards.mockResolvedValueOnce([]);
    boardApiMocks.createBoard.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Delivery board",
    });

    const user = userEvent.setup();
    renderHomeRoute();

    expect(await screen.findByRole("heading", { name: /todavia no hay boards/i })).toBeTruthy();

    const createBoardForm = screen.getByLabelText(/titulo del nuevo board/i).closest("form");
    if (createBoardForm === null) {
      throw new Error("Expected create board form");
    }

    await user.type(screen.getByLabelText(/titulo del nuevo board/i), "Delivery board");
    await user.click(within(createBoardForm).getByRole("button", { name: /crear board/i }));

    expect(boardApiMocks.createBoard).toHaveBeenCalledWith({ title: "Delivery board" });
    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();
  });

  it("renames a board from the dashboard", async () => {
    boardApiMocks.listBoards.mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Delivery board",
        columnCount: 2,
        cardCount: 3,
      },
    ]);
    boardApiMocks.updateBoard.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Operations board",
    });

    const user = userEvent.setup();
    renderHomeRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const boardCard = screen.getByRole("heading", { name: /delivery board/i }).closest("article");
    if (boardCard === null) {
      throw new Error("Expected board card article");
    }

    await user.click(within(boardCard).getByRole("button", { name: /mas/i }));
    await user.click(within(boardCard).getByRole("menuitem", { name: /renombrar/i }));

    const renameDialog = await screen.findByRole("dialog", { name: /renombrar delivery board/i });
    const titleField = within(renameDialog).getByLabelText(/titulo del board/i) as HTMLInputElement;
    fireEvent.change(titleField, { target: { value: "Operations board" } });
    await waitFor(() => {
      expect(titleField.value).toBe("Operations board");
    });
    await user.click(within(renameDialog).getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(boardApiMocks.updateBoard).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
        title: "Operations board",
      });
    });
    expect(await screen.findByRole("heading", { name: /operations board/i })).toBeTruthy();
  });

  it("deletes a board from the dashboard after confirmation", async () => {
    boardApiMocks.listBoards.mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Delivery board",
        columnCount: 2,
        cardCount: 3,
      },
    ]);
    boardApiMocks.deleteBoard.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderHomeRoute();

    expect(await screen.findByRole("heading", { name: /delivery board/i })).toBeTruthy();

    const boardCard = screen.getByRole("heading", { name: /delivery board/i }).closest("article");
    if (boardCard === null) {
      throw new Error("Expected board card article");
    }

    await user.click(within(boardCard).getByRole("button", { name: /mas/i }));
    await user.click(within(boardCard).getByRole("menuitem", { name: /^eliminar$/i }));
    await user.click(screen.getByRole("button", { name: /eliminar board/i }));

    expect(boardApiMocks.deleteBoard).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
    expect(await screen.findByRole("heading", { name: /todavia no hay boards/i })).toBeTruthy();
  });

  it("shows an inline error when board creation fails validation", async () => {
    boardApiMocks.listBoards.mockResolvedValue([]);
    boardApiMocks.createBoard.mockRejectedValue(
      new ApiClientError("Request failed with status 400", 400, { error: "Title is required" }),
    );

    const user = userEvent.setup();
    renderHomeRoute();

    expect(await screen.findByRole("heading", { name: /todavia no hay boards/i })).toBeTruthy();

    const createBoardForm = screen.getByLabelText(/titulo del nuevo board/i).closest("form");
    if (createBoardForm === null) {
      throw new Error("Expected create board form");
    }

    await user.type(screen.getByLabelText(/titulo del nuevo board/i), "   ");
    await user.click(within(createBoardForm).getByRole("button", { name: /crear board/i }));

    expect(await screen.findByText(/ingresa un titulo valido para crear el board/i)).toBeTruthy();
  });
});
