/**
 * @author: leroy
 * @date: 2024-07-04 17:20
 * @description：route
 */

import { initClient } from '@/utils/redis';
import { cookies } from 'next/headers';
import axios from 'axios';

const verify = async () => {
  const cookieStore = cookies();
  if (!cookieStore.get('token')) {
    return false;
  }
  const baseUrl = process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:5700';
  const res = await axios.get(`${baseUrl}/api/user/check`, {
    headers: { Cookie: cookieStore.toString() },
  });
  return res.data.status === 'success';
};

export const dynamic = 'force-dynamic';
export async function GET() {
  const isLogin = await verify();
  if (!isLogin) {
    return new Response(null, {
      status: 401,
    });
  }
  const redis = await initClient();
  const deeplUrls = (await redis?.hGetAll('deepl-urls')) || {};
  return Response.json({
    status: 'success',
    data: Object.entries(deeplUrls)
      .map(([url, item]) => ({
        url,
        ...JSON.parse(item),
      }))
      .sort((a, b) => a.url.localeCompare(b.url)),
  });
}
