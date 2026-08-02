import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for optimal performance
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection pool configuration for Neon
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle({ client: pool, schema });

// Health check function for database
export async function checkDatabaseHealth() {
  try {
    const result = await db.execute('SELECT 1 as health');
    return { healthy: true, result };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error: (error as Error).message };
  }
}

// Connection info
export function getDatabaseInfo() {
  const url = new URL(process.env.DATABASE_URL!);
  return {
    host: url.hostname,
    database: url.pathname.slice(1),
    port: url.port || '5432',
    ssl: url.searchParams.get('sslmode') || 'require'
  };
}