import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import  "dotenv/config"

const connectionString = process.env.DATABASE_URL || "";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

// Set timezone for the session
(async () => {
  await client`SET TIME ZONE 'Asia/Karachi'`;
})();

export const db = drizzle(client);
