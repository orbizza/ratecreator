import { Hono } from "hono";

export const healthRoute = new Hono();

healthRoute.get("/", (c) =>
  c.json({ status: "healthy", service: "ratecreator-workers" }),
);
