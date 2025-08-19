import { notFound } from 'next/navigation';

import type { PosterBoard } from '../../types';

const MOCK = {
  DATA: `
Map ID,Local ID,投票区,番号,所在地,緯度,経度,ジオハッシュ
11111111,11111115,0,1,東京都小平市花小金井南町一丁目２３番,139.511948,35.726749,
11111111,11111111,1,1,静岡県御殿場市御殿場２７番地の１,138.9407431,35.3140996,
11111111,11111112,1,2,静岡県御殿場市西田中２３７番地の７,138.9402341,35.3148969,
11111111,11111113,1,3,静岡県御殿場市御殿場２４７番地の１,138.944846,35.3177324,
11111111,11111114,1,4,静岡県御殿場市御殿場５３１番地の２,138.9431674,35.31569,
`.trim(),

  parseCSV(csv: string): PosterBoard[] {
    const lines = csv.split(/\r?\n/);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(',');
      rows.push({
        mapId: cols[0],
        localId: cols[1],
        areaNumber: Number(cols[2]),
        number: Number(cols[3]),
        address: cols[4],
        longitude: parseFloat(cols[5]),
        latitude: parseFloat(cols[6])
      });
    }
    return rows;
  }
};

export async function GET(_req: Request) {
  const items = MOCK.parseCSV(MOCK.DATA);

  if (items.length === 0) notFound();

  return new Response(
    JSON.stringify(items),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
