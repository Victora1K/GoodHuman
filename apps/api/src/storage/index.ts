import { LocalObjectStorage } from "./local.js";
import type { ObjectStorage } from "./types.js";
import { serverConfig } from "../config.js";

let storage: LocalObjectStorage | null = null;

export function getStorage(): LocalObjectStorage {
  if (!storage) {
    if (serverConfig.storageDriver === "s3") {
      // S3 adapter deferred until credentials are present; local works for Phase 1.
      // Reason documented in README: local filesystem adapter for first ship.
      storage = new LocalObjectStorage();
    } else {
      storage = new LocalObjectStorage();
    }
  }
  return storage;
}

export type { ObjectStorage };
