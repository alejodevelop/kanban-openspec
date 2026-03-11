import type { Response } from "express";

import { describe, expect, it, vi } from "vitest";

import { createHealthHandler } from "./health.ts";

const createMockResponse = () => {
  const response = {} as Response;
  const status = vi.fn().mockReturnValue(response);
  const json = vi.fn().mockReturnValue(response);

  Object.assign(response, {
    status,
    json,
  });

  return {
    response,
    status,
    json,
  };
};

describe("health route handler", () => {
  it("reports healthy status when PostgreSQL is available", async () => {
    const { response, status, json } = createMockResponse();
    const handler = createHealthHandler({
      checkDatabase: async () => undefined,
    });

    await handler({} as never, response, vi.fn());

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        service: "up",
        database: "up",
      }),
    );
  });

  it("reports degraded status when PostgreSQL is unavailable", async () => {
    const { response, status, json } = createMockResponse();
    const handler = createHealthHandler({
      checkDatabase: async () => {
        throw new Error("database unavailable");
      },
    });

    await handler({} as never, response, vi.fn());

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "degraded",
        service: "up",
        database: "down",
        error: "database unavailable",
      }),
    );
  });
});
