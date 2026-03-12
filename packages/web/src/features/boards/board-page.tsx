import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";

import { ApiClientError } from "../../lib/api-client";
import {
  boardApi,
  type BoardCard,
  type BoardColumn,
  type BoardView,
  type CreateCardPayload,
  type UpdateCardPayload,
} from "./board-api";
import {
  BOARD_DRAG_CARD,
  BOARD_DRAG_COLUMN,
  BOARD_DROP_COLUMN,
  getCardAcrossColumnsPlan,
  getCardDirectionPlan,
  getCardDragData,
  getCardDragPlan,
  getCardSortableId,
  getColumnDirectionPlan,
  getColumnDragData,
  getColumnDropData,
  getColumnDropZoneId,
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

type EditCardState = {
  cardId: string;
  title: string;
  description: string;
};

type PendingCardAction = {
  cardId: string;
  type: "edit" | "delete";
};

type CardComposerProps = {
  columnId: string;
  columnTitle: string;
  onCreate: (columnId: string, payload: CreateCardPayload) => Promise<void>;
};

type SortableColumnProps = {
  board: BoardView;
  column: BoardColumn;
  columnIndex: number;
  isReordering: boolean;
  pendingCardAction: PendingCardAction | null;
  cardActionError: { cardId: string; message: string } | null;
  onMoveColumn: (columnId: string, direction: -1 | 1) => void;
  onMoveCardWithinColumn: (columnId: string, cardId: string, direction: -1 | 1) => void;
  onMoveCardAcrossColumns: (sourceColumnId: string, cardId: string, direction: -1 | 1) => void;
  onCreateCard: (columnId: string, payload: CreateCardPayload) => Promise<void>;
  onEditCard: (card: BoardCard) => void;
  onDeleteCard: (card: BoardCard) => Promise<void>;
};

type SortableCardProps = {
  board: BoardView;
  card: BoardCard;
  cardIndex: number;
  column: BoardColumn;
  columnIndex: number;
  isReordering: boolean;
  pendingCardAction: PendingCardAction | null;
  cardActionError: { cardId: string; message: string } | null;
  onMoveWithinColumn: (columnId: string, cardId: string, direction: -1 | 1) => void;
  onMoveAcrossColumns: (sourceColumnId: string, cardId: string, direction: -1 | 1) => void;
  onEditCard: (card: BoardCard) => void;
  onDeleteCard: (card: BoardCard) => Promise<void>;
};

const resolveBoardState = (board: BoardView): BoardPageState => {
  return board.columns.length === 0 ? { status: "empty", board } : { status: "ready", board };
};

const getCreateErrorMessage = (error: unknown): string => {
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

const getEditErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "Ingresa un titulo valido para editar la tarjeta.";
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return "La tarjeta ya no existe. Recarga el tablero.";
  }

  return "No pudimos guardar los cambios de la tarjeta. Intenta de nuevo.";
};

const getDeleteErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 404) {
    return "La tarjeta ya no existe. Recarga el tablero.";
  }

  return "No pudimos eliminar la tarjeta. Intenta de nuevo.";
};

const updateCardInBoard = (board: BoardView, updatedCard: BoardCard & { columnId: string }): BoardView => ({
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

const CardComposer = ({ columnId, columnTitle, onCreate }: CardComposerProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onCreate(columnId, { title, description });
      setTitle("");
      setDescription("");
    } catch (error) {
      setErrorMessage(getCreateErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="card-composer" onSubmit={handleSubmit}>
      <h3 className="card-composer-title">Nueva tarjeta</h3>
      <label className="card-composer-label">
        <span>Titulo</span>
        <input
          aria-label={`Titulo para ${columnTitle}`}
          className="card-composer-input"
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Escribe el trabajo pendiente"
          value={title}
        />
      </label>
      <label className="card-composer-label">
        <span>Descripcion</span>
        <textarea
          aria-label={`Descripcion para ${columnTitle}`}
          className="card-composer-textarea"
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Contexto opcional"
          rows={3}
          value={description}
        />
      </label>
      <button className="card-composer-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Guardando..." : "Crear tarjeta"}
      </button>
      {errorMessage === null ? null : (
        <p className="board-feedback board-feedback-error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
};

const ColumnDropZone = ({ columnId, children }: { columnId: string; children: ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: getColumnDropZoneId(columnId),
    data: getColumnDropData(columnId),
  });

  return (
    <ol className={`card-list ${isOver ? "card-list-over" : ""}`} ref={setNodeRef}>
      {children}
    </ol>
  );
};

const SortableCard = ({
  board,
  card,
  cardIndex,
  column,
  columnIndex,
  isReordering,
  pendingCardAction,
  cardActionError,
  onMoveWithinColumn,
  onMoveAcrossColumns,
  onEditCard,
  onDeleteCard,
}: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: getCardSortableId(card.id),
    data: getCardDragData(column.id, card.id),
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCardActionPending = pendingCardAction !== null;
  const isEditingThisCard = pendingCardAction?.cardId === card.id && pendingCardAction.type === "edit";
  const isDeletingThisCard = pendingCardAction?.cardId === card.id && pendingCardAction.type === "delete";

  return (
    <li
      className={`card-item ${isDragging ? "card-item-dragging" : ""} ${isOver ? "card-item-over" : ""}`}
      key={card.id}
      ref={setNodeRef}
      style={style}
    >
      <div className="card-item-body">
        <div className="card-item-topline">
          <button
            aria-label={`Arrastrar tarjeta ${card.title}`}
            className="drag-handle"
            disabled={isReordering || isCardActionPending}
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
          >
            Arrastrar
          </button>
          <p className="card-title">{card.title}</p>
        </div>
        {card.description === null ? null : <p className="card-description">{card.description}</p>}
      </div>
      <div className="card-actions" aria-label={`Controles accesibles para ${card.title}`}>
        <button
          aria-label={`Editar ${card.title}`}
          className="board-action-button"
          disabled={isCardActionPending}
          onClick={() => onEditCard(card)}
          type="button"
        >
          {isEditingThisCard ? "Guardando..." : "Editar"}
        </button>
        <button
          aria-label={`Eliminar ${card.title}`}
          className="board-action-button board-action-button-danger"
          disabled={isCardActionPending}
          onClick={() => void onDeleteCard(card)}
          type="button"
        >
          {isDeletingThisCard ? "Eliminando..." : "Eliminar"}
        </button>
        <button
          aria-label={`Subir ${card.title}`}
          className="board-action-button"
          disabled={isReordering || isCardActionPending || cardIndex === 0}
          onClick={() => onMoveWithinColumn(column.id, card.id, -1)}
          type="button"
        >
          Subir
        </button>
        <button
          aria-label={`Bajar ${card.title}`}
          className="board-action-button"
          disabled={isReordering || isCardActionPending || cardIndex === column.cards.length - 1}
          onClick={() => onMoveWithinColumn(column.id, card.id, 1)}
          type="button"
        >
          Bajar
        </button>
        <button
          aria-label={`Mover ${card.title} a ${board.columns[columnIndex - 1]?.title ?? "la columna anterior"}`}
          className="board-action-button"
          disabled={isReordering || isCardActionPending || columnIndex === 0}
          onClick={() => onMoveAcrossColumns(column.id, card.id, -1)}
          type="button"
        >
          Izq
        </button>
        <button
          aria-label={`Mover ${card.title} a ${board.columns[columnIndex + 1]?.title ?? "la columna siguiente"}`}
          className="board-action-button"
          disabled={isReordering || isCardActionPending || columnIndex === board.columns.length - 1}
          onClick={() => onMoveAcrossColumns(column.id, card.id, 1)}
          type="button"
        >
          Der
        </button>
      </div>
      {cardActionError?.cardId === card.id ? (
        <p className="board-feedback board-feedback-error" role="alert">
          {cardActionError.message}
        </p>
      ) : null}
    </li>
  );
};

const SortableColumn = ({
  board,
  column,
  columnIndex,
  isReordering,
  pendingCardAction,
  cardActionError,
  onMoveColumn,
  onMoveCardWithinColumn,
  onMoveCardAcrossColumns,
  onCreateCard,
  onEditCard,
  onDeleteCard,
}: SortableColumnProps) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: getColumnSortableId(column.id),
    data: getColumnDragData(column.id),
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={`board-column ${isDragging ? "board-column-dragging" : ""} ${isOver ? "board-column-over" : ""}`}
      key={column.id}
      ref={setNodeRef}
      role="listitem"
      style={style}
    >
      <header className="board-column-header">
        <div className="board-column-heading">
          <div className="board-column-title-row">
            <button
              aria-label={`Arrastrar columna ${column.title}`}
              className="drag-handle"
              disabled={isReordering || pendingCardAction !== null}
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
            >
              Arrastrar
            </button>
            <h3>{column.title}</h3>
          </div>
          <span>{column.cards.length} tarjetas</span>
        </div>
        <div className="board-column-actions" aria-label={`Controles accesibles para ${column.title}`}>
          <button
            aria-label={`Mover ${column.title} a la izquierda`}
            className="board-action-button"
            disabled={isReordering || pendingCardAction !== null || columnIndex === 0}
            onClick={() => onMoveColumn(column.id, -1)}
            type="button"
          >
            Izq
          </button>
          <button
            aria-label={`Mover ${column.title} a la derecha`}
            className="board-action-button"
            disabled={
              isReordering || pendingCardAction !== null || columnIndex === board.columns.length - 1
            }
            onClick={() => onMoveColumn(column.id, 1)}
            type="button"
          >
            Der
          </button>
        </div>
      </header>

      <SortableContext items={column.cards.map((card) => getCardSortableId(card.id))} strategy={verticalListSortingStrategy}>
        <ColumnDropZone columnId={column.id}>
          {column.cards.map((card, cardIndex) => (
            <SortableCard
              board={board}
              card={card}
              cardActionError={cardActionError}
              cardIndex={cardIndex}
              column={column}
              columnIndex={columnIndex}
              isReordering={isReordering}
              key={card.id}
              onDeleteCard={onDeleteCard}
              onEditCard={onEditCard}
              onMoveAcrossColumns={onMoveCardAcrossColumns}
              onMoveWithinColumn={onMoveCardWithinColumn}
              pendingCardAction={pendingCardAction}
            />
          ))}
        </ColumnDropZone>
      </SortableContext>

      <CardComposer columnId={column.id} columnTitle={column.title} onCreate={onCreateCard} />
    </article>
  );
};

const ColumnOverlay = ({ column }: { column: BoardColumn }) => (
  <article className="board-column board-column-overlay">
    <header className="board-column-header">
      <div className="board-column-heading">
        <div className="board-column-title-row">
          <span className="drag-handle drag-handle-static">Arrastrar</span>
          <h3>{column.title}</h3>
        </div>
        <span>{column.cards.length} tarjetas</span>
      </div>
    </header>
  </article>
);

const CardOverlay = ({ card }: { card: BoardCard }) => (
  <div className="card-item card-item-overlay">
    <div className="card-item-body">
      <div className="card-item-topline">
        <span className="drag-handle drag-handle-static">Arrastrar</span>
        <p className="card-title">{card.title}</p>
      </div>
      {card.description === null ? null : <p className="card-description">{card.description}</p>}
    </div>
  </div>
);

export const BoardPage = ({ boardId }: BoardPageProps) => {
  const [state, setState] = useState<BoardPageState>({ status: "loading" });
  const [isReordering, setIsReordering] = useState(false);
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<EditCardState | null>(null);
  const [pendingCardAction, setPendingCardAction] = useState<PendingCardAction | null>(null);
  const [cardActionError, setCardActionError] = useState<{ cardId: string; message: string } | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem>(null);

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

  const board = state.status === "ready" || state.status === "empty" ? state.board : null;

  const setBoardState = useEffectEvent((boardView: BoardView) => {
    startTransition(() => {
      setState(resolveBoardState(boardView));
    });
  });

  const applyBoardState = useEffectEvent((boardView: BoardView) => {
    setBoardState(boardView);
    setReorderErrorMessage(null);
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
    setState((current) => {
      if (current.status === "ready" || current.status === "empty") {
        return current;
      }

      return { status: "loading" };
    });

    try {
      const boardView = await boardApi.getBoard(nextBoardId);
      applyBoardState(boardView);
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

  const handleCreateCard = async (columnId: string, payload: CreateCardPayload) => {
    await boardApi.createCard(columnId, payload);
    await loadBoard(boardId);
  };

  const handleStartEditCard = (card: BoardCard) => {
    setCardActionError(null);
    setEditingCard({
      cardId: card.id,
      title: card.title,
      description: card.description ?? "",
    });
  };

  const handleEditCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingCard === null) {
      return;
    }

    const payload: UpdateCardPayload = {
      title: editingCard.title,
      description: editingCard.description,
    };

    setPendingCardAction({ cardId: editingCard.cardId, type: "edit" });
    setCardActionError(null);

    try {
      const updatedCard = await boardApi.updateCard(editingCard.cardId, payload);
      applyLocalBoardChange((currentBoard) => updateCardInBoard(currentBoard, updatedCard));
      setEditingCard(null);
    } catch (error) {
      setCardActionError({
        cardId: editingCard.cardId,
        message: getEditErrorMessage(error),
      });
    } finally {
      setPendingCardAction(null);
    }
  };

  const handleDeleteCard = async (card: BoardCard) => {
    const shouldDelete = window.confirm(`Eliminar \"${card.title}\"? Esta accion no se puede deshacer.`);
    if (!shouldDelete) {
      return;
    }

    setPendingCardAction({ cardId: card.id, type: "delete" });
    setCardActionError(null);

    try {
      await boardApi.deleteCard(card.id);
      applyLocalBoardChange((currentBoard) => removeCardFromBoard(currentBoard, card.id));
      if (editingCard?.cardId === card.id) {
        setEditingCard(null);
      }
    } catch (error) {
      setCardActionError({
        cardId: card.id,
        message: getDeleteErrorMessage(error),
      });
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
    setReorderErrorMessage(null);
    setBoardState(plan.board);

    try {
      const nextBoard = await boardApi.reorderColumns(previousBoard.id, { columnIds: plan.columnIds });
      applyBoardState(nextBoard);
    } catch (error) {
      setBoardState(previousBoard);
      setReorderErrorMessage(getReorderErrorMessage(error));
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
    setReorderErrorMessage(null);
    setBoardState(plan.board);

    try {
      const nextBoard = await boardApi.reorderCards(previousBoard.id, { columns: plan.columns });
      applyBoardState(nextBoard);
    } catch (error) {
      setBoardState(previousBoard);
      setReorderErrorMessage(getReorderErrorMessage(error));
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
      const activeCard = board.columns
        .flatMap((column) => column.cards)
        .find((entry) => entry.id === activeData.cardId);
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

  const columnSortableIds = useMemo(
    () => board?.columns.map((column) => getColumnSortableId(column.id)) ?? [],
    [board],
  );

  if (state.status === "loading") {
    return (
      <section aria-live="polite" className="board-status">
        <h2>Cargando tablero...</h2>
        <p>Consultando columnas y tarjetas desde la API.</p>
      </section>
    );
  }

  if (state.status === "not-found") {
    return (
      <section className="board-status board-status-warning">
        <h2>Tablero no encontrado</h2>
        <p>Revisa el `boardId` de la ruta o prepara datos de prueba en la base.</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="board-status board-status-error" role="alert">
        <h2>Error al cargar</h2>
        <p>{state.message}</p>
      </section>
    );
  }

  return (
    <section className="board-page">
      <header className="board-header">
        <div>
          <p className="board-kicker">Board View</p>
          <h2>{state.board.title}</h2>
        </div>
        <p className="board-meta">Ruta activa: /boards/{state.board.id}</p>
      </header>
      {reorderErrorMessage === null ? null : (
        <p className="board-feedback board-feedback-error board-feedback-banner" role="alert">
          {reorderErrorMessage}
        </p>
      )}

      {state.status === "empty" ? (
        <div className="board-empty-state">
          <h3>Este tablero todavia no tiene columnas</h3>
          <p>Cuando existan columnas, cada una mostrara sus tarjetas y el formulario de alta.</p>
        </div>
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
                <SortableColumn
                  board={state.board}
                  cardActionError={cardActionError}
                  column={column}
                  columnIndex={columnIndex}
                  isReordering={isReordering}
                  key={column.id}
                  onCreateCard={handleCreateCard}
                  onDeleteCard={handleDeleteCard}
                  onEditCard={handleStartEditCard}
                  onMoveCardAcrossColumns={handleMoveCardAcrossColumns}
                  onMoveCardWithinColumn={handleMoveCardWithinColumn}
                  onMoveColumn={handleMoveColumn}
                  pendingCardAction={pendingCardAction}
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
      {editingCard === null ? null : (
        <div className="board-modal-backdrop" role="presentation">
          <div aria-label="Editar tarjeta" aria-modal="true" className="board-modal" role="dialog">
            <form className="board-modal-form" onSubmit={handleEditCard}>
              <div className="board-modal-header">
                <div>
                  <p className="board-kicker">Editar tarjeta</p>
                  <h3>Actualiza el contenido visible del tablero</h3>
                </div>
                <button
                  className="board-action-button"
                  disabled={pendingCardAction?.type === "edit"}
                  onClick={() => setEditingCard(null)}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
              <label className="card-composer-label">
                <span>Titulo</span>
                <input
                  aria-label="Titulo de la tarjeta"
                  className="card-composer-input"
                  name="title"
                  onChange={(event) =>
                    setEditingCard((current) =>
                      current === null ? current : { ...current, title: event.target.value },
                    )
                  }
                  value={editingCard.title}
                />
              </label>
              <label className="card-composer-label">
                <span>Descripcion</span>
                <textarea
                  aria-label="Descripcion de la tarjeta"
                  className="card-composer-textarea"
                  name="description"
                  onChange={(event) =>
                    setEditingCard((current) =>
                      current === null ? current : { ...current, description: event.target.value },
                    )
                  }
                  rows={4}
                  value={editingCard.description}
                />
              </label>
              {cardActionError?.cardId === editingCard.cardId ? (
                <p className="board-feedback board-feedback-error" role="alert">
                  {cardActionError.message}
                </p>
              ) : null}
              <div className="board-modal-actions">
                <button className="card-composer-submit" disabled={pendingCardAction?.type === "edit"} type="submit">
                  {pendingCardAction?.type === "edit" ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
