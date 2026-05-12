import { execSync } from "child_process";
import path from "path";

const serverDir = path.resolve(__dirname, "../server");
const bun = "~/.bun/bin/bun";

export default async function globalSetup() {
  // Reset test DB schema and wipe all data
  execSync(`${bun} run node_modules/prisma/build/index.js db push --force-reset`, {
    cwd: serverDir,
    env: { ...process.env },
    stdio: "inherit",
  });

  // Seed test admin user
  execSync(`${bun} run src/seed.ts`, {
    cwd: serverDir,
    env: { ...process.env },
    stdio: "inherit",
  });
}
