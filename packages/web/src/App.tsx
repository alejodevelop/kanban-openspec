import { apiClient } from "./lib/api-client";
import { AppRoutes } from "./routes/app-routes";

export const App = () => {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Kanban OpenSpec</p>
        <h1>Tableros listos para explorar y abrir.</h1>
        <p className="hero-copy">
          La entrada principal muestra el catalogo de boards y conserva la vista detallada para
          seguir el flujo de trabajo completo.
        </p>
      </header>

      <main className="content-panel">
        <AppRoutes />
      </main>

      <footer className="status-bar">
        <span>API base URL</span>
        <code>{apiClient.baseUrl}</code>
      </footer>
    </div>
  );
};
