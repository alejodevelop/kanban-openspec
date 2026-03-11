import { Router, type RequestHandler } from "express";

export type HealthCheck = () => Promise<void>;

type HealthRouterOptions = {
  checkDatabase?: HealthCheck;
};

const defaultHealthCheck: HealthCheck = async () => undefined;

export const createHealthHandler = ({
  checkDatabase = defaultHealthCheck,
}: HealthRouterOptions = {}): RequestHandler => {
  return async (_request, response) => {
    const uptimeSeconds = Number(process.uptime().toFixed(3));

    try {
      await checkDatabase();
      response.status(200).json({
        status: "ok",
        service: "up",
        database: "up",
        uptimeSeconds,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error";

      response.status(503).json({
        status: "degraded",
        service: "up",
        database: "down",
        error: message,
        uptimeSeconds,
      });
    }
  };
};

export const createHealthRouter = ({ checkDatabase = defaultHealthCheck }: HealthRouterOptions = {}) => {
  const router = Router();

  router.get("/", createHealthHandler({ checkDatabase }));

  return router;
};
