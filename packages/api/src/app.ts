import express from "express";

import { createHealthRouter, type HealthCheck } from "./routes/health.ts";

type AppOptions = {
  checkDatabase?: HealthCheck;
};

export const createApp = ({ checkDatabase }: AppOptions = {}) => {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use("/health", createHealthRouter({ checkDatabase }));

  return app;
};
