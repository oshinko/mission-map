import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import * as schema from '@/db/schema';

console.debug('@/db/index');  // TODO 後で削除

export const db = drizzle(process.env.DATABASE_URL!, { schema });

export async function tryInitOrUpdateDb() {
  // await migrate(db, { migrationsFolder: './drizzle' });
}
