'use server';

import YAML from 'yaml'
import { XMLParser } from 'fast-xml-parser';

import { getEndpoint } from '@/utils';
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
};

interface KML {
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
    xml = new XMLParser().parse(strOrBuf);
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
  return { Document: doc };
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

function extractMapFromKML(kml: KML, meta: Meta): Map {
  const mapId = 'aaaa';  // FIXME 例の ID 生成処理を実装する
  const mapExpiresAt = new Date(Date.now() + 10 * 24 * 3600 * 1000);  // +10d

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

  const places: Place[] = placemarks.map(x => {
    const localId = '';  // FIXME
    const type = 'point';  // FIXME
    const name = '';  // FIXME from <name>
    const address = '';  // FIXME from <ExtendedData>
    const statusIndex = 0;  // FIXME
    const status = {  // FIXME from meta.statuses[statusIndex]
      mapId,
      index: 0,
      name: '',
    };
    return { mapId, localId, type, name, address, statusIndex, status, coordinates: [] };
  });

  return {
    id: mapId,
    name: mapName,
    expiresAt: mapExpiresAt,
    places,
    statuses: []
  };
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
  const shapeFile = files.find(x => x.name.match(/\.(kml|kmz|json|geojson)$/i));
  const metaFile  = files.find(x => x.name.match(/\.(ya?ml|json)$/));

  if (!shapeFile)
    return { error: { message: '形状ファイル（.kml/.kmz/.geojson）を送信してください' } };

  if (!metaFile)
    return { error: { message: 'メタデータファイル（.yaml/.yml/.json）を送信してください' } };

  console.debug('shapeFile.name:', shapeFile.name);
  console.debug('shapeFile.size:', shapeFile.size);
  console.debug('shapeFile.type:', shapeFile.type);

  console.debug('metaFile.name:', metaFile.name);
  console.debug('metaFile.size:', metaFile.size);
  console.debug('metaFile.type:', metaFile.type);

  let map: Map;

  // メタデータを読み込み
  const text = await metaFile.text();
  const meta = parseMeta(text);
  console.debug('meta:', meta);

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
    const kml = parseKML(await shapeFile.bytes());
    console.debug('KML:', JSON.stringify(kml, null, 2));
    map = extractMapFromKML(kml, meta);
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

  await new Promise(r => setTimeout(r, 2000));
  return { error: { message: "不明なエラー" } };
}
