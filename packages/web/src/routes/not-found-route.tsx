import { Link } from "react-router-dom";

export const NotFoundRoute = () => {
  return (
    <section className="status-panel status-panel-warning route-card">
      <div className="route-copy">
        <p className="board-kicker">Ruta invalida</p>
        <h2>Esta vista no existe.</h2>
        <p>Vuelve al dashboard para abrir un board valido o crear uno nuevo.</p>
      </div>

      <Link className="primary-button route-link" to="/">
        Volver al dashboard
      </Link>
    </section>
  );
};
