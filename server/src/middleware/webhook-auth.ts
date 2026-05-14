import { type Request, type Response, type NextFunction } from "express";
import { timingSafeEqual } from "crypto";

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INBOUND_WEBHOOK_TOKEN;
  if (!expected) {
    res.status(500).json({ error: "Webhook not configured." });
    return;
  }
  const provided = (req.headers["x-webhook-secret"] as string | undefined) ?? (req.query.token as string | undefined);
  if (!provided) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  try {
    const match = timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!match) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  next();
}
