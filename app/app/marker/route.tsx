// app/api/marker/route.ts
import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const color = normalizeColor(searchParams.get('color') || 'blue') || '#2E7AF0';
  const scale = searchParams.get('scale') === '2' ? 2 : 1;

  // 1x: 25x41 / 2x: 50x82（Leaflet 既定サイズ互換）
  const outW = 25 * scale;
  const outH = 41 * scale;
  const strokeW = 2 * scale;

  const svg =
    <svg width={outW} height={outH} viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* ピン本体（下端をさらに伸ばした） */}
      <path
        d="
          M12.5 0.9
          C6.2 0.9 1.1 6.0 1.1 12.3
          C1.1 23.0 10.2 36.6 12.1 39.0
          C12.3 39.3 12.7 39.3 12.9 39.0
          C14.8 36.6 23.9 23.0 23.9 12.3
          C23.9 6.0 18.8 0.9 12.5 0.9 Z
        "
        fill={color}
        stroke="#fff"
        strokeWidth={strokeW}
      />

      {/* 内側のハイライトも下に延長 */}
      <path
        d="
          M12.5 2.5
          C7.2 2.5 3.0 6.7 3.0 11.9
          C3.0 21.5 11.3 33.3 12.3 34.6
          C12.4 34.7 12.6 34.7 12.7 34.6
          C13.7 33.3 22.0 21.5 22.0 11.9
          C22.0 6.7 17.8 2.5 12.5 2.5 Z
        "
        fill="url(#g)"
      />

      {/* 中央の白円（少し下げる） */}
      <circle cx="12.5" cy="14.5" r="4.2" fill="#fff" fillOpacity="0.8" />
    </svg>

  // ← ここが重要：出力PNGのピクセルサイズを指定
  return new ImageResponse(svg, {
    width: outW,
    height: outH,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

function normalizeColor(input: string) {
  const m: Record<string, string> = {
    red: '#ff0000',
    green: '#28a745',
    blue: '#2E7AF0',
    black: '#000000',
    white: '#ffffff',
  };
  if (m[input]) return m[input];
  const hex = input.startsWith('#') ? input.slice(1) : input;
  if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/i.test(hex)) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  return null;
}
