import { cpus } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import type { Event, RawEvent } from "./events.ts";
import type { Source } from "./source.ts";

// Initialize workers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.join(__dirname, "../sync/eventDecoderWorker.js");

interface WorkerTask {
  resolve: (value: Event[]) => void;
  reject: (error: Error) => void;
}

interface WorkerMessage {
  chunk: RawEvent[];
  sources: Source[];
}

// Track active tasks for each worker
const workerTasks = new Map<Worker, WorkerTask>();

const workers = Array.from({ length: cpus().length }, () => {
  const worker = new Worker(workerPath);

  // Set up persistent message handlers
  worker.on("message", (result: Event[]) => {
    const task = workerTasks.get(worker);
    if (task) {
      task.resolve(result);
      workerTasks.delete(worker);
    }
  });

  worker.on("error", (error: Error) => {
    const task = workerTasks.get(worker);
    if (task) {
      task.reject(error);
      workerTasks.delete(worker);
    }
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });

  return worker;
});

/**
 * Executes tasks using the worker pool.
 * @param {WorkerMessage} message - The message containing the chunk and sources.
 * @returns {Promise<Event[]>} - A promise that resolves with the processed events.
 */
export async function execute(message: WorkerMessage): Promise<Event[]> {
  const { chunk, sources } = message;

  // Split work evenly among workers
  const chunkSize = Math.ceil(chunk.length / workers.length);
  const workerChunks = Array.from({ length: workers.length }, (_, i) =>
    chunk.slice(i * chunkSize, (i + 1) * chunkSize),
  ).filter((c) => c.length > 0);

  // Create a promise for each worker
  const workerPromises = workerChunks.map(
    (workerChunk, i) =>
      new Promise<Event[]>((resolve, reject) => {
        const worker = workers[i]!;

        // Store task callbacks
        workerTasks.set(worker, { resolve, reject });

        worker.postMessage({ chunk: workerChunk, sources });
      }),
  );

  // Wait for all workers to complete and combine results
  return Promise.all(workerPromises).then((results) => results.flat());
}

/**
 * Terminates all workers in the pool.
 * @returns {Promise<void[]>} - A promise that resolves when all workers are terminated.
 */
export function terminate(): Promise<void[]> {
  console.log("Terminating worker pool...");
  return Promise.all(
    workers.map((worker, i) => {
      console.log(`Terminating worker ${i}...`);
      workerTasks.delete(worker);
      return worker.terminate().then(() => {
        // Map the resolved number to void
      });
    }),
  );
}
