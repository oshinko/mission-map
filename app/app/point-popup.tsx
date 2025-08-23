'use client';

import type { Place } from './types';

export default function PointPopup({ place }: { place: Place }) {
  const handleClick = () => {
    window.alert('OK');
  };

  return (
    <>
      <div className="popup-title">
        {place.localId}
      </div>
      <div className="popup-body">
        {place.address}<br/>
        経度: {place.points[0].longitude}, 緯度: {place.points[0].latitude}
      </div>

      <button onClick={handleClick}>Click Me</button>
    </>
  );
}
