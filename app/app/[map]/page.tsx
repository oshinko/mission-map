'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { use } from 'react';

const Map = dynamic(() => import('@/app/map'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page({ params }: { params: Promise<{ map: string; }>; }) {
  const { map } = use(params);

  return (
    <>
      <header className="absolute top-0 left-0 z-[1000] bg-white/80 px-3 py-1">
        <h1>
          <Link href="/" className="text-[#0078a8] hover:underline hover:opacity-80 transition">
            Mission Map
          </Link>
        </h1>
      </header>

      <main>
        <Map id={map} />
      </main>
    </>
  );
}
