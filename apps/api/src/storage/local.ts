import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "../config.js";
import type { ObjectStorage, PutObjectInput } from "./types.js";

export class LocalObjectStorage implements ObjectStorage {
  constructor(
    private readonly apiUrl = serverConfig.apiUrl,
    private readonly cdnPublicUrl = serverConfig.cdnPublicUrl,
    private readonly signingSecret = serverConfig.jwtSecret,
  ) {}

  private rootDir(): string {
    return path.resolve(process.env.STORAGE_LOCAL_ROOT ?? serverConfig.storageLocalRoot);
  }

  private resolve(key: string): string {
    const root = this.rootDir();
    const full = path.resolve(root, key);
    if (!full.startsWith(root)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async putObject(input: PutObjectInput): Promise<void> {
    const full = this.resolve(input.key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, input.body);
    if (input.isPublic) {
      // Marker file so public route can allow without auth.
      await writeFile(`${full}.public`, "1");
    }
  }

  async getObject(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async deleteObject(key: string): Promise<void> {
    const full = this.resolve(key);
    await unlink(full).catch(() => undefined);
    await unlink(`${full}.public`).catch(() => undefined);
  }

  publicUrl(key: string): string {
    return `${this.cdnPublicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async getSignedUrl(
    key: string,
    opts: { ttlSeconds: number; public?: boolean },
  ): Promise<string> {
    if (opts.public) {
      return this.publicUrl(key);
    }
    const exp = Math.floor(Date.now() / 1000) + opts.ttlSeconds;
    const sig = this.sign(key, exp);
    const q = new URLSearchParams({
      key,
      exp: String(exp),
      sig,
    });
    return `${this.apiUrl}/media/signed?${q.toString()}`;
  }

  sign(key: string, exp: number): string {
    return createHmac("sha256", this.signingSecret)
      .update(`${key}:${exp}`)
      .digest("hex");
  }

  verifySignature(key: string, exp: number, sig: string): boolean {
    if (exp < Math.floor(Date.now() / 1000)) return false;
    const expected = this.sign(key, exp);
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    } catch {
      return false;
    }
  }

  async isPublicMarker(key: string): Promise<boolean> {
    try {
      await readFile(`${this.resolve(key)}.public`);
      return true;
    } catch {
      return false;
    }
  }
}
