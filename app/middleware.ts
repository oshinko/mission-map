import { tryInitOrUpdateDb } from '@/db';

export async function middleware() {
  // await tryInitOrUpdateDb();
}
 
export const config = { matcher: '/api/:path*' };
