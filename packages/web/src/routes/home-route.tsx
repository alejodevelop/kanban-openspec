import { startTransition, useEffect, useEffectEvent, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { ActionMenu } from "../components/ui/action-menu";
import { Dialog } from "../components/ui/dialog";
import { boardApi, type BoardSummary } from "../features/boards/board-api";
import { ApiClientError } from "../lib/api-client";

type HomeRouteState =
  | { status: "loading" }
  | { status: "ready"; boards: BoardSummary[] }
  | { status: "empty" }
  | { status: "error"; message: string };

type PendingBoardAction =
  | { type: "create" }
  | { type: "update" | "delete"; boardId: string }
  | null;

type DialogState =
  | { type: "rename"; board: BoardSummary; title: string }
  | { type: "delete"; board: BoardSummary }
  | null;

type MutationNotice =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string }
  | null;

const countFormatter = new Intl.NumberFormat("es-ES");

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

const getBoardsFromState = (state: HomeRouteState) => (state.status === "ready" ? state.boards : []);

const resolveBoardsState = (boards: BoardSummary[]): HomeRouteState =>
  boards.length === 0 ? { status: "empty" } : { status: "ready", boards };

const formatBoardMetrics = (board: BoardSummary) => {
  return `${countFormatter.format(board.columnCount)} columnas · ${countFormatter.format(board.cardCount)} tarjetas`;
};

export const HomeRoute = () => {
  const [state, setState] = useState<HomeRouteState>({ status: "loading" });
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [pendingBoardAction, setPendingBoardAction] = useState<PendingBoardAction>(null);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [dialogErrorMessage, setDialogErrorMessage] = useState<string | null>(null);
  const [mutationNotice, setMutationNotice] = useState<MutationNotice>(null);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

  const boardCount = useMemo(() => getBoardsFromState(state).length, [state]);
  const mutationNoticeClassName =
    mutationNotice === null
      ? "feedback-banner"
      : `feedback-banner ${mutationNotice.tone === "success" ? "feedback-banner-success" : "feedback-banner-error"}`;

  const applyBoardsState = useEffectEvent((boards: BoardSummary[]) => {
    startTransition(() => {
      setState(resolveBoardsState(boards));
    });
  });

  const updateBoardsLocally = useEffectEvent((updater: (boards: BoardSummary[]) => BoardSummary[]) => {
    startTransition(() => {
      setState((current) => {
        if (current.status !== "ready" && current.status !== "empty") {
          return current;
        }

        return resolveBoardsState(updater(getBoardsFromState(current)));
      });
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

  const closeDialog = () => {
    setDialogState(null);
    setDialogErrorMessage(null);
  };

  const handleCreateBoard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPendingBoardAction({ type: "create" });
    setCreateErrorMessage(null);
    setMutationNotice(null);

    try {
      const createdBoard = await boardApi.createBoard({ title: newBoardTitle });
      updateBoardsLocally((boards) => [
        {
          id: createdBoard.id,
          title: createdBoard.title,
          columnCount: 0,
          cardCount: 0,
        },
        ...boards,
      ]);
      setNewBoardTitle("");
      setIsCreatePanelOpen(false);
      setMutationNotice({
        tone: "success",
        message: `Board creado: ${createdBoard.title}.`,
      });
    } catch (error) {
      setCreateErrorMessage(getCreateBoardErrorMessage(error));
    } finally {
      setPendingBoardAction(null);
    }
  };

  const handleRenameBoard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (dialogState?.type !== "rename") {
      return;
    }

    setPendingBoardAction({ type: "update", boardId: dialogState.board.id });
    setDialogErrorMessage(null);
    setMutationNotice(null);

    try {
      const updatedBoard = await boardApi.updateBoard(dialogState.board.id, { title: dialogState.title });
      updateBoardsLocally((boards) =>
        boards.map((board) =>
          board.id === updatedBoard.id
            ? {
                ...board,
                title: updatedBoard.title,
              }
            : board,
        ),
      );
      closeDialog();
      setMutationNotice({
        tone: "success",
        message: `Board renombrado a ${updatedBoard.title}.`,
      });
    } catch (error) {
      const message = getUpdateBoardErrorMessage(error);
      setDialogErrorMessage(message);

      if (error instanceof ApiClientError && error.status === 404) {
        closeDialog();
        await loadBoards();
        setMutationNotice({ tone: "error", message });
      }
    } finally {
      setPendingBoardAction(null);
    }
  };

  const handleDeleteBoard = async () => {
    if (dialogState?.type !== "delete") {
      return;
    }

    setPendingBoardAction({ type: "delete", boardId: dialogState.board.id });
    setDialogErrorMessage(null);
    setMutationNotice(null);

    try {
      await boardApi.deleteBoard(dialogState.board.id);
      updateBoardsLocally((boards) => boards.filter((board) => board.id !== dialogState.board.id));
      const deletedTitle = dialogState.board.title;
      closeDialog();
      setMutationNotice({
        tone: "success",
        message: `Board eliminado: ${deletedTitle}.`,
      });
    } catch (error) {
      const message = getDeleteBoardErrorMessage(error);
      setDialogErrorMessage(message);

      if (error instanceof ApiClientError && error.status === 404) {
        closeDialog();
        await loadBoards();
        setMutationNotice({ tone: "error", message });
      }
    } finally {
      setPendingBoardAction(null);
    }
  };

  const openRenameDialog = (board: BoardSummary) => {
    setDialogErrorMessage(null);
    setDialogState({ type: "rename", board, title: board.title });
  };

  const openDeleteDialog = (board: BoardSummary) => {
    setDialogErrorMessage(null);
    setDialogState({ type: "delete", board });
  };

  return (
    <section className="dashboard-home">
      <header className="dashboard-home-header">
        <div>
          <p className="board-kicker">Board Dashboard</p>
          <h2>Elige el tablero que necesitas y gestiona el catalogo sin salir del contexto.</h2>
          <p className="dashboard-home-copy">
            La home prioriza exploracion, estado y mantenimiento de boards con acciones contextuales
            y una accion principal clara.
          </p>
        </div>

        <div className="dashboard-home-meta" aria-label="Resumen del dashboard">
          <span>Boards visibles</span>
          <strong>{countFormatter.format(boardCount)}</strong>
          <span>Accede, renombra o elimina sin ruido permanente.</span>
        </div>
      </header>

      <div className="dashboard-actions-row">
        <button className="primary-button" onClick={() => setIsCreatePanelOpen((current) => !current)} type="button">
          {isCreatePanelOpen ? "Ocultar formulario" : "Crear board"}
        </button>
        <button className="secondary-button" onClick={() => void loadBoards()} type="button">
          Actualizar dashboard
        </button>
      </div>

      {isCreatePanelOpen || state.status === "empty" ? (
        <section className="section-card dashboard-create-panel" aria-labelledby="dashboard-create-heading">
          <div>
            <p className="board-kicker">Nuevo board</p>
            <h3 id="dashboard-create-heading">Agrega un espacio nuevo sin salir del dashboard.</h3>
          </div>

          <form onSubmit={handleCreateBoard}>
            <label className="field">
              <span className="field-label">Titulo</span>
              <input
                aria-label="Titulo del nuevo board"
                autoComplete="off"
                className="input-field"
                name="title"
                onChange={(event) => setNewBoardTitle(event.target.value)}
                placeholder="Por ejemplo: Delivery board…"
                value={newBoardTitle}
              />
            </label>
            <div className="dashboard-actions-row">
              <button className="primary-button" disabled={pendingBoardAction !== null} type="submit">
                {pendingBoardAction?.type === "create" ? "Creando…" : "Crear board"}
              </button>
              {state.status !== "empty" ? (
                <button className="tertiary-button" onClick={() => setIsCreatePanelOpen(false)} type="button">
                  Cancelar
                </button>
              ) : null}
            </div>
            {createErrorMessage === null ? null : (
              <p className="board-feedback board-feedback-error" role="alert">
                {createErrorMessage}
              </p>
            )}
          </form>
        </section>
      ) : null}

      {mutationNotice === null ? null : (
        <div
          aria-live={mutationNotice.tone === "success" ? "polite" : undefined}
          className={mutationNoticeClassName}
          role={mutationNotice.tone === "success" ? "status" : "alert"}
        >
          <p>{mutationNotice.message}</p>
        </div>
      )}

      {state.status === "loading" ? (
        <section className="status-panel dashboard-state" aria-live="polite">
          <h2>Cargando dashboard…</h2>
          <p>Consultando los tableros disponibles para que puedas retomar el trabajo.</p>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="status-panel status-panel-error dashboard-state" role="alert">
          <h2>Error al cargar boards</h2>
          <p>{state.message}</p>
          <div className="dashboard-state-actions">
            <button className="primary-button" onClick={() => void loadBoards()} type="button">
              Reintentar
            </button>
          </div>
        </section>
      ) : null}

      {state.status === "empty" ? (
        <section className="status-panel status-panel-warning dashboard-state">
          <h2>Todavia no hay boards</h2>
          <p>Crea el primer board desde este dashboard para empezar a organizar trabajo real.</p>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <div className="board-summary-list" role="list" aria-label="Boards disponibles">
          {state.boards.map((board) => {
            const isUpdating = pendingBoardAction?.type === "update" && pendingBoardAction.boardId === board.id;
            const isDeleting = pendingBoardAction?.type === "delete" && pendingBoardAction.boardId === board.id;

            return (
              <article className="board-summary-card" key={board.id} role="listitem">
                <Link className="board-summary-link" to={`/boards/${board.id}`}>
                  <div className="board-summary-copy">
                    <p className="board-summary-eyebrow">/{board.id}</p>
                    <h3 className="board-summary-title">{board.title}</h3>
                    <p className="board-summary-description">
                      Abre el tablero para editar columnas, tarjetas y orden desde el workspace.
                    </p>
                  </div>
                  <p className="board-summary-metrics" aria-label={formatBoardMetrics(board)}>
                    <span>{countFormatter.format(board.columnCount)} columnas</span>
                    <span>{countFormatter.format(board.cardCount)} tarjetas</span>
                  </p>
                </Link>

                <div className="dashboard-board-actions" aria-label={`Acciones para ${board.title}`}>
                  <Link className="route-link" to={`/boards/${board.id}`}>
                    Abrir board
                  </Link>
                  <ActionMenu label={`Acciones secundarias para ${board.title}`}>
                    <button
                      className="board-action-button"
                      disabled={pendingBoardAction !== null}
                      onClick={() => openRenameDialog(board)}
                      role="menuitem"
                      type="button"
                    >
                      {isUpdating ? "Guardando…" : "Renombrar"}
                    </button>
                    <button
                      className="board-action-button board-action-button-danger"
                      disabled={pendingBoardAction !== null}
                      onClick={() => openDeleteDialog(board)}
                      role="menuitem"
                      type="button"
                    >
                      {isDeleting ? "Eliminando…" : "Eliminar"}
                    </button>
                  </ActionMenu>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <Dialog
        description="Actualiza el nombre visible del board sin salir del dashboard."
        onClose={closeDialog}
        open={dialogState?.type === "rename"}
        title={dialogState?.type === "rename" ? `Renombrar ${dialogState.board.title}` : "Renombrar board"}
      >
        <form className="board-dialog-form" onSubmit={handleRenameBoard}>
          <label className="field">
            <span className="field-label">Titulo</span>
            <input
              aria-label="Titulo del board"
              autoComplete="off"
              className="input-field"
              name="board-title"
              onChange={(event) =>
                setDialogState((current) =>
                  current?.type === "rename" ? { ...current, title: event.target.value } : current,
                )
              }
              value={dialogState?.type === "rename" ? dialogState.title : ""}
            />
          </label>
          {dialogErrorMessage === null ? null : (
            <p className="board-feedback board-feedback-error" role="alert">
              {dialogErrorMessage}
            </p>
          )}
          <div className="dialog-actions">
            <button className="secondary-button" onClick={closeDialog} type="button">
              Cancelar
            </button>
            <button
              className="primary-button"
              disabled={dialogState?.type === "rename" && pendingBoardAction?.type === "update"}
              type="submit"
            >
              {dialogState?.type === "rename" && pendingBoardAction?.type === "update" ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        description="Esta accion elimina el board y lo quita del dashboard actual."
        onClose={closeDialog}
        open={dialogState?.type === "delete"}
        title={dialogState?.type === "delete" ? `Eliminar ${dialogState.board.title}` : "Eliminar board"}
      >
        <div className="board-dialog-form">
          <p className="helper-text">Confirma la eliminacion solo si ya no necesitas este tablero.</p>
          {dialogErrorMessage === null ? null : (
            <p className="board-feedback board-feedback-error" role="alert">
              {dialogErrorMessage}
            </p>
          )}
          <div className="dialog-actions">
            <button className="secondary-button" onClick={closeDialog} type="button">
              Cancelar
            </button>
            <button
              className="board-action-button board-action-button-danger"
              disabled={dialogState?.type === "delete" && pendingBoardAction?.type === "delete"}
              onClick={() => void handleDeleteBoard()}
              type="button"
            >
              {dialogState?.type === "delete" && pendingBoardAction?.type === "delete" ? "Eliminando…" : "Eliminar board"}
            </button>
          </div>
        </div>
      </Dialog>
    </section>
  );
};
