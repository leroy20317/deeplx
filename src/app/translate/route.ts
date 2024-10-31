/**
 * @author: leroy
 * @date: 2024-07-05 16:30
 * @description：page
 */
import type { NextRequest } from 'next/server';
import { initClient } from '@/utils/redis';
import axios from 'axios';
import dayjs from 'dayjs';
const authToken = process.env.AUTH_TOKEN || '';

const getCacheApis = async () => {
  if (!globalThis.cacheApis?.length) {
    const redis = await initClient();
    const deeplUrls = (await redis?.hGetAll('deepl-urls')) || {};
    globalThis.cacheApis = Object.entries(deeplUrls).reduce<string[]>((prev, [url, item]) => {
      const data = JSON.parse(item);
      if (data.status === 1) {
        prev.push(url);
      }
      return prev;
    }, []);
  }
  return globalThis.cacheApis;
};
const checkApiReturn = (res: any, checkValue = '') => {
  if (!('data' in res) || !('data' in res.data)) {
    return false;
  }
  const { data } = res.data;
  return checkValue ? data.includes(checkValue) : data.length > 0;
};

const finish = async (url: string, status: 0 | 1) => {
  const redis = await initClient();
  const str = await redis?.hGet('deepl-urls', url);
  if (!str) return;
  const data: API.UrlData = JSON.parse(str);
  if (status === 1) {
    data.status = 1;
    data.translate_times = data.translate_times + 1;
    data.last_success = dayjs().format('YYYY-MM-DD HH:mm:ss');
  } else {
    data.status = data.failure_times > 3 ? 0 : 1;
    data.failure_times = data.failure_times + 1;
  }
  console.log(`finish: ${url} ,data: ${JSON.stringify(data)}`);
  await redis?.hSet('deepl-urls', url, JSON.stringify(data));
};

export async function POST(request: NextRequest) {
  // 检验 token
  if (authToken) {
    const token = request.nextUrl.pathname.split('/')[1];
    console.log('test token', token, authToken);
    if (authToken !== token) return new Response('Bad Request', { status: 400 });
  }

  const cacheApis = await getCacheApis();
  if (!cacheApis.length) {
    return new Response('Server Error', { status: 500 });
  }

  const body = await request.json();
  while (cacheApis.length > 0) {
    const targetURL = cacheApis.pop() || '';
    console.log(`request: ${targetURL} ,req: ${JSON.stringify(body)}`);
    try {
      const res = await axios.post(targetURL, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      // 验证结果
      if (!checkApiReturn(res)) {
        throw new Error('api check error');
      } else {
        await finish(targetURL, 1);
      }
      return Response.json(res.data);
    } catch (error: any) {
      await finish(targetURL, 0);
      console.log(`request failure: ${targetURL}`, error?.message || error);
    }
  }
  return new Response('Server Error', { status: 500 });
}
