import { apiClient } from "../../lib/api-client";

export type BoardCard = {
  id: string;
  title: string;
  description: string | null;
  position: number;
};

export type BoardColumn = {
  id: string;
  title: string;
  position: number;
  cards: BoardCard[];
};

export type BoardView = {
  id: string;
  title: string;
  columns: BoardColumn[];
};

export type BoardSummary = {
  id: string;
  title: string;
  columnCount: number;
  cardCount: number;
};

export type CreateCardPayload = {
  title: string;
  description?: string;
};

export type UpdateCardPayload = {
  title: string;
  description?: string;
};

export type ReorderColumnsPayload = {
  columnIds: string[];
};

export type ReorderCardsColumnPayload = {
  columnId: string;
  cardIds: string[];
};

export type ReorderCardsPayload = {
  columns: ReorderCardsColumnPayload[];
};

export type CreatedCard = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
};

export const boardApi = {
  listBoards: async () => await apiClient.get<BoardSummary[]>("/api/boards"),
  getBoard: async (boardId: string) => await apiClient.get<BoardView>(`/api/boards/${boardId}`),
  createCard: async (columnId: string, payload: CreateCardPayload) =>
    await apiClient.post<CreatedCard>(`/api/columns/${columnId}/cards`, payload),
  updateCard: async (cardId: string, payload: UpdateCardPayload) =>
    await apiClient.patch<CreatedCard>(`/api/cards/${cardId}`, payload),
  deleteCard: async (cardId: string) => await apiClient.delete<void>(`/api/cards/${cardId}`),
  reorderColumns: async (boardId: string, payload: ReorderColumnsPayload) =>
    await apiClient.post<BoardView>(`/api/boards/${boardId}/columns/reorder`, payload),
  reorderCards: async (boardId: string, payload: ReorderCardsPayload) =>
    await apiClient.post<BoardView>(`/api/boards/${boardId}/cards/reorder`, payload),
};
