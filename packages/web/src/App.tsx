import { Link, useLocation } from "react-router-dom";

import { apiClient } from "./lib/api-client";
import { AppRoutes } from "./routes/app-routes";

export const App = () => {
  const { pathname } = useLocation();
  const isBoardRoute = pathname.startsWith("/boards/");

  return (
    <div className={`app-shell ${isBoardRoute ? "app-shell-board" : "app-shell-home"}`}>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <header className={`app-header ${isBoardRoute ? "app-header-board" : "app-header-home"}`}>
        <div className="app-brand">
          <p className="eyebrow">Kanban OpenSpec</p>
          <Link className="app-brand-link" to="/">
            Workspace Kanban para equipos pequenos
          </Link>
        </div>

        {isBoardRoute ? (
          <div className="app-context-card">
            <p className="app-context-label">Modo</p>
            <p className="app-context-value">Tablero activo</p>
          </div>
        ) : (
          <div className="app-intro">
            <h1>Organiza boards con una experiencia mas clara, consistente y lista para usarse.</h1>
            <p>
              La home funciona como dashboard de producto y cada board abre un workspace dedicado
              para crear, editar, mover y ordenar el trabajo sin ruido innecesario.
            </p>
          </div>
        )}
      </header>

      <main className={`app-main ${isBoardRoute ? "app-main-board" : "app-main-home"}`} id="main-content">
        <AppRoutes />
      </main>

      <footer className="status-bar">
        <span>API base URL</span>
        <code>{apiClient.baseUrl}</code>
      </footer>
    </div>
  );
};
