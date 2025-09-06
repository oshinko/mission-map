'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { XMLParser } from 'fast-xml-parser';

import { dummyAction } from '@/app/actions';

// const parser = new XMLParser();
// const obj = parser.parse('<Placemark><name>地点1</name></Placemark>');
// console.log(obj.Placemark.name); // "地点1"

export default function Page() {
  const [state, action, pending] = useActionState(dummyAction, null);
  useEffect(() => {
    console.debug('state', state);
    if (state?.map) {
      // redirect to /[mapId]
    } else if (state?.error) {
      // ...
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <form action={action} className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <fieldset disabled={pending} className="flex flex-col gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              マップファイルを選択
            </span>
            <input
              type="file"
              name="file"
              accept=".kml, .kmz, .geojson, .json, .yaml, .yml"
              multiple
              className="
                mt-2 block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-[#0078a8] file:text-white
                hover:file:bg-[#006890]
                cursor-pointer
                disabled:cursor-not-allowed
                disabled:opacity-50
                disabled:hover:file:bg-[#0078a8]
              "
            />
          </label>

          <div
            id="map-files-help"
            role="note"
            className="mt-2 rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700 leading-relaxed"
          >
            <p className="font-medium mb-1">マップファイルとは？</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <span className="font-medium">形状ファイル（必須）</span>:
                <code className="mx-1">.kml</code>
                <code className="mx-1">.kmz</code>
                <code className="mx-1">.geojson</code>
              </li>
              <li>
                <span className="font-medium">メタデータファイル（任意）</span>:
                <code className="mx-1">.yaml</code>
                <code className="mx-1">.yml</code>
                <code className="mx-1">.json</code>
              </li>
            </ul>
            <p className="mt-2">
              形状ファイルだけでもアップロードできます。必要に応じて、形状ファイルとメタデータファイル
              <span className="whitespace-nowrap">（合計 1〜2 ファイル）</span>を同時に選択できます。
            </p>
            <p className="mt-1 text-gray-600">
              例）<code className="mx-1">map.kml</code> だけ、または
              <code className="mx-1">map.kml</code> と <code className="mx-1">map.yaml</code>
            </p>
          </div>

          <button
            type="submit"
            className="
              w-full bg-[#0078a8] text-white py-2 rounded-md font-medium
              hover:bg-[#006890] transition
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0078a8]
            "
          >
            新規作成
          </button>
        </fieldset>
      </form>
    </div>
  );
}
