import { apiClient } from "./lib/api-client";
import { AppRoutes } from "./routes/app-routes";

export const App = () => {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Kanban OpenSpec</p>
        <h1>Frontend listo para conectar el tablero.</h1>
        <p className="hero-copy">
          Este bootstrap deja el navegador, el routing y el cliente HTTP preparados para los
          siguientes changes sin mezclar todavia logica de negocio.
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
