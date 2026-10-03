import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { serverConfig } from "../config.js";

export type WatermarkJob = {
  mediaId: string;
};

let connection: Redis | null = null;
let watermarkQueue: Queue<WatermarkJob> | null = null;

export function getRedis(): Redis {
  if (!connection) {
    connection = new Redis(serverConfig.redisUrl, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getWatermarkQueue(): Queue<WatermarkJob> {
  if (!watermarkQueue) {
    watermarkQueue = new Queue<WatermarkJob>("watermark", {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    });
  }
  return watermarkQueue;
}

export async function enqueueWatermark(mediaId: string): Promise<void> {
  await getWatermarkQueue().add("process", { mediaId });
}

export function createWatermarkWorker(
  processor: (job: Job<WatermarkJob>) => Promise<void>,
): Worker<WatermarkJob> {
  return new Worker<WatermarkJob>("watermark", processor, {
    connection: getRedis(),
  });
}

export async function closeJobInfrastructure(): Promise<void> {
  if (watermarkQueue) {
    await watermarkQueue.close();
    watermarkQueue = null;
  }
  if (connection) {
    connection.disconnect();
    connection = null;
  }
}
