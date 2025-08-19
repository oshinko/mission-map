'use client';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';
import { createRoot } from 'react-dom/client';
import { useEffect, useRef } from 'react';

import BoardPopup from './board-popup';
import type { PosterBoard } from './types';

// アイコン読み込み設定
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon.src ?? markerIcon.toString(),
  iconRetinaUrl: markerIcon2x.src ?? markerIcon2x.toString(),
  shadowUrl: markerIconShadow.src ?? markerIconShadow.toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

async function fetchData(mapId: string) {
  return await (await fetch(`/${mapId}/boards`)).json() as PosterBoard[];
}

export default function Map({ id }: { id: string }) {
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map('map').setView([35.681236, 139.767125], 14);
    mapRef.current = map;

    const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ||
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
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
      const boardData = await fetchData('dummy');
      const boardsLayer = L.layerGroup().addTo(map);
      const bounds = L.latLngBounds([]);

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2));
      }

      boardData.forEach(board => {
        const latlng = { lat: board.latitude, lng: board.longitude };
        const container = document.createElement('div');
        L.marker(latlng).addTo(boardsLayer).bindPopup(container);
        createRoot(container).render(<BoardPopup board={board} />);
        bounds.extend(latlng);
      });
    })();
  }, []);

  return <div id="map" />;
};
