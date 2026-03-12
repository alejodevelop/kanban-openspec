import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";

vi.mock("./routes/app-routes", () => ({
  AppRoutes: () => <section><h2>Dashboard test double</h2></section>,
}));

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

    expect(screen.getByRole("heading", { name: /organiza boards con una experiencia mas clara/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /workspace kanban para equipos pequenos/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /dashboard test double/i })).toBeTruthy();
    expect(screen.getByText("http://localhost:3001")).toBeTruthy();
  });
});
