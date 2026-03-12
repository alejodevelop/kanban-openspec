import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";

import { ApiClientError } from "../../lib/api-client";
import {
  boardApi,
  type BoardCard,
  type BoardColumn,
  type BoardView,
  type CreateColumnPayload,
  type CreatedCard,
  type ManagedColumn,
  type UpdateCardPayload,
} from "./board-api";
import { BoardColumnComposer, BoardColumnItem, CardOverlay, ColumnOverlay } from "./board-components";
import { ConfirmDeleteDialog, EditCardDialog, RenameDialog } from "./board-dialogs";
import {
  BOARD_DRAG_CARD,
  BOARD_DRAG_COLUMN,
  BOARD_DROP_COLUMN,
  getCardAcrossColumnsPlan,
  getCardDirectionPlan,
  getCardDragPlan,
  getColumnDirectionPlan,
  getColumnReorderPlan,
  getColumnSortableId,
  type BoardDragData,
  type CardReorderPlan,
  type ColumnReorderPlan,
} from "./board-reorder";

type BoardPageProps = {
  boardId: string;
};

type BoardPageState =
  | { status: "loading" }
  | { status: "ready"; board: BoardView }
  | { status: "empty"; board: BoardView }
  | { status: "not-found" }
  | { status: "error"; message: string };

type ActiveDragItem =
  | { type: typeof BOARD_DRAG_COLUMN; column: BoardColumn }
  | { type: typeof BOARD_DRAG_CARD; card: BoardCard }
  | null;

type PendingCardAction =
  | { type: "create"; columnId: string }
  | { type: "edit" | "delete"; cardId: string }
  | null;

type PendingColumnAction =
  | { type: "create" }
  | { type: "update" | "delete"; columnId: string }
  | null;

type ColumnDialogState =
  | { type: "rename"; column: BoardColumn; title: string }
  | { type: "delete"; column: BoardColumn }
  | null;

type CardDialogState =
  | { type: "edit"; cardId: string; title: string; description: string }
  | { type: "delete"; card: BoardCard }
  | null;

type PageNotice =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string }
  | null;

const resolveBoardState = (board: BoardView): BoardPageState =>
  board.columns.length === 0 ? { status: "empty", board } : { status: "ready", board };

const getBoardFromState = (state: BoardPageState) =>
  state.status === "ready" || state.status === "empty" ? state.board : null;

const getCreateCardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "Ingresa un titulo valido para crear la tarjeta.";
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return "La columna ya no existe. Recarga el tablero.";
  }

  return "No pudimos crear la tarjeta. Intenta de nuevo.";
};

const getReorderErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "El tablero cambio mientras intentabas mover elementos. Recarga e intenta de nuevo.";
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return "El tablero ya no existe o quedo fuera de sync. Recarga la ruta.";
  }

  return "No pudimos guardar el nuevo orden. Intenta de nuevo.";
};

const getEditCardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "Ingresa un titulo valido para editar la tarjeta.";
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return "La tarjeta ya no existe. Recarga el tablero.";
  }

  return "No pudimos guardar los cambios de la tarjeta. Intenta de nuevo.";
};

const getDeleteCardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 404) {
    return "La tarjeta ya no existe. Recarga el tablero.";
  }

  return "No pudimos eliminar la tarjeta. Intenta de nuevo.";
};

const getCreateColumnErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "Ingresa un titulo valido para crear la columna.";
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return "El tablero ya no existe. Recarga la ruta actual.";
  }

  return "No pudimos crear la columna. Intenta de nuevo.";
};

const getUpdateColumnErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "Ingresa un titulo valido para renombrar la columna.";
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return "La columna ya no existe. Refrescamos el tablero para sincronizarlo.";
  }

  return "No pudimos renombrar la columna. Intenta de nuevo.";
};

const getDeleteColumnErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 404) {
    return "La columna ya no existe. Refrescamos el tablero para sincronizarlo.";
  }

  return "No pudimos eliminar la columna. Intenta de nuevo.";
};

const appendCardToBoard = (board: BoardView, createdCard: CreatedCard): BoardView => ({
  ...board,
  columns: board.columns.map((column) => {
    if (column.id !== createdCard.columnId) {
      return column;
    }

    return {
      ...column,
      cards: [
        ...column.cards,
        {
          id: createdCard.id,
          title: createdCard.title,
          description: createdCard.description,
          position: column.cards.length,
        },
      ],
    };
  }),
});

const updateCardInBoard = (board: BoardView, updatedCard: CreatedCard): BoardView => ({
  ...board,
  columns: board.columns.map((column) => {
    if (column.id !== updatedCard.columnId) {
      return column;
    }

    return {
      ...column,
      cards: column.cards.map((card) => (card.id === updatedCard.id ? { ...card, ...updatedCard } : card)),
    };
  }),
});

const removeCardFromBoard = (board: BoardView, cardId: string): BoardView => ({
  ...board,
  columns: board.columns.map((column) => {
    const nextCards = column.cards.filter((card) => card.id !== cardId);
    return nextCards.length === column.cards.length
      ? column
      : {
          ...column,
          cards: nextCards.map((card, index) => ({
            ...card,
            position: index,
          })),
        };
  }),
});

const appendColumnToBoard = (board: BoardView, createdColumn: ManagedColumn): BoardView => ({
  ...board,
  columns: [
    ...board.columns,
    {
      id: createdColumn.id,
      title: createdColumn.title,
      position: board.columns.length,
      cards: [],
    },
  ],
});

const updateColumnInBoard = (board: BoardView, updatedColumn: ManagedColumn): BoardView => ({
  ...board,
  columns: board.columns.map((column) =>
    column.id === updatedColumn.id
      ? {
          ...column,
          title: updatedColumn.title,
        }
      : column,
  ),
});

const removeColumnFromBoard = (board: BoardView, columnId: string): BoardView => ({
  ...board,
  columns: board.columns
    .filter((column) => column.id !== columnId)
    .map((column, index) => ({
      ...column,
      position: index,
    })),
});

const getDragData = (value: unknown): BoardDragData | null => {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return null;
  }

  const data = value as Partial<BoardDragData>;
  if (data.type === BOARD_DRAG_COLUMN && typeof data.columnId === "string") {
    return { type: data.type, columnId: data.columnId };
  }

  if (
    data.type === BOARD_DRAG_CARD &&
    typeof data.columnId === "string" &&
    typeof data.cardId === "string"
  ) {
    return { type: data.type, columnId: data.columnId, cardId: data.cardId };
  }

  if (data.type === BOARD_DROP_COLUMN && typeof data.columnId === "string") {
    return { type: data.type, columnId: data.columnId };
  }

  return null;
};

export const BoardPage = ({ boardId }: BoardPageProps) => {
  const [state, setState] = useState<BoardPageState>({ status: "loading" });
  const [isReordering, setIsReordering] = useState(false);
  const [pageNotice, setPageNotice] = useState<PageNotice>(null);
  const [pendingCardAction, setPendingCardAction] = useState<PendingCardAction>(null);
  const [pendingColumnAction, setPendingColumnAction] = useState<PendingColumnAction>(null);
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem>(null);
  const [columnDialog, setColumnDialog] = useState<ColumnDialogState>(null);
  const [cardDialog, setCardDialog] = useState<CardDialogState>(null);
  const [columnDialogError, setColumnDialogError] = useState<string | null>(null);
  const [cardDialogError, setCardDialogError] = useState<string | null>(null);
  const [isColumnComposerOpen, setIsColumnComposerOpen] = useState(false);
  const [activeComposerColumnId, setActiveComposerColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const board = getBoardFromState(state);
  const columnSortableIds = useMemo(
    () => board?.columns.map((column) => getColumnSortableId(column.id)) ?? [],
    [board],
  );
  const pageNoticeClassName =
    pageNotice === null
      ? "feedback-banner"
      : `feedback-banner ${pageNotice.tone === "success" ? "feedback-banner-success" : "feedback-banner-error"}`;

  useEffect(() => {
    if (state.status === "empty") {
      setIsColumnComposerOpen(true);
    }
  }, [state.status]);

  const setBoardState = useEffectEvent((boardView: BoardView) => {
    startTransition(() => {
      setState(resolveBoardState(boardView));
    });
  });

  const applyLocalBoardChange = useEffectEvent((updateBoard: (currentBoard: BoardView) => BoardView) => {
    startTransition(() => {
      setState((current) => {
        if (current.status !== "ready" && current.status !== "empty") {
          return current;
        }

        return resolveBoardState(updateBoard(current.board));
      });
    });
  });

  const loadBoard = useEffectEvent(async (nextBoardId: string) => {
    setState({ status: "loading" });

    try {
      setBoardState(await boardApi.getBoard(nextBoardId));
      setPageNotice(null);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        setState({ status: "not-found" });
        return;
      }

      setState({
        status: "error",
        message: "No pudimos cargar el tablero. Verifica la API e intenta de nuevo.",
      });
    }
  });

  useEffect(() => {
    void loadBoard(boardId);
  }, [boardId]);

  const closeColumnDialog = () => {
    setColumnDialog(null);
    setColumnDialogError(null);
  };

  const closeCardDialog = () => {
    setCardDialog(null);
    setCardDialogError(null);
  };

  const handleCreateCard = async (columnId: string, payload: { description?: string; title: string }) => {
    setPendingCardAction({ type: "create", columnId });
    setPageNotice(null);

    try {
      const createdCard = await boardApi.createCard(columnId, payload);
      applyLocalBoardChange((currentBoard) => appendCardToBoard(currentBoard, createdCard));
      setPageNotice({ tone: "success", message: `Tarjeta creada: ${createdCard.title}.` });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        await loadBoard(boardId);
      }

      throw error;
    } finally {
      setPendingCardAction(null);
    }
  };

  const handleCreateColumn = async (payload: CreateColumnPayload) => {
    setPendingColumnAction({ type: "create" });
    setPageNotice(null);

    try {
      const createdColumn = await boardApi.createColumn(boardId, payload);
      applyLocalBoardChange((currentBoard) => appendColumnToBoard(currentBoard, createdColumn));
      setIsColumnComposerOpen(false);
      setPageNotice({ tone: "success", message: `Columna creada: ${createdColumn.title}.` });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        await loadBoard(boardId);
      }

      throw error;
    } finally {
      setPendingColumnAction(null);
    }
  };

  const handleRenameColumn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (columnDialog?.type !== "rename") {
      return;
    }

    setPendingColumnAction({ type: "update", columnId: columnDialog.column.id });
    setColumnDialogError(null);
    setPageNotice(null);

    try {
      const updatedColumn = await boardApi.updateColumn(columnDialog.column.id, { title: columnDialog.title });
      applyLocalBoardChange((currentBoard) => updateColumnInBoard(currentBoard, updatedColumn));
      closeColumnDialog();
      setPageNotice({ tone: "success", message: `Columna renombrada a ${updatedColumn.title}.` });
    } catch (error) {
      const message = getUpdateColumnErrorMessage(error);
      setColumnDialogError(message);

      if (error instanceof ApiClientError && error.status === 404) {
        closeColumnDialog();
        await loadBoard(boardId);
        setPageNotice({ tone: "error", message });
      }
    } finally {
      setPendingColumnAction(null);
    }
  };

  const handleDeleteColumn = async () => {
    if (columnDialog?.type !== "delete") {
      return;
    }

    setPendingColumnAction({ type: "delete", columnId: columnDialog.column.id });
    setColumnDialogError(null);
    setPageNotice(null);

    try {
      await boardApi.deleteColumn(columnDialog.column.id);
      const deletedTitle = columnDialog.column.title;
      applyLocalBoardChange((currentBoard) => removeColumnFromBoard(currentBoard, columnDialog.column.id));
      closeColumnDialog();
      setPageNotice({ tone: "success", message: `Columna eliminada: ${deletedTitle}.` });
    } catch (error) {
      const message = getDeleteColumnErrorMessage(error);
      setColumnDialogError(message);

      if (error instanceof ApiClientError && error.status === 404) {
        closeColumnDialog();
        await loadBoard(boardId);
        setPageNotice({ tone: "error", message });
      }
    } finally {
      setPendingColumnAction(null);
    }
  };

  const handleEditCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cardDialog?.type !== "edit") {
      return;
    }

    const payload: UpdateCardPayload = {
      title: cardDialog.title,
      description: cardDialog.description,
    };

    setPendingCardAction({ type: "edit", cardId: cardDialog.cardId });
    setCardDialogError(null);
    setPageNotice(null);

    try {
      const updatedCard = await boardApi.updateCard(cardDialog.cardId, payload);
      applyLocalBoardChange((currentBoard) => updateCardInBoard(currentBoard, updatedCard));
      closeCardDialog();
      setPageNotice({ tone: "success", message: `Tarjeta actualizada: ${updatedCard.title}.` });
    } catch (error) {
      const message = getEditCardErrorMessage(error);
      setCardDialogError(message);

      if (error instanceof ApiClientError && error.status === 404) {
        closeCardDialog();
        await loadBoard(boardId);
        setPageNotice({ tone: "error", message });
      }
    } finally {
      setPendingCardAction(null);
    }
  };

  const handleDeleteCard = async () => {
    if (cardDialog?.type !== "delete") {
      return;
    }

    setPendingCardAction({ type: "delete", cardId: cardDialog.card.id });
    setCardDialogError(null);
    setPageNotice(null);

    try {
      await boardApi.deleteCard(cardDialog.card.id);
      const deletedTitle = cardDialog.card.title;
      applyLocalBoardChange((currentBoard) => removeCardFromBoard(currentBoard, cardDialog.card.id));
      closeCardDialog();
      setPageNotice({ tone: "success", message: `Tarjeta eliminada: ${deletedTitle}.` });
    } catch (error) {
      const message = getDeleteCardErrorMessage(error);
      setCardDialogError(message);

      if (error instanceof ApiClientError && error.status === 404) {
        closeCardDialog();
        await loadBoard(boardId);
        setPageNotice({ tone: "error", message });
      }
    } finally {
      setPendingCardAction(null);
    }
  };

  const runColumnPlan = useEffectEvent(async (plan: ColumnReorderPlan | null) => {
    if (board === null || plan === null) {
      return;
    }

    const previousBoard = board;
    setIsReordering(true);
    setPageNotice(null);
    setBoardState(plan.board);

    try {
      const nextBoard = await boardApi.reorderColumns(previousBoard.id, { columnIds: plan.columnIds });
      setBoardState(nextBoard);
      setPageNotice({ tone: "success", message: "Orden de columnas actualizado." });
    } catch (error) {
      setBoardState(previousBoard);
      setPageNotice({ tone: "error", message: getReorderErrorMessage(error) });
    } finally {
      setIsReordering(false);
    }
  });

  const runCardPlan = useEffectEvent(async (plan: CardReorderPlan | null) => {
    if (board === null || plan === null) {
      return;
    }

    const previousBoard = board;
    setIsReordering(true);
    setPageNotice(null);
    setBoardState(plan.board);

    try {
      const nextBoard = await boardApi.reorderCards(previousBoard.id, { columns: plan.columns });
      setBoardState(nextBoard);
      setPageNotice({ tone: "success", message: "Orden de tarjetas actualizado." });
    } catch (error) {
      setBoardState(previousBoard);
      setPageNotice({ tone: "error", message: getReorderErrorMessage(error) });
    } finally {
      setIsReordering(false);
    }
  });

  const handleMoveColumn = (columnId: string, direction: -1 | 1) => {
    if (board === null) {
      return;
    }

    void runColumnPlan(getColumnDirectionPlan(board, columnId, direction));
  };

  const handleMoveCardWithinColumn = (columnId: string, cardId: string, direction: -1 | 1) => {
    if (board === null) {
      return;
    }

    void runCardPlan(getCardDirectionPlan(board, columnId, cardId, direction));
  };

  const handleMoveCardAcrossColumns = (sourceColumnId: string, cardId: string, direction: -1 | 1) => {
    if (board === null) {
      return;
    }

    const sourceColumnIndex = board.columns.findIndex((column) => column.id === sourceColumnId);
    if (sourceColumnIndex < 0) {
      return;
    }

    const destinationColumn = board.columns[sourceColumnIndex + direction];
    if (destinationColumn === undefined) {
      return;
    }

    void runCardPlan(getCardAcrossColumnsPlan(board, sourceColumnId, cardId, destinationColumn.id));
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (board === null) {
      return;
    }

    const activeData = getDragData(active.data.current);
    if (activeData?.type === BOARD_DRAG_COLUMN) {
      const activeColumn = board.columns.find((entry) => entry.id === activeData.columnId);
      setActiveDragItem(activeColumn === undefined ? null : { type: BOARD_DRAG_COLUMN, column: activeColumn });
      return;
    }

    if (activeData?.type === BOARD_DRAG_CARD) {
      const activeCard = board.columns.flatMap((column) => column.cards).find((entry) => entry.id === activeData.cardId);
      setActiveDragItem(activeCard === undefined ? null : { type: BOARD_DRAG_CARD, card: activeCard });
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragItem(null);

    if (board === null || over === null) {
      return;
    }

    const activeData = getDragData(active.data.current);
    const overData = getDragData(over.data.current);

    if (activeData?.type === BOARD_DRAG_COLUMN && overData?.type === BOARD_DRAG_COLUMN) {
      void runColumnPlan(getColumnReorderPlan(board, activeData.columnId, overData.columnId));
      return;
    }

    if (activeData?.type !== BOARD_DRAG_CARD || overData === null) {
      return;
    }

    if (overData.type === BOARD_DRAG_CARD) {
      void runCardPlan(getCardDragPlan(board, activeData.cardId, overData));
      return;
    }

    if (overData.type === BOARD_DROP_COLUMN) {
      void runCardPlan(getCardDragPlan(board, activeData.cardId, overData));
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

  if (state.status === "loading") {
    return (
      <section aria-live="polite" className="status-panel board-status">
        <h2>Cargando tablero…</h2>
        <p>Preparando columnas, tarjetas y acciones contextuales del workspace.</p>
      </section>
    );
  }

  if (state.status === "not-found") {
    return (
      <section className="status-panel status-panel-warning board-status">
        <h2>Tablero no encontrado</h2>
        <p>El `boardId` ya no existe o la URL no apunta a un tablero valido.</p>
        <div className="board-status-actions">
          <Link className="primary-button" to="/">
            Volver al dashboard
          </Link>
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="status-panel status-panel-error board-status" role="alert">
        <h2>Error al cargar</h2>
        <p>{state.message}</p>
        <div className="board-status-actions">
          <button className="primary-button" onClick={() => void loadBoard(boardId)} type="button">
            Reintentar
          </button>
          <Link className="secondary-button" to="/">
            Volver al dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="board-page">
      <header className="board-header">
        <Link className="board-breadcrumb" to="/">
          ← Volver al dashboard
        </Link>
        <div className="board-header-main">
          <div className="board-header-copy">
            <p className="board-kicker">Board Workspace</p>
            <h2>{state.board.title}</h2>
            <p className="board-meta">
              /boards/{state.board.id} · {state.board.columns.length} columnas
            </p>
          </div>
        </div>
      </header>

      <BoardColumnComposer
        isOpen={isColumnComposerOpen}
        isSubmitting={pendingColumnAction?.type === "create"}
        onClose={() => setIsColumnComposerOpen(false)}
        onCreate={handleCreateColumn}
        onOpen={() => setIsColumnComposerOpen(true)}
        resolveErrorMessage={getCreateColumnErrorMessage}
      />

      {state.board.columns.length === 0 ? null : (
        <div className="board-toolbar" aria-label="Navegacion interna del tablero">
          <div className="board-jump-list">
            {state.board.columns.map((column) => (
              <a className="board-jump-link" href={`#column-${column.id}`} key={column.id}>
                {column.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {pageNotice === null ? null : (
        <div
          aria-live={pageNotice.tone === "success" ? "polite" : undefined}
          className={pageNoticeClassName}
          role={pageNotice.tone === "success" ? "status" : "alert"}
        >
          <p>{pageNotice.message}</p>
        </div>
      )}

      {state.status === "empty" ? (
        <section className="status-panel board-empty-state">
          <h3>Este tablero todavia no tiene columnas</h3>
          <p>Crea la primera columna para empezar a distribuir tarjetas y priorizar el trabajo.</p>
        </section>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <SortableContext items={columnSortableIds} strategy={horizontalListSortingStrategy}>
            <div className="board-columns" role="list" aria-label="Columnas del tablero">
              {state.board.columns.map((column, columnIndex) => (
                <BoardColumnItem
                  activeComposerColumnId={activeComposerColumnId}
                  board={state.board}
                  column={column}
                  columnIndex={columnIndex}
                  isCardCreatePending={pendingCardAction?.type === "create" && pendingCardAction.columnId === column.id}
                  isColumnBusy={pendingColumnAction !== null || pendingCardAction?.type === "edit" || pendingCardAction?.type === "delete"}
                  isReordering={isReordering}
                  key={column.id}
                  onCloseCardComposer={() => setActiveComposerColumnId(null)}
                  onCreateCard={handleCreateCard}
                  onDeleteCard={(card) => {
                    setCardDialogError(null);
                    setCardDialog({ type: "delete", card });
                  }}
                  onDeleteColumn={(columnToDelete) => {
                    setColumnDialogError(null);
                    setColumnDialog({ type: "delete", column: columnToDelete });
                  }}
                  onEditCard={(card) => {
                    setCardDialogError(null);
                    setCardDialog({
                      type: "edit",
                      cardId: card.id,
                      title: card.title,
                      description: card.description ?? "",
                    });
                  }}
                  onMoveCardAcrossColumns={handleMoveCardAcrossColumns}
                  onMoveCardWithinColumn={handleMoveCardWithinColumn}
                  onMoveColumn={handleMoveColumn}
                  onOpenCardComposer={setActiveComposerColumnId}
                  onRenameColumn={(columnToRename) => {
                    setColumnDialogError(null);
                    setColumnDialog({ type: "rename", column: columnToRename, title: columnToRename.title });
                  }}
                  resolveCreateCardErrorMessage={getCreateCardErrorMessage}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragItem?.type === BOARD_DRAG_COLUMN ? <ColumnOverlay column={activeDragItem.column} /> : null}
            {activeDragItem?.type === BOARD_DRAG_CARD ? <CardOverlay card={activeDragItem.card} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <RenameDialog
        errorMessage={columnDialogError}
        isPending={columnDialog?.type === "rename" && pendingColumnAction?.type === "update"}
        label="Titulo de la columna"
        onClose={closeColumnDialog}
        onSubmit={handleRenameColumn}
        onTitleChange={(nextTitle) =>
          setColumnDialog((current) => (current?.type === "rename" ? { ...current, title: nextTitle } : current))
        }
        open={columnDialog?.type === "rename"}
        title={columnDialog?.type === "rename" ? `Renombrar ${columnDialog.column.title}` : "Renombrar columna"}
        value={columnDialog?.type === "rename" ? columnDialog.title : ""}
      />

      <ConfirmDeleteDialog
        errorMessage={columnDialogError}
        isPending={columnDialog?.type === "delete" && pendingColumnAction?.type === "delete"}
        message="La columna desaparece del tablero actual y el resto conserva un orden coherente."
        onClose={closeColumnDialog}
        onConfirm={() => void handleDeleteColumn()}
        open={columnDialog?.type === "delete"}
        title={columnDialog?.type === "delete" ? `Eliminar ${columnDialog.column.title}` : "Eliminar columna"}
      />

      <EditCardDialog
        description={cardDialog?.type === "edit" ? cardDialog.description : ""}
        errorMessage={cardDialogError}
        isPending={cardDialog?.type === "edit" && pendingCardAction?.type === "edit"}
        onClose={closeCardDialog}
        onDescriptionChange={(nextDescription) =>
          setCardDialog((current) =>
            current?.type === "edit" ? { ...current, description: nextDescription } : current,
          )
        }
        onSubmit={handleEditCard}
        onTitleChange={(nextTitle) =>
          setCardDialog((current) => (current?.type === "edit" ? { ...current, title: nextTitle } : current))
        }
        open={cardDialog?.type === "edit"}
        title={cardDialog?.type === "edit" ? cardDialog.title : ""}
      />

      <ConfirmDeleteDialog
        errorMessage={cardDialogError}
        isPending={cardDialog?.type === "delete" && pendingCardAction?.type === "delete"}
        message="La tarjeta se elimina del tablero y el orden visible se mantiene actualizado."
        onClose={closeCardDialog}
        onConfirm={() => void handleDeleteCard()}
        open={cardDialog?.type === "delete"}
        title={cardDialog?.type === "delete" ? `Eliminar ${cardDialog.card.title}` : "Eliminar tarjeta"}
      />
    </section>
  );
};
