import type { BoardCard, BoardColumn, BoardView, ReorderCardsColumnPayload } from "./board-api";

export const BOARD_DRAG_COLUMN = "column";
export const BOARD_DRAG_CARD = "card";
export const BOARD_DROP_COLUMN = "column-drop";

export type BoardDragData =
  | { type: typeof BOARD_DRAG_COLUMN; columnId: string }
  | { type: typeof BOARD_DRAG_CARD; cardId: string; columnId: string }
  | { type: typeof BOARD_DROP_COLUMN; columnId: string };

export type ColumnReorderPlan = {
  board: BoardView;
  columnIds: string[];
};

export type CardReorderPlan = {
  board: BoardView;
  columns: ReorderCardsColumnPayload[];
};

export const getColumnSortableId = (columnId: string) => `column:${columnId}`;

export const getCardSortableId = (cardId: string) => `card:${cardId}`;

export const getColumnDropZoneId = (columnId: string) => `column-drop:${columnId}`;

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex) {
    return items.slice();
  }

  const nextItems = items.slice();
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return items.slice();
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const cloneCard = (card: BoardCard, position: number): BoardCard => ({
  ...card,
  position,
});

const cloneColumn = (column: BoardColumn, position: number, cards = column.cards): BoardColumn => ({
  ...column,
  position,
  cards,
});

const rebuildColumns = (columns: BoardColumn[]): BoardColumn[] => {
  return columns.map((column, columnIndex) =>
    cloneColumn(
      column,
      columnIndex,
      column.cards.map((card, cardIndex) => cloneCard(card, cardIndex)),
    ),
  );
};

const buildBoard = (board: BoardView, columns: BoardColumn[]): BoardView => ({
  ...board,
  columns: rebuildColumns(columns),
});

const findColumnIndex = (board: BoardView, columnId: string) => {
  return board.columns.findIndex((column) => column.id === columnId);
};

const findCardLocation = (board: BoardView, cardId: string) => {
  for (const column of board.columns) {
    const cardIndex = column.cards.findIndex((card) => card.id === cardId);
    if (cardIndex >= 0) {
      return { columnId: column.id, cardIndex };
    }
  }

  return null;
};

export const getColumnDragData = (columnId: string): BoardDragData => ({
  type: BOARD_DRAG_COLUMN,
  columnId,
});

export const getCardDragData = (columnId: string, cardId: string): BoardDragData => ({
  type: BOARD_DRAG_CARD,
  columnId,
  cardId,
});

export const getColumnDropData = (columnId: string): BoardDragData => ({
  type: BOARD_DROP_COLUMN,
  columnId,
});

export const getColumnReorderPlan = (
  board: BoardView,
  activeColumnId: string,
  overColumnId: string,
): ColumnReorderPlan | null => {
  const fromIndex = findColumnIndex(board, activeColumnId);
  const toIndex = findColumnIndex(board, overColumnId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return null;
  }

  const nextColumns = moveItem(board.columns, fromIndex, toIndex);
  return {
    board: buildBoard(board, nextColumns),
    columnIds: nextColumns.map((column) => column.id),
  };
};

export const getColumnDirectionPlan = (
  board: BoardView,
  columnId: string,
  direction: -1 | 1,
): ColumnReorderPlan | null => {
  const fromIndex = findColumnIndex(board, columnId);
  if (fromIndex < 0) {
    return null;
  }

  const targetColumn = board.columns[fromIndex + direction];
  if (targetColumn === undefined) {
    return null;
  }

  return getColumnReorderPlan(board, columnId, targetColumn.id);
};

const createCardPlan = (
  board: BoardView,
  sourceColumnId: string,
  destinationColumnId: string,
  nextSourceCardIds: string[],
  nextDestinationCardIds: string[],
): CardReorderPlan => {
  const cardsById = new Map(
    board.columns.flatMap((column) => column.cards.map((card) => [card.id, card] as const)),
  );

  const updatedColumns = board.columns.map((column) => {
    if (column.id === sourceColumnId) {
      return {
        ...column,
        cards: nextSourceCardIds
          .map((cardId) => cardsById.get(cardId))
          .filter((card): card is BoardCard => card !== undefined),
      };
    }

    if (column.id === destinationColumnId) {
      return {
        ...column,
        cards: nextDestinationCardIds
          .map((cardId) => cardsById.get(cardId))
          .filter((card): card is BoardCard => card !== undefined),
      };
    }

    return column;
  });

  const columns: ReorderCardsColumnPayload[] = [];

  if (sourceColumnId === destinationColumnId) {
    columns.push({ columnId: sourceColumnId, cardIds: nextDestinationCardIds });
  } else {
    columns.push({ columnId: sourceColumnId, cardIds: nextSourceCardIds });
    columns.push({ columnId: destinationColumnId, cardIds: nextDestinationCardIds });
  }

  return {
    board: buildBoard(board, updatedColumns),
    columns,
  };
};

export const getCardDirectionPlan = (
  board: BoardView,
  columnId: string,
  cardId: string,
  direction: -1 | 1,
): CardReorderPlan | null => {
  const columnIndex = findColumnIndex(board, columnId);
  if (columnIndex < 0) {
    return null;
  }

  const column = board.columns[columnIndex];
  const cardIndex = column.cards.findIndex((card) => card.id === cardId);
  if (cardIndex < 0) {
    return null;
  }

  const destinationIndex = cardIndex + direction;
  if (destinationIndex < 0 || destinationIndex >= column.cards.length) {
    return null;
  }

  const nextCardIds = moveItem(
    column.cards.map((card) => card.id),
    cardIndex,
    destinationIndex,
  );

  return createCardPlan(board, columnId, columnId, nextCardIds, nextCardIds);
};

export const getCardAcrossColumnsPlan = (
  board: BoardView,
  sourceColumnId: string,
  cardId: string,
  destinationColumnId: string,
  destinationIndex?: number,
): CardReorderPlan | null => {
  const sourceColumn = board.columns.find((column) => column.id === sourceColumnId);
  const destinationColumn = board.columns.find((column) => column.id === destinationColumnId);
  const movedCard = sourceColumn?.cards.find((card) => card.id === cardId);

  if (sourceColumn === undefined || destinationColumn === undefined || movedCard === undefined) {
    return null;
  }

  if (sourceColumnId === destinationColumnId) {
    const currentIndex = sourceColumn.cards.findIndex((card) => card.id === cardId);
    if (currentIndex < 0) {
      return null;
    }

    const targetIndex = Math.max(
      0,
      Math.min(destinationIndex ?? sourceColumn.cards.length - 1, sourceColumn.cards.length - 1),
    );

    if (currentIndex === targetIndex) {
      return null;
    }

    const nextCardIds = moveItem(
      sourceColumn.cards.map((card) => card.id),
      currentIndex,
      targetIndex,
    );

    return createCardPlan(board, sourceColumnId, destinationColumnId, nextCardIds, nextCardIds);
  }

  const nextSourceCardIds = sourceColumn.cards
    .filter((card) => card.id !== cardId)
    .map((card) => card.id);

  const insertionIndex = Math.max(
    0,
    Math.min(destinationIndex ?? destinationColumn.cards.length, destinationColumn.cards.length),
  );

  const nextDestinationCardIds = destinationColumn.cards.map((card) => card.id);
  nextDestinationCardIds.splice(insertionIndex, 0, cardId);

  return createCardPlan(board, sourceColumnId, destinationColumnId, nextSourceCardIds, nextDestinationCardIds);
};

export const getCardDragPlan = (
  board: BoardView,
  activeCardId: string,
  over:
    | { type: typeof BOARD_DRAG_CARD; cardId: string; columnId: string }
    | { type: typeof BOARD_DROP_COLUMN; columnId: string },
): CardReorderPlan | null => {
  const activeLocation = findCardLocation(board, activeCardId);
  if (activeLocation === null) {
    return null;
  }

  if (over.type === BOARD_DROP_COLUMN) {
    return getCardAcrossColumnsPlan(
      board,
      activeLocation.columnId,
      activeCardId,
      over.columnId,
      board.columns.find((column) => column.id === over.columnId)?.cards.length,
    );
  }

  const destinationColumn = board.columns.find((column) => column.id === over.columnId);
  const overIndex = destinationColumn?.cards.findIndex((card) => card.id === over.cardId) ?? -1;
  if (destinationColumn === undefined || overIndex < 0) {
    return null;
  }

  if (activeLocation.columnId === over.columnId) {
    if (activeLocation.cardIndex === overIndex) {
      return null;
    }

    const nextCardIds = moveItem(
      destinationColumn.cards.map((card) => card.id),
      activeLocation.cardIndex,
      overIndex,
    );

    return createCardPlan(board, over.columnId, over.columnId, nextCardIds, nextCardIds);
  }

  return getCardAcrossColumnsPlan(board, activeLocation.columnId, activeCardId, over.columnId, overIndex);
};
