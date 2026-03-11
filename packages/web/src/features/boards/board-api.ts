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

export type CreateCardPayload = {
  title: string;
  description?: string;
};

export type CreatedCard = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
};

export const boardApi = {
  getBoard: async (boardId: string) => await apiClient.get<BoardView>(`/api/boards/${boardId}`),
  createCard: async (columnId: string, payload: CreateCardPayload) =>
    await apiClient.post<CreatedCard>(`/api/columns/${columnId}/cards`, payload),
};
