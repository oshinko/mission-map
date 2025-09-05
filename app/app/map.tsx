'use client';

import L from 'leaflet';
import Link from 'next/link';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';
import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';

import PlacePopup from '@/app/place-popup';
import type { Map } from '@/app/types';

const MARKER_ICON_URL = `/marker?scale=1`;
const MARKER_ICON_RETINA_URL = `/marker?scale=2`;

function createMarkerIcon(options?: { color?: string; }) {
  const color = options?.color?.replace(/^#+/, '');
  return L.icon({
    iconUrl: MARKER_ICON_URL + (color ? '&color=' + color : ''),
    iconRetinaUrl: MARKER_ICON_RETINA_URL + (color ? '&color=' + color : ''),
    shadowUrl: markerIconShadow.src ?? markerIconShadow.toString(),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });
}

const defaultMarkerIcon = createMarkerIcon();

// アイコン読み込み設定
L.Marker.prototype.options.icon = defaultMarkerIcon;

async function fetchData(mapId: string) {
  const res = await fetch(`/api/${mapId}`);
  if (res.ok) return await res.json() as Map;
  const hint = await res.text() || (res.status === 404 ? 'Map not found' : res.statusText);
  window.alert(hint);
  throw new Error(hint);
}

export default function Map({ id }: { id: string }) {
  const mapRef = useRef<L.Map>(null);
  const [name, setName] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map('map', { zoomControl: false }).setView([35.681236, 139.767125], 14);
    mapRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 情報ボタン
    const InfoControl = (L.Control as any).extend({
      options: { position: 'topright' },
      onAdd: () => {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const a = L.DomUtil.create('a', '', div);
        a.href = '#';
        a.title = '地図の情報';
        a.setAttribute('aria-label', '地図の情報を開く');
        a.style.width = '30px';
        a.style.height = '30px';
        a.style.lineHeight = '30px';
        a.style.textAlign = 'center';
        a.style.fontSize = '18px';
        a.textContent = 'ℹ︎';

        L.DomEvent.on(a, 'click', (e: any) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          setInfoOpen(true);
        });

        return div;
      }
    });
    new InfoControl().addTo(map);

    const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ||
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // --- 小さい青丸の現在地アイコン ---
    const blueCircleIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
          <circle cx="10" cy="10" r="6" fill="blue" />
        </svg>
      `),
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // 現在地トラッキング（中心追従）
    let youMarker: L.Marker | null = null;
    let accuracyCircle: L.Circle | null = null;
    const MAX_ACCURACY_RADIUS = 50; // メートル

    function onLocationFound(position: GeolocationPosition) {
      const latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
      const radius = Math.min(position.coords.accuracy ?? 0, MAX_ACCURACY_RADIUS);

      if (!youMarker) {
        youMarker = L.marker(latlng, { icon: blueCircleIcon }).addTo(map);
        youMarker.bindPopup(`あなたの現在地（精度 ±${Math.round(radius)}m）`).openPopup();
      } else {
        youMarker.setLatLng(latlng);
        youMarker.setPopupContent(`あなたの現在地（精度 ±${Math.round(radius)}m）`);
      }

      if (!accuracyCircle && radius > 0) {
        accuracyCircle = L.circle(latlng, { radius }).addTo(map);
      } else if (accuracyCircle) {
        accuracyCircle.setLatLng(latlng).setRadius(radius);
      }

      // 中心追従
      map.setView(latlng);
    }

    function onLocationError(error: GeolocationPositionError) {
      console.warn('現在地取得エラー:', error.message);
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      });
    }

    // 掲示板ピン配置
    (async () => {
      const map_ = await fetchData(id);
      const placesLayer = L.layerGroup().addTo(map);
      const bounds = L.latLngBounds([]);

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2));
      }

      map_.places.forEach(place => {
        const latlng = { lat: place.coordinates[0].latitude, lng: place.coordinates[0].longitude };
        const container = document.createElement('div');
        const icon = createMarkerIcon({ color: place.status.color });
        const marker = L.marker(latlng, { icon }).addTo(placesLayer).bindPopup(container);
        createRoot(container).render(
          <PlacePopup
            place={place}
            statuses={map_.statuses}
            onStatusChange={status => {
              if (status.color) {
                const icon = createMarkerIcon({ color: status.color });
                marker.setIcon(icon);
                marker.closePopup();
              }
            }} />
        );
        bounds.extend(latlng);
      });

      // 基本情報を設定
      setName(map_.name);
    })();
  }, []);

  useEffect(() => {
    if (!infoOpen) return;
    // Escape キーで閉じる設定
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setInfoOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [infoOpen]);

  return <>
    <div id="map">
      <footer className="absolute bottom-0 left-0 z-[1000] bg-white/80 px-1 text-xs">
        <Link href="/" className="text-[#0078a8] hover:underline hover:opacity-80">
          Mission Map
        </Link>
      </footer>
    </div>

    {/* モーダル風の固定パネル（地図の上に重ねる） */}
    {infoOpen && (
      <div
        className="fixed inset-0 z-[1100] flex items-start justify-end p-4"
        aria-modal="true"
        role="dialog"
      >
        {/* 背景の半透明オーバーレイ（クリックで閉じる） */}
        <button
          className="absolute inset-0 bg-black/30"
          aria-label="閉じる"
          onClick={() => setInfoOpen(false)}
        />

        {/* 情報パネル */}
        <div className="relative w-full max-w-sm rounded-lg bg-white shadow-lg ring-1 ring-black/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">地図の情報</h2>
              <dl className="mt-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-16">ID</dt>
                  <dd className="font-mono">{id}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-16">名称</dt>
                  <dd className="font-medium">{name}</dd>
                </div>
              </dl>
            </div>

            <button
              className="rounded p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
              onClick={() => setInfoOpen(false)}
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    )}
  </>
};
