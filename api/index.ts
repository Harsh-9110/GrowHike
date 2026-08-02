import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { registerRoutes } from "../server/routes";

let appPromise: Promise<express.Express> | undefined;

async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("API error:", err);
  });

  return app;
}

async function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }

  return appPromise;
}

export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  return app(req, res);
}
