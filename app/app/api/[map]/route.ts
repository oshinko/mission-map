import { notFound } from 'next/navigation';

import { db } from '@/db';

export async function GET(_req: Request, { params }: { params: Promise<{ map: string }> }) {
  const { map: mapId } = await params;

  const map = await db.query.maps.findFirst({
    where: (maps, { eq }) => eq(maps.id, mapId),
    with: { places: { with: { coordinates: true, status: true } }, statuses: true }
  });

  if (!map) notFound();

  return new Response(
    JSON.stringify(map),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
