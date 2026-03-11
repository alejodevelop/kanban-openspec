import { startTransition, useEffect, useEffectEvent, useState, type FormEvent } from "react";

import { ApiClientError } from "../../lib/api-client";
import {
  boardApi,
  type BoardView,
  type CreateCardPayload,
  type ReorderCardsColumnPayload,
} from "./board-api";

type BoardPageProps = {
  boardId: string;
};

type BoardPageState =
  | { status: "loading" }
  | { status: "ready"; board: BoardView }
  | { status: "empty"; board: BoardView }
  | { status: "not-found" }
  | { status: "error"; message: string };

type CardComposerProps = {
  columnId: string;
  columnTitle: string;
  onCreate: (columnId: string, payload: CreateCardPayload) => Promise<void>;
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

const swapItems = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  const nextItems = items.slice();
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
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

export const BoardPage = ({ boardId }: BoardPageProps) => {
  const [state, setState] = useState<BoardPageState>({ status: "loading" });
  const [isReordering, setIsReordering] = useState(false);
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | null>(null);

  const applyBoardState = useEffectEvent((board: BoardView) => {
    startTransition(() => {
      setState(resolveBoardState(board));
    });
    setReorderErrorMessage(null);
  });

  const loadBoard = useEffectEvent(async (nextBoardId: string) => {
    setState((current) => {
      if (current.status === "ready" || current.status === "empty") {
        return current;
      }

      return { status: "loading" };
    });

    try {
      const board = await boardApi.getBoard(nextBoardId);
      applyBoardState(board);
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

  const runReorder = useEffectEvent(async (reorderOperation: () => Promise<BoardView>) => {
    setIsReordering(true);
    setReorderErrorMessage(null);

    try {
      const board = await reorderOperation();
      applyBoardState(board);
    } catch (error) {
      setReorderErrorMessage(getReorderErrorMessage(error));
    } finally {
      setIsReordering(false);
    }
  });

  const handleMoveColumn = (columnIndex: number, direction: -1 | 1) => {
    if (state.status !== "ready") {
      return;
    }

    const destinationIndex = columnIndex + direction;
    if (destinationIndex < 0 || destinationIndex >= state.board.columns.length) {
      return;
    }

    const nextColumnIds = swapItems(
      state.board.columns.map((column) => column.id),
      columnIndex,
      destinationIndex,
    );

    void runReorder(async () => await boardApi.reorderColumns(state.board.id, { columnIds: nextColumnIds }));
  };

  const handleReorderCards = (columns: ReorderCardsColumnPayload[]) => {
    if (state.status !== "ready") {
      return;
    }

    void runReorder(async () => await boardApi.reorderCards(state.board.id, { columns }));
  };

  const handleMoveCardWithinColumn = (columnIndex: number, cardIndex: number, direction: -1 | 1) => {
    if (state.status !== "ready") {
      return;
    }

    const column = state.board.columns[columnIndex];
    if (column === undefined) {
      return;
    }

    const destinationIndex = cardIndex + direction;
    if (destinationIndex < 0 || destinationIndex >= column.cards.length) {
      return;
    }

    handleReorderCards([
      {
        columnId: column.id,
        cardIds: swapItems(
          column.cards.map((card) => card.id),
          cardIndex,
          destinationIndex,
        ),
      },
    ]);
  };

  const handleMoveCardAcrossColumns = (columnIndex: number, cardIndex: number, direction: -1 | 1) => {
    if (state.status !== "ready") {
      return;
    }

    const sourceColumn = state.board.columns[columnIndex];
    const destinationColumn = state.board.columns[columnIndex + direction];
    const movedCard = sourceColumn?.cards[cardIndex];

    if (sourceColumn === undefined || destinationColumn === undefined || movedCard === undefined) {
      return;
    }

    handleReorderCards([
      {
        columnId: sourceColumn.id,
        cardIds: sourceColumn.cards
          .filter((_, index) => index !== cardIndex)
          .map((card) => card.id),
      },
      {
        columnId: destinationColumn.id,
        cardIds: [...destinationColumn.cards.map((card) => card.id), movedCard.id],
      },
    ]);
  };

  if (state.status === "loading") {
    return (
      <section className="board-status" aria-live="polite">
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

  const board = state.board;

  return (
    <section className="board-page">
      <header className="board-header">
        <div>
          <p className="board-kicker">Board View</p>
          <h2>{board.title}</h2>
        </div>
        <p className="board-meta">Ruta activa: /boards/{board.id}</p>
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
        <div className="board-columns" role="list" aria-label="Columnas del tablero">
          {board.columns.map((column, columnIndex) => (
            <article className="board-column" key={column.id} role="listitem">
              <header className="board-column-header">
                <div className="board-column-heading">
                  <h3>{column.title}</h3>
                  <span>{column.cards.length} tarjetas</span>
                </div>
                <div className="board-column-actions">
                  <button
                    aria-label={`Mover ${column.title} a la izquierda`}
                    className="board-action-button"
                    disabled={isReordering || columnIndex === 0}
                    onClick={() => handleMoveColumn(columnIndex, -1)}
                    type="button"
                  >
                    Izq
                  </button>
                  <button
                    aria-label={`Mover ${column.title} a la derecha`}
                    className="board-action-button"
                    disabled={isReordering || columnIndex === board.columns.length - 1}
                    onClick={() => handleMoveColumn(columnIndex, 1)}
                    type="button"
                  >
                    Der
                  </button>
                </div>
              </header>

              <ol className="card-list">
                {column.cards.map((card, cardIndex) => (
                  <li className="card-item" key={card.id}>
                    <div className="card-item-body">
                      <p className="card-title">{card.title}</p>
                      {card.description === null ? null : (
                        <p className="card-description">{card.description}</p>
                      )}
                    </div>
                    <div className="card-actions">
                      <button
                        aria-label={`Subir ${card.title}`}
                        className="board-action-button"
                        disabled={isReordering || cardIndex === 0}
                        onClick={() => handleMoveCardWithinColumn(columnIndex, cardIndex, -1)}
                        type="button"
                      >
                        Subir
                      </button>
                      <button
                        aria-label={`Bajar ${card.title}`}
                        className="board-action-button"
                        disabled={isReordering || cardIndex === column.cards.length - 1}
                        onClick={() => handleMoveCardWithinColumn(columnIndex, cardIndex, 1)}
                        type="button"
                      >
                        Bajar
                      </button>
                      <button
                        aria-label={`Mover ${card.title} a ${
                          board.columns[columnIndex - 1]?.title ?? "la columna anterior"
                        }`}
                        className="board-action-button"
                        disabled={isReordering || columnIndex === 0}
                        onClick={() => handleMoveCardAcrossColumns(columnIndex, cardIndex, -1)}
                        type="button"
                      >
                        Izq
                      </button>
                      <button
                        aria-label={`Mover ${card.title} a ${
                          board.columns[columnIndex + 1]?.title ?? "la columna siguiente"
                        }`}
                        className="board-action-button"
                        disabled={isReordering || columnIndex === board.columns.length - 1}
                        onClick={() => handleMoveCardAcrossColumns(columnIndex, cardIndex, 1)}
                        type="button"
                      >
                        Der
                      </button>
                    </div>
                  </li>
                ))}
              </ol>

              <CardComposer columnId={column.id} columnTitle={column.title} onCreate={handleCreateCard} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
