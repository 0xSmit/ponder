import { parentPort } from "node:worker_threads";
import {
  type Hex,
  decodeAbiParameters,
  decodeFunctionData,
  decodeFunctionResult,
} from "viem";
import type { Event, RawEvent } from "./events.js";
import type { Source } from "./source.js";

// Listen for messages
parentPort?.on("message", ({ chunk, sources }) => {
  const decodedEvents = processEvents(chunk, sources);
  parentPort?.postMessage(decodedEvents);
});

function processEvents(events: RawEvent[], sources: Source[]): Event[] {
  const decodedEvents: Event[] = [];

  for (const event of events) {
    const source = sources[event.sourceIndex]!;

    switch (source.type) {
      case "block": {
        decodedEvents.push({
          type: "block",
          chainId: event.chainId,
          checkpoint: event.checkpoint,
          name: `${source.name}:block`,
          event: {
            block: event.block,
          },
        });
        break;
      }
      case "contract": {
        switch (source.filter.type) {
          case "log": {
            try {
              if (
                !event.log?.topics[0] ||
                !source.abiEvents.bySelector[event.log.topics[0]]
              ) {
                throw new Error("Invalid log");
              }

              const { safeName, item } =
                source.abiEvents.bySelector[event.log.topics[0]]!;
              const args = decodeEventLog({
                abiItem: item,
                data: event.log.data,
                topics: event.log.topics,
              });

              decodedEvents.push({
                type: "log",
                chainId: event.chainId,
                checkpoint: event.checkpoint,
                name: `${source.name}:${safeName}`,
                event: {
                  name: safeName,
                  args,
                  log: event.log,
                  block: event.block,
                  transaction: event.transaction!,
                  transactionReceipt: event.transactionReceipt,
                },
              });
            } catch {
              continue;
            }
            break;
          }
          case "callTrace": {
            try {
              const selector = event
                .trace!.input.slice(0, 10)
                .toLowerCase() as Hex;
              if (!source.abiFunctions.bySelector[selector]) {
                throw new Error("Invalid trace");
              }

              const { safeName, item } =
                source.abiFunctions.bySelector[selector]!;
              const { args, functionName } = decodeFunctionData({
                abi: [item],
                data: event.trace!.input,
              });

              const result = decodeFunctionResult({
                abi: [item],
                data: event.trace!.output,
                functionName,
              });

              decodedEvents.push({
                type: "callTrace",
                chainId: event.chainId,
                checkpoint: event.checkpoint,
                name: `${source.name}.${safeName}`,
                event: {
                  args,
                  result,
                  trace: event.trace!,
                  block: event.block,
                  transaction: event.transaction!,
                  transactionReceipt: event.transactionReceipt,
                },
              });
            } catch {
              continue;
            }
            break;
          }
        }
        break;
      }
    }
  }

  return decodedEvents;
}

function decodeEventLog({
  abiItem,
  topics,
  data,
}: {
  abiItem: any;
  topics: [signature: Hex, ...args: Hex[]] | [];
  data: Hex;
}): any {
  const { inputs } = abiItem;
  const isUnnamed = inputs?.some((x: any) => !("name" in x && x.name));
  let args: any = isUnnamed ? [] : {};
  const [, ...argTopics] = topics;

  const indexedInputs = inputs.filter((x: any) => "indexed" in x && x.indexed);
  for (let i = 0; i < indexedInputs.length; i++) {
    const param = indexedInputs[i]!;
    const topic = argTopics[i];
    if (!topic) throw new Error("Missing topic");
    args[isUnnamed ? i : param.name || i] = decodeTopic({
      param,
      value: topic,
    });
  }

  const nonIndexedInputs = inputs.filter(
    (x: any) => !("indexed" in x && x.indexed),
  );
  if (nonIndexedInputs.length > 0) {
    if (data && data !== "0x") {
      const decodedData = decodeAbiParameters(nonIndexedInputs, data);
      if (decodedData) {
        if (isUnnamed) args = [...args, ...decodedData];
        else {
          for (let i = 0; i < nonIndexedInputs.length; i++) {
            args[nonIndexedInputs[i]!.name!] = decodedData[i];
          }
        }
      }
    }
  }

  return Object.values(args).length > 0 ? args : undefined;
}

function decodeTopic({ param, value }: { param: any; value: Hex }) {
  if (
    param.type === "string" ||
    param.type === "bytes" ||
    param.type === "tuple" ||
    param.type.match(/^(.*)\[(\d+)?\]$/)
  )
    return value;
  const decodedArg = decodeAbiParameters([param], value) || [];
  return decodedArg[0];
}
