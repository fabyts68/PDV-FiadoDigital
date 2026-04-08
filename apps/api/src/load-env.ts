import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const envPath = join(dirname(fileURLToPath(import.meta.url)), "../../../.env");

if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const [name, ...rest] = trimmed.split("=");
    if (!name || rest.length === 0) {
      continue;
    }

    const rawValue = rest.join("=").trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}
