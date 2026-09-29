import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

export async function initializeDatabase() {
  console.log('Initializing database schema...');

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}
