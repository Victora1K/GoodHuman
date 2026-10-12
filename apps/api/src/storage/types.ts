export type PutObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
  /** When true, object may be served via public CDN/path. Originals stay private. */
  isPublic?: boolean;
};

export interface ObjectStorage {
  putObject(input: PutObjectInput): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  /** Short-lived URL for private originals, or stable public URL for previews. */
  getSignedUrl(key: string, opts: { ttlSeconds: number; public?: boolean }): Promise<string>;
  publicUrl(key: string): string;
}
