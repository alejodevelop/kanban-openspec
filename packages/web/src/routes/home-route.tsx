import { startTransition, useEffect, useEffectEvent, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { ApiClientError } from "../lib/api-client";
import { boardApi, type BoardSummary } from "../features/boards/board-api";

type HomeRouteState =
  | { status: "loading" }
  | { status: "ready"; boards: BoardSummary[] }
  | { status: "empty" }
  | { status: "error"; message: string };

type PendingBoardAction =
  | { type: "create" }
  | { type: "update" | "delete"; boardId: string }
  | null;

const getDashboardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status >= 500) {
    return "No pudimos cargar los tableros. Verifica la API e intenta de nuevo.";
  }

  return "No pudimos cargar los tableros disponibles. Intenta de nuevo en unos segundos.";
};

const getCreateBoardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "Ingresa un titulo valido para crear el board.";
  }

  return "No pudimos crear el board. Intenta de nuevo.";
};

const getUpdateBoardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 400) {
    return "Ingresa un titulo valido para renombrar el board.";
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return "El board ya no existe. Actualizamos el dashboard para reflejarlo.";
  }

  return "No pudimos renombrar el board. Intenta de nuevo.";
};

const getDeleteBoardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 404) {
    return "El board ya no existe. Actualizamos el dashboard para reflejarlo.";
  }

  return "No pudimos eliminar el board. Intenta de nuevo.";
};

export const HomeRoute = () => {
  const [state, setState] = useState<HomeRouteState>({ status: "loading" });
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [pendingBoardAction, setPendingBoardAction] = useState<PendingBoardAction>(null);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);

  const applyBoardsState = useEffectEvent((boards: BoardSummary[]) => {
    startTransition(() => {
      setState(boards.length === 0 ? { status: "empty" } : { status: "ready", boards });
    });
  });

  const loadBoards = useEffectEvent(async () => {
    setState({ status: "loading" });

    try {
      applyBoardsState(await boardApi.listBoards());
    } catch (error) {
      setState({
        status: "error",
        message: getDashboardErrorMessage(error),
      });
    }
  });

  useEffect(() => {
    void loadBoards();
  }, []);

  const handleCreateBoard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPendingBoardAction({ type: "create" });
    setCreateErrorMessage(null);
    setMutationErrorMessage(null);

    try {
      await boardApi.createBoard({ title: newBoardTitle });
      setNewBoardTitle("");
      await loadBoards();
    } catch (error) {
      setCreateErrorMessage(getCreateBoardErrorMessage(error));
    } finally {
      setPendingBoardAction(null);
    }
  };

  const handleRenameBoard = async (board: BoardSummary) => {
    const nextTitle = window.prompt(`Nuevo titulo para \"${board.title}\"`, board.title);
    if (nextTitle === null) {
      return;
    }

    setPendingBoardAction({ type: "update", boardId: board.id });
    setCreateErrorMessage(null);
    setMutationErrorMessage(null);

    try {
      await boardApi.updateBoard(board.id, { title: nextTitle });
      await loadBoards();
    } catch (error) {
      setMutationErrorMessage(getUpdateBoardErrorMessage(error));
      if (error instanceof ApiClientError && error.status === 404) {
        await loadBoards();
      }
    } finally {
      setPendingBoardAction(null);
    }
  };

  const handleDeleteBoard = async (board: BoardSummary) => {
    const shouldDelete = window.confirm(`Eliminar \"${board.title}\"? Esta accion no se puede deshacer.`);
    if (!shouldDelete) {
      return;
    }

    setPendingBoardAction({ type: "delete", boardId: board.id });
    setCreateErrorMessage(null);
    setMutationErrorMessage(null);

    try {
      await boardApi.deleteBoard(board.id);
      await loadBoards();
    } catch (error) {
      setMutationErrorMessage(getDeleteBoardErrorMessage(error));
      if (error instanceof ApiClientError && error.status === 404) {
        await loadBoards();
      }
    } finally {
      setPendingBoardAction(null);
    }
  };

  return (
    <section className="dashboard-home">
      <header className="dashboard-home-header">
        <div>
          <p className="board-kicker">Board Dashboard</p>
          <h2>Elige un tablero para continuar.</h2>
        </div>
        <p className="dashboard-home-copy">
          La home ahora lista boards reales con un resumen rapido de columnas y tarjetas.
        </p>
      </header>

      <form className="card-composer dashboard-board-form" onSubmit={handleCreateBoard}>
        <h3 className="card-composer-title">Crear board</h3>
        <label className="card-composer-label">
          <span>Titulo</span>
          <input
            aria-label="Titulo del nuevo board"
            className="card-composer-input"
            name="title"
            onChange={(event) => setNewBoardTitle(event.target.value)}
            placeholder="Por ejemplo, Delivery board"
            value={newBoardTitle}
          />
        </label>
        <button className="card-composer-submit" disabled={pendingBoardAction !== null} type="submit">
          {pendingBoardAction?.type === "create" ? "Creando..." : "Crear board"}
        </button>
        {createErrorMessage === null ? null : (
          <p className="board-feedback board-feedback-error" role="alert">
            {createErrorMessage}
          </p>
        )}
      </form>

      {mutationErrorMessage === null ? null : (
        <p className="board-feedback board-feedback-error board-feedback-banner" role="alert">
          {mutationErrorMessage}
        </p>
      )}

      {state.status === "loading" ? (
        <section className="dashboard-state" aria-live="polite">
          <h2>Cargando dashboard...</h2>
          <p>Consultando los tableros disponibles para entrar al espacio de trabajo.</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="dashboard-state dashboard-state-error" role="alert">
          <h2>Error al cargar boards</h2>
          <p>{state.message}</p>
        </section>
      ) : null}

      {state.status === "empty" ? (
        <section className="dashboard-state dashboard-state-empty">
          <h2>Todavia no hay boards</h2>
          <p>Crea el primer board desde este dashboard para empezar a trabajar.</p>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <div className="board-summary-list" role="list" aria-label="Boards disponibles">
          {state.boards.map((board) => {
            const isUpdating = pendingBoardAction?.type === "update" && pendingBoardAction.boardId === board.id;
            const isDeleting = pendingBoardAction?.type === "delete" && pendingBoardAction.boardId === board.id;

            return (
              <article className="board-summary-card" key={board.id} role="listitem">
                <div className="board-summary-copy">
                  <p className="board-summary-eyebrow">/{board.id}</p>
                  <h3>{board.title}</h3>
                  <p className="board-summary-metrics">
                    <span>{board.columnCount} columnas</span>
                    <span>{board.cardCount} tarjetas</span>
                  </p>
                </div>

                <div className="dashboard-board-actions" aria-label={`Acciones para ${board.title}`}>
                  <Link className="route-link" to={`/boards/${board.id}`}>
                    Abrir board
                  </Link>
                  <button
                    className="board-action-button"
                    disabled={pendingBoardAction !== null}
                    onClick={() => void handleRenameBoard(board)}
                    type="button"
                  >
                    {isUpdating ? "Guardando..." : "Renombrar"}
                  </button>
                  <button
                    className="board-action-button board-action-button-danger"
                    disabled={pendingBoardAction !== null}
                    onClick={() => void handleDeleteBoard(board)}
                    type="button"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
