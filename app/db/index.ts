import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import * as schema from '@/db/schema';

export const db = drizzle(process.env.DATABASE_URL!, { schema });

export async function tryInitOrUpdateDb() {
  // await migrate(db, { migrationsFolder: './drizzle' });
}
