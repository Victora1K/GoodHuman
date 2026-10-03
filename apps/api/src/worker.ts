import { createWatermarkWorker } from "./jobs/queue.js";
import { processWatermarkJob } from "./jobs/watermark-processor.js";

const worker = createWatermarkWorker(processWatermarkJob);

worker.on("ready", () => {
  console.log("GoodHuman watermark worker ready");
});

worker.on("failed", (job, err) => {
  console.error("Watermark job failed", job?.id, err);
});
