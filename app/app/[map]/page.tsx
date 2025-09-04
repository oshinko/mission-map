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
  return <Map id={map} />
}
