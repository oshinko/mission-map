import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { places } from '@/db/schema';

export async function PUT(req: Request, { params }: { params: Promise<{ map: string; place: string; }> }) {
  const { map: mapId, place: localId } = await params;

  const statusIndex = await req.json();

  await db.update(places)
    .set({ statusIndex })
    .where(and(eq(places.mapId, mapId), eq(places.localId, localId)));

  return new Response(
    JSON.stringify(statusIndex),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
