'use client';

import L from 'leaflet';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';
import { createRoot } from 'react-dom/client';
import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map('map', { zoomControl: false }).setView([35.681236, 139.767125], 14);
    mapRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

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
    })();
  }, []);

  return <div id="map" />;
};
