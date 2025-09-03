'use server';

import { getEndpoint } from '@/utils';
import type { Status } from '@/app/types';

interface UpdatePlaceState {
  status?: Status,
  error?: { message: string; }
}

export async function updatePlace(
  prevState: UpdatePlaceState | null,
  formData: FormData
): Promise<UpdatePlaceState> {
  console.debug('formData.keys():', [...formData.keys()]);
  console.debug('prevState:', prevState);

  const mapId = formData.get('map')?.toString();
  if (!mapId) return { error: { message: 'エラーです。' } };

  const placeLocalId = formData.get('place')?.toString();
  if (!placeLocalId) return { error: { message: 'エラーです。' } };

  const formDataStatus = formData.get('status');
  const statusIndex = typeof formDataStatus === 'string' ? Number(formDataStatus) : null;
  if (statusIndex === null || Number.isNaN(statusIndex)) return { error: { message: 'エラーです。' } };

  console.debug('statusIndex:', statusIndex);

  const endpoint = getEndpoint(`/api/${mapId}/${placeLocalId}/status`);
  const res = await fetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ index: statusIndex })
  });

  if (res.ok) return { status: await res.json() as Status };

  return { error: { message: await res.text() || res.statusText } };
};
