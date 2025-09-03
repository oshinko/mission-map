import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { places } from '@/db/schema';

export async function PATCH(req: Request, { params }: { params: Promise<{ map: string; place: string; }> }) {
  const { map: mapId, place: localId } = await params;
  const { index: statusIndex } = await req.json() as { index: number };

  await db.update(places)
    .set({ statusIndex })
    .where(and(eq(places.mapId, mapId), eq(places.localId, localId)));

  const status = await db.query.statuses.findFirst({
    where: (statuses, { eq }) => eq(statuses.index, statusIndex)
  });

  return new Response(
    JSON.stringify(status),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
