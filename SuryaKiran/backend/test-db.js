const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_tTdAYX7zh9wp@ep-winter-mountain-aipan2zq-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

const ddl = `
CREATE TABLE IF NOT EXISTS "ForecastUpload" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "inverter_id" TEXT,
  "csv_content" TEXT NOT NULL,
  "rows_count" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'csv',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForecastUpload_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ForecastUpload_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ForecastUpload_inverter_id_fkey" FOREIGN KEY ("inverter_id") REFERENCES "Inverters"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ForecastPoint" (
  "id" TEXT NOT NULL,
  "upload_id" TEXT,
  "inverter_id" TEXT NOT NULL,
  "minute_offset" INTEGER NOT NULL,
  "timestamp_iso" TEXT NOT NULL,
  "predicted_power_kw" DOUBLE PRECISION NOT NULL,
  "risk_score" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'pretrained',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForecastPoint_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ForecastPoint_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "ForecastUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ForecastPoint_inverter_id_fkey" FOREIGN KEY ("inverter_id") REFERENCES "Inverters"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ForecastPoint_inverter_id_minute_offset_idx" ON "ForecastPoint"("inverter_id", "minute_offset");
CREATE INDEX IF NOT EXISTS "ForecastPoint_inverter_id_created_at_idx" ON "ForecastPoint"("inverter_id", "created_at");

CREATE TABLE IF NOT EXISTS "ChatSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

async function applyDDL() {
    try {
        await client.connect();
        console.log("Applying DDL...");
        await client.query(ddl);
        console.log("DDL applied successfully!");

        // Check tables again just to be sure
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("Tables now present:", res.rows.map(r => r.table_name));
    } catch (err) {
        console.error("Error applying DDL:", err);
    } finally {
        await client.end();
    }
}

applyDDL();
