'use server';

import YAML from 'yaml'
import { XMLParser } from 'fast-xml-parser';

import { createMapId, getEndpoint } from '@/utils';
import { db } from '@/db';
import { maps, coordinates, places, statuses } from '@/db/schema';
import { mapAge } from '@/consts';
import type { Map, Place, Status } from '@/types';

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
}

class MapFile {
  meta: Meta;
  shape: KML;

  private constructor(meta: Meta, shape: KML) {
    this.meta = meta;
    this.shape = shape;
  }

  static async from(source: { meta: File; shape: File; }) {
    const meta = parseMeta(await source.meta.text());

    let kml: KML | undefined;
    try {
      kml = parseKML(await source.shape.bytes());
    } catch (e) {
      return new Error('KML のパースに失敗しました。', { cause: e });
    }

    return new this(meta, kml);
  }

  extractMapFromKML(kml: KML): Map {
    const mapId = createMapId();
    const mapExpiresAt = new Date(Date.now() + mapAge);

    let mapName: string | undefined;
    if (kml.Document.name) mapName = kml.Document.name;

    const placemarks = [];

    if (kml.Document.Folder && kml.Document.Folder.length > 0) {
      const folder = kml.Document.Folder[0];
      if (!mapName) mapName = folder.name;
      if (folder.Placemark) placemarks.push(...folder.Placemark);
    }

    if (!mapName) throw new Error('地図名が取得できませんでした。');

    if (kml.Document.Placemark) placemarks.push(...kml.Document.Placemark);

    const places: Place[] = [];
    for (const placemark of placemarks) {
      if (!placemark.name) throw new Error('場所名が取得できませんでした。');
      if (!placemark.Point?.coordinates) throw new Error('場所の位置が取得できませんでした。');
      const coodinates = (placemark.Point.coordinates as string).split(',');
      const [longitude, latitude] = coodinates.map((x: string) => Number(x));
      const extendedData =
        placemark.ExtendedData.Data.reduce((acc: any, y: any) => {
          if (y['@_name'] && typeof y['@_name'] === 'string')
            acc[y['@_name'].toLowerCase()] = y.value;
          return acc;
        }, {});
      if (!extendedData.id) throw new Error('場所 ID が取得できませんでした。');
      const localId = extendedData.id;
      const type = 'point';
      const name = placemark.name;
      const address = extendedData.address;
      const statusIndex = 0;
      const status = this.meta.statuses[statusIndex];
      places.push({
        mapId,
        localId,
        type,
        name,
        address,
        statusIndex,
        status,
        coordinates: [
          { latitude, longitude }
        ]
      });
    }

    return {
      id: mapId,
      name: mapName,
      expiresAt: mapExpiresAt,
      places,
      statuses: []
    };
  }

  extractMap(): Map {
    if (this.shape.$type === 'kml')
      return this.extractMapFromKML(this.shape);
    throw new Error('Not implemented');
  }
}

interface KML {
  $type: 'kml';
  Document: {
    name?: string;
    Folder?: any[];
    Placemark?: any[];
  };
}

function parseKML(data: string | Buffer | ArrayBuffer | Uint8Array<ArrayBuffer>): KML {
  const strOrBuf = data instanceof ArrayBuffer ?
    Buffer.from(data) :
    data instanceof Uint8Array ?
      Buffer.from(data) :
      data;
  let xml;
  try {
    xml = new XMLParser({ ignoreAttributes: false }).parse(strOrBuf);
  } catch (e) {
    console.error(e);
    throw e;  // FIXME kmz 未実装
  }
  const kml = xml.kml ?? xml;
  const doc = kml.Document ?? kml;
  if (!doc.Folder && !doc.Placemark)
    throw new Error('<Folder> または <Placemark> タグがありません');
  if (doc.Folder) {
    doc.Folder = Array.isArray(doc.Folder) ? doc.Folder : [doc.Folder];
    for (const folder of doc.Folder) {
      if (folder.Placemark) {
        folder.Placemark = Array.isArray(folder.Placemark) ?
          folder.Placemark :
          [folder.Placemark];
      }
    }
  }
  if (doc.Placemark) {
    doc.Placemark = Array.isArray(doc.Placemark) ?
      doc.Placemark :
      [doc.Placemark];
  }
  return { $type: 'kml', Document: doc };
}

interface Meta {
  statuses: Status[];
  expiresAt: Date;
}

function parseMeta(text: string): Meta {
  const yaml = YAML.parse(text);
  if (yaml.statuses === undefined) throw new Error();
  if (!Array.isArray(yaml.statuses)) throw new TypeError();
  const statuses: Status[] = (yaml.statuses as any[])
    .map(({ name, color }, index) => {
      if (!name || typeof name !== 'string') throw new Error();
      if (!color || typeof color !== 'string') throw new Error();
      return {
        index,
        name: name as string,
        color: color as string,
      };
    });
  if (yaml.expiresAt === undefined) throw new Error();
  if (typeof yaml.expiresAt !== 'string') throw new TypeError();
  const expiresAt = new Date(yaml.expiresAt);
  return { statuses, expiresAt };
}

interface CreateMapState {
  map?: {};
  error?: { message: string; };
}

export async function createMap(
  prevState: CreateMapState | null,
  formData: FormData
): Promise<CreateMapState> {
  const files = formData
    .getAll('file')
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (files.length === 0) return { error: { message: 'ファイルが選択されていません' } };

  // 形状ファイル / メタデータに分類
  const shape = files.find(x => x.name.match(/\.(kml|kmz|json|geojson)$/i));
  const meta  = files.find(x => x.name.match(/\.(ya?ml|json)$/));

  if (!shape)
    return { error: { message: '形状ファイル（.kml/.kmz/.geojson）を送信してください' } };

  if (!meta)
    return { error: { message: 'メタデータファイル（.yaml/.yml/.json）を送信してください' } };

  console.debug('shape.name:', shape.name);
  console.debug('shape.size:', shape.size);
  console.debug('shape.type:', shape.type);

  console.debug('meta.name:', meta.name);
  console.debug('meta.size:', meta.size);
  console.debug('meta.type:', meta.type);

  const mapFile = MapFile.from({ meta, shape });

  let map: Map;

  // メタデータを読み込み

  // 形状ファイルを読み込み
  if (shapeFile.name.match(/\.km[lz]$/i)) {
    // KMZ を扱うなら jszip を使って doc.kml を取り出す
    // const buf = await shape.arrayBuffer();
    // const zip = await JSZip.loadAsync(buf);
    // const kmlEntry = zip.file(/(^|\/)doc\.kml$/i)[0] ?? zip.file(/\.kml$/i)[0];
    // if (!kmlEntry) return { error: { message: 'KMZ 内に KML が見つかりません' } };
    // shapeText = await kmlEntry.async('text');
    // const parser = new XMLParser();
    // const kmlObj = parser.parse(shapeText);
    // console.debug('KML from KMZ keys:', Object.keys(kmlObj));
    let kml: KML | undefined;
    try {
      kml = parseKML(await shapeFile.bytes());
    } catch (e) {
      console.error(e);
      return { error: { message: 'KML のパースに失敗しました。' } };
    }
    console.debug('KML:', JSON.stringify(kml, null, 2));
    try {
      map = extractMapFromKML(kml, meta);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'KML のパースに失敗しました。';
      return { error: { message } };
    }
  } else if (shapeFile.name.match(/\.geojson$/i)) {
    const text = await shapeFile.text();
    const geojson = JSON.parse(text);
    console.debug('GeoJSON type:', geojson.type);
    // map = ...;
    return { error: { message: 'GeoJSON 形式の形状ファイル解析処理は未実装です' } };
  } else {
    return { error: { message: '未対応の形状ファイル形式です' } };
  }

  console.debug('map:', JSON.stringify(map, null, 2));

  const r = await db.transaction(async tx => {
    await tx.insert(maps).values(map);
    await tx.insert(statuses).values(map.statuses);
    await tx.insert(places).values(map.places);
    await tx.insert(coordinates).values(map.places.flatMap(x => x.coordinates));
  });
  console.debug('inserts result:', r);
  // const map = await db.query.maps.findFirst({
  //   where: (maps, { eq }) => eq(maps.id, mapId),
  //   with: { places: { with: { coordinates: true, status: true } }, statuses: true }
  // });

  await new Promise(r => setTimeout(r, 2000));
  return { error: { message: "不明なエラー" } };
}
