import { PgBoss } from "pg-boss";

const START_TIMEOUT_MS = 30_000;
const STOP_TIMEOUT_MS = 30_000;

export const boss = new PgBoss(process.env.DATABASE_URL!);

export async function startQueue(): Promise<void> {
  await Promise.race([
    boss.start(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Queue start timed out after 30s")),
        START_TIMEOUT_MS,
      ),
    ),
  ]);
}

export async function stopQueue(): Promise<void> {
  await boss.stop({ graceful: true, timeout: STOP_TIMEOUT_MS });
}
