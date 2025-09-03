'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';

import { updatePlace } from '@/app/actions';
import type { Place, Status } from '@/app/types';

export default function PlacePopup(
  {
    place,
    statuses,
    onStatusChange
  }: {
    place: Place,
    statuses: Status[],
    onStatusChange?: (status: Status) => void;
  }
) {
  const statusSelectRef = useRef<HTMLSelectElement>(null);
  const [statusIndex, setStatusIndex] = useState(place.status.index);

  const [state, action, pending] = useActionState(updatePlace, null);
  useEffect(() => {
    if (state?.status) {
      setStatusIndex(state.status.index);
      onStatusChange?.(state.status);
      {/*
        - FIXME [Form action 実行後に <select> 値がリセットされてしまう問題](https://github.com/facebook/react/issues/30580) がある
        - React 19 のバグっぽい
        - 次の処理により回避している
      */}
      for (const option of statusSelectRef.current!.options) {
        option.selected = option.value === state.status.index.toString();
      }
    }
  }, [state]);

  return (
    <div className="w-72 py-2">
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <p className="!m-0 text-sm font-medium">{place.name}</p>
      </div>

      <form action={action} className="p-3 space-y-3">
        <input type="hidden" name="map" value={place.mapId} />
        <input type="hidden" name="place" value={place.localId} />

        {/* Place 基本情報 */}
        <dl className="text-sm text-gray-700 space-y-1">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-gray-500">ID</dt>
            <dd className="font-medium">{place.localId}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-gray-500">住所</dt>
            <dd className="font-medium break-words">{place.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-gray-500">緯度</dt>
            <dd className="font-mono">{place.coordinates[0].latitude}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-gray-500">経度</dt>
            <dd className="font-mono">{place.coordinates[0].longitude}</dd>
          </div>
        </dl>

        <fieldset disabled={pending}>
          {/* ステータス選択 */}
          <label className="block text-sm font-medium text-gray-700">
            ステータス
            <select
              name="status"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
              value={statusIndex}
              onChange={x => setStatusIndex(Number(x.target.value))}
              ref={statusSelectRef}
              required
            >
              {statuses.map(x => <option key={x.index} value={x.index}>{x.name}</option>)}
            </select>
          </label>
        </fieldset>

        {/* 送信ボタン */}
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          disabled={pending}
        >
          {'送信'}
        </button>

        {/* 送信結果 */}
        {state?.error?.message && <p className="text-red-500 !m-0">{state?.error?.message}</p>}
      </form>
    </div>
  );
}
