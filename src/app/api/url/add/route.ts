/**
 * @author: leroy
 * @date: 2024-07-04 17:20
 * @description：route
 */

import { cookies } from 'next/headers';
import axios from 'axios';
import { initClient } from '@/utils/redis';

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

export async function POST(request: Request) {
  const isLogin = await verify();
  if (!isLogin) {
    return new Response(null, {
      status: 401,
    });
  }
  const data: { url: string | string[] } = await request.json();
  if (!data.url || data.url.length < 1) {
    return Response.json({
      status: 'error',
      message: '操作数据不能为空！',
    });
  }
  const redis = await initClient();
  const urlsData: Record<string, string> = (await redis?.hGetAll('deepl-urls')) || {};
  const handleUrls = typeof data.url === 'string' ? [data.url] : data.url;
  const handleSet = handleUrls
    .filter((ele) => !urlsData[ele])
    .map((url) => [
      url,
      JSON.stringify({
        status: 0,
        failure_times: 0,
        translate_times: 0,
        last_success: '',
      }),
    ]);
  if (handleSet.length) await redis?.hSet('deepl-urls', handleSet.flat());

  return Response.json({
    status: 'success',
    message: `成功录入${handleSet.length}条，重复${handleUrls.length - handleSet.length}条`,
  });
}
