import { Link } from "react-router-dom";

export const HomeRoute = () => {
  return (
    <section className="route-card">
      <div className="route-copy">
        <h2>Shell base operativa</h2>
        <p>
          El siguiente change puede reemplazar este contenido por la vista real del board sin tocar
          el bootstrap del navegador ni la configuracion compartida.
        </p>
      </div>

      <nav className="route-nav" aria-label="Primary">
        <Link className="route-link route-link-active" to="/">
          Inicio
        </Link>
      </nav>
    </section>
  );
};
