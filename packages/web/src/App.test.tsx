import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the base shell and shared API configuration", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /frontend listo para conectar el tablero/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /shell base operativa/i })).toBeTruthy();
    expect(screen.getByText("http://localhost:3001")).toBeTruthy();
  });
});
