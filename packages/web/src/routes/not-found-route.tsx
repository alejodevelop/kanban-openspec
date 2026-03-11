import { Link } from "react-router-dom";

export const NotFoundRoute = () => {
  return (
    <section className="route-card">
      <div className="route-copy">
        <h2>Ruta no encontrada</h2>
        <p>La shell ya maneja navegacion base y puede crecer sin rehacer el bootstrap.</p>
      </div>

      <Link className="route-link" to="/">
        Volver al inicio
      </Link>
    </section>
  );
};
