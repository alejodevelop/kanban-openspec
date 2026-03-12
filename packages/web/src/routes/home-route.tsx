import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { Link } from "react-router-dom";

import { ApiClientError } from "../lib/api-client";
import { boardApi, type BoardSummary } from "../features/boards/board-api";

type HomeRouteState =
  | { status: "loading" }
  | { status: "ready"; boards: BoardSummary[] }
  | { status: "empty" }
  | { status: "error"; message: string };

const getDashboardErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status >= 500) {
    return "No pudimos cargar los tableros. Verifica la API e intenta de nuevo.";
  }

  return "No pudimos cargar los tableros disponibles. Intenta de nuevo en unos segundos.";
};

export const HomeRoute = () => {
  const [state, setState] = useState<HomeRouteState>({ status: "loading" });

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

  if (state.status === "loading") {
    return (
      <section className="dashboard-state" aria-live="polite">
        <h2>Cargando dashboard...</h2>
        <p>Consultando los tableros disponibles para entrar al espacio de trabajo.</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="dashboard-state dashboard-state-error" role="alert">
        <h2>Error al cargar boards</h2>
        <p>{state.message}</p>
      </section>
    );
  }

  if (state.status === "empty") {
    return (
      <section className="dashboard-state dashboard-state-empty">
        <h2>Todavia no hay boards</h2>
        <p>Crea o carga datos de prueba en la API para usar este dashboard como punto de entrada.</p>
      </section>
    );
  }

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

      <div className="board-summary-list" role="list" aria-label="Boards disponibles">
        {state.boards.map((board) => (
          <article className="board-summary-card" key={board.id} role="listitem">
            <div className="board-summary-copy">
              <p className="board-summary-eyebrow">/{board.id}</p>
              <h3>{board.title}</h3>
              <p className="board-summary-metrics">
                <span>{board.columnCount} columnas</span>
                <span>{board.cardCount} tarjetas</span>
              </p>
            </div>

            <Link className="route-link" to={`/boards/${board.id}`}>
              Abrir board
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};
