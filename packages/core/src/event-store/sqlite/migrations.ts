import { Kysely, Migration, MigrationProvider } from "kysely";

const migrations: Record<string, Migration> = {
  ["2023_05_15_0_initial"]: {
    async up(db: Kysely<any>) {
      await db.schema
        .createTable("blocks")
        .addColumn("baseFeePerGas", "blob") // BigInt
        .addColumn("chainId", "integer", (col) => col.notNull())
        .addColumn("difficulty", "blob", (col) => col.notNull()) // BigInt
        .addColumn("extraData", "text", (col) => col.notNull())
        .addColumn("finalized", "integer", (col) => col.notNull()) // Boolean (0 or 1).
        .addColumn("gasLimit", "blob", (col) => col.notNull()) // BigInt
        .addColumn("gasUsed", "blob", (col) => col.notNull()) // BigInt
        .addColumn("hash", "text", (col) => col.notNull().primaryKey())
        .addColumn("logsBloom", "text", (col) => col.notNull())
        .addColumn("miner", "text", (col) => col.notNull())
        .addColumn("mixHash", "text", (col) => col.notNull())
        .addColumn("nonce", "text", (col) => col.notNull())
        .addColumn("number", "blob", (col) => col.notNull()) // BigInt
        .addColumn("parentHash", "text", (col) => col.notNull())
        .addColumn("receiptsRoot", "text", (col) => col.notNull())
        .addColumn("sha3Uncles", "text", (col) => col.notNull())
        .addColumn("size", "blob", (col) => col.notNull()) // BigInt
        .addColumn("stateRoot", "text", (col) => col.notNull())
        .addColumn("timestamp", "blob", (col) => col.notNull()) // BigInt
        .addColumn("totalDifficulty", "blob", (col) => col.notNull()) // BigInt
        .addColumn("transactionsRoot", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("transactions")
        .addColumn("accessList", "text")
        .addColumn("blockHash", "text", (col) => col.notNull())
        .addColumn("blockNumber", "blob", (col) => col.notNull()) // BigInt
        .addColumn("chainId", "integer", (col) => col.notNull())
        .addColumn("finalized", "integer", (col) => col.notNull()) // Boolean (0 or 1).
        .addColumn("from", "text", (col) => col.notNull())
        .addColumn("gas", "blob", (col) => col.notNull()) // BigInt
        .addColumn("gasPrice", "blob") // BigInt
        .addColumn("hash", "text", (col) => col.notNull().primaryKey())
        .addColumn("input", "text", (col) => col.notNull())
        .addColumn("maxFeePerGas", "blob") // BigInt
        .addColumn("maxPriorityFeePerGas", "blob") // BigInt
        .addColumn("nonce", "integer", (col) => col.notNull())
        .addColumn("r", "text", (col) => col.notNull())
        .addColumn("s", "text", (col) => col.notNull())
        .addColumn("to", "text")
        .addColumn("transactionIndex", "integer", (col) => col.notNull())
        .addColumn("type", "text", (col) => col.notNull())
        .addColumn("value", "blob", (col) => col.notNull()) // BigInt
        .addColumn("v", "blob", (col) => col.notNull()) // BigInt
        .execute();

      await db.schema
        .createTable("logs")
        .addColumn("address", "text", (col) => col.notNull())
        .addColumn("blockHash", "text", (col) => col.notNull())
        .addColumn("blockNumber", "blob", (col) => col.notNull()) // BigInt
        .addColumn("chainId", "integer", (col) => col.notNull())
        .addColumn("data", "text", (col) => col.notNull())
        .addColumn("finalized", "integer", (col) => col.notNull()) // Boolean (0 or 1).
        .addColumn("id", "text", (col) => col.notNull().primaryKey())
        .addColumn("logIndex", "integer", (col) => col.notNull())
        .addColumn("topic0", "text")
        .addColumn("topic1", "text")
        .addColumn("topic2", "text")
        .addColumn("topic3", "text")
        .addColumn("transactionHash", "text", (col) => col.notNull())
        .addColumn("transactionIndex", "integer", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("contractReadResults")
        .addColumn("address", "text", (col) => col.notNull())
        .addColumn("blockNumber", "blob", (col) => col.notNull()) // BigInt
        .addColumn("chainId", "integer", (col) => col.notNull())
        .addColumn("data", "text", (col) => col.notNull())
        .addColumn("finalized", "integer", (col) => col.notNull()) // Boolean (0 or 1).
        .addColumn("result", "text", (col) => col.notNull())
        .addPrimaryKeyConstraint("contractReadResultPrimaryKey", [
          "chainId",
          "blockNumber",
          "address",
          "data",
        ])
        .execute();

      await db.schema
        .createTable("logFilterCachedRanges")
        .addColumn("endBlock", "blob", (col) => col.notNull()) // BigInt
        .addColumn("endBlockTimestamp", "blob", (col) => col.notNull()) // BigInt
        .addColumn("filterKey", "text", (col) => col.notNull())
        // The `id` column should not be included in INSERT statements.
        // This column uses SQLite's ROWID() function (simple autoincrement).
        .addColumn("id", "integer", (col) => col.notNull().primaryKey())
        .addColumn("startBlock", "blob", (col) => col.notNull()) // BigInt
        .execute();
    },
    async down(db: Kysely<any>) {
      await db.schema.dropTable("blocks").execute();
      await db.schema.dropTable("logs").execute();
      await db.schema.dropTable("transactions").execute();
      await db.schema.dropTable("contractReadResults").execute();
      await db.schema.dropTable("logFilterCachedRanges").execute();
    },
  },
};

class StaticMigrationProvider implements MigrationProvider {
  async getMigrations() {
    return migrations;
  }
}

export const migrationProvider = new StaticMigrationProvider();
