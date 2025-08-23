import { notFound } from 'next/navigation';

import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { deleteme } from '@/db/schema';

import type { Place } from '../../types';

const MOCK = {
  DATA: `
mapId,localId,type,name,address,latitude,longitude,geohash
11111111,0-1,point,1-1,花小金井南町二丁目７−３,35.72123204820576,139.5163833580136,
11111111,0-2,point,1-2,花小金井南町一丁目２３番,35.726749,139.511948,
`.trim(),

  parseCSV(csv: string): Place[] {
    const lines = csv.split(/\r?\n/);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = lines[i].split(',');
      rows.push({
        mapId: vals[0],
        localId: vals[1],
        type: vals[2],
        name: vals[3],
        address: vals[4],
        points: [
          {
            mapId: vals[0],
            placeLocalId: vals[1],
            index: 0,
            latitude: parseFloat(vals[5]),
            longitude: parseFloat(vals[6]),
            geohash: ''
          }
        ]
      } as Place);
    }
    return rows;
  }
};

const db = drizzle(process.env.DATABASE_URL!);

async function getBoards(mapId: string) {
  const [item] = await db
    .select()
    .from(deleteme)
    // .where(eq(objects.key, req.app.locals.key))
    .limit(1);
  return [item];
}

export async function GET(_req: Request) {
  const items = MOCK.parseCSV(MOCK.DATA);

  if (items.length === 0) notFound();

  return new Response(
    JSON.stringify(items),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
