'use server';

import { getEndpoint } from '@/utils';
import type { Status } from '@/types';

interface UpdatePlaceState {
  status?: Status;
  error?: { message: string; };
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

interface DummyActionState {
  map?: {};
  error?: { message: string; };
}

export async function dummyAction(
  prevState: DummyActionState | null,
  formData: FormData
): Promise<DummyActionState> {
  const file = formData.get('file');
  if (!(file instanceof File)) return { error: { message: 'ファイルが見つかりません' } };

  console.debug("name:", file.name);
  console.debug("size:", file.size);
  console.debug("type:", file.type);

  // 中身を読みたいときは ArrayBuffer/Text で
  const buffer = Buffer.from(await file.arrayBuffer());
  console.debug("bytes:", buffer.length);

  // KMLならテキストとして読む
  const text = await file.text();
  console.debug("content:", text.slice(0, 200)); // 先頭200文字だけ表示

  await new Promise((r) => setTimeout(r, 2000));
  return { error: { message: "不明なエラー" } };

}
