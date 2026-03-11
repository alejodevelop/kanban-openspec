import type { Server } from "node:http";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAppMock: vi.fn(),
  listenMock: vi.fn(),
  onMock: vi.fn(),
}));

vi.mock("./app.ts", () => ({
  createApp: mocks.createAppMock,
}));

import { startServer } from "./server.ts";

const TEST_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/kanban";

describe("server bootstrap", () => {
  beforeEach(() => {
    mocks.createAppMock.mockReset();
    mocks.listenMock.mockReset();
    mocks.onMock.mockReset();
  });

  it("starts the HTTP runtime on the configured port", async () => {
    const fakeServer = {
      on: mocks.onMock,
    } as unknown as Server;

    mocks.listenMock.mockImplementation((port: number, callback: () => void) => {
      callback();
      return fakeServer;
    });
    mocks.createAppMock.mockReturnValue({
      listen: mocks.listenMock,
    });

    const server = await startServer({
      env: {
        port: 4310,
        databaseUrl: TEST_DATABASE_URL,
      },
      checkDatabase: async () => undefined,
    });

    expect(server).toBe(fakeServer);
    expect(mocks.createAppMock).toHaveBeenCalledWith({
      checkDatabase: expect.any(Function),
    });
    expect(mocks.listenMock).toHaveBeenCalledWith(4310, expect.any(Function));
    expect(mocks.onMock).toHaveBeenCalledWith("error", expect.any(Function));
  });
});
