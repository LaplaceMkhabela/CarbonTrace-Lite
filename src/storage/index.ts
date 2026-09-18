import { JsonFileRepository, jsonFileRepository } from "./json-file";
import { SqliteRepository, sqliteRepository } from "./sqlite-repository";
import type { Repository } from "./types";

let singleton: Repository | null = null;

/** Builds (or returns) the shared repository instance for the process. */
export function getRepository(): Repository {
  if (!singleton) {
    const mode = (process.env.STORAGE ?? "sqlite").toLowerCase();
    if (mode === "json") singleton = jsonFileRepository;
    else if (mode === "sqlite") singleton = sqliteRepository;
    else singleton = new SqliteRepository();
  }
  return singleton;
}

export { JsonFileRepository, SqliteRepository };