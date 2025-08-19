'use client';

import type { PosterBoard } from './types';

export default function BoardPopup({ board }: { board: PosterBoard }) {
  const handleClick = () => {
    window.alert('OK');
  };

  return (
    <>
      <div className="popup-title">
        掲示板: {board.areaNumber}-{board.number}
      </div>
      <div className="popup-body">
        {board.address}<br/>
        経度: {board.longitude}, 緯度: {board.latitude}
      </div>

      <button onClick={handleClick}>Click Me</button>
    </>
  );
}
