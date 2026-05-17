import { type Response } from "express";
import { type ZodType } from "zod";

export function validate<T>(schema: ZodType<T>, body: unknown, res: Response): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return null;
  }
  return result.data;
}

export function parseIntParam(param: string | string[] | undefined, res: Response): number | null {
  const raw = Array.isArray(param) ? param[0] : param;
  const id = parseInt(raw as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID." });
    return null;
  }
  return id;
}
