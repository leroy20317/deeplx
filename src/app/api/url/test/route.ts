/**
 * @author: leroy
 * @date: 2024-07-04 17:20
 * @description：route
 */

import axios from 'axios';
import dayjs from 'dayjs';
import { initClient } from '@/utils/redis';

export async function POST(request: Request) {
  const data: { url: string | string[] } = await request.json();
  const headers = { 'Content-Type': 'application/json' };
  const payload = {
    text: 'Hello, World!',
    source_lang: 'EN',
    target_lang: 'ZH',
  };
  const handleUrls = typeof data.url === 'string' ? [data.url] : data.url;

  const redis = await initClient();
  const urlsData = ((await redis?.hmGet('deepl-urls', handleUrls)) || []).map<API.UrlData>((ele) =>
    JSON.parse(ele),
  );
  const results = await Promise.all(
    handleUrls.map((api) => {
      return new Promise<{ url: string; status: 0 | 1 }>((resolve) => {
        axios
          .post(`${api}/translate`, payload, { headers, timeout: 5000 })
          .then((res) => {
            console.log('test', res.data.data);
            resolve({ url: api, status: res.data.data.includes('你好，世界') ? 1 : 0 });
          })
          .catch(() => {
            resolve({ url: api, status: 0 });
          });
      });
    }),
  );
  const handleSet = results.map((ele, i) => [
    ele.url,
    JSON.stringify({
      status: ele.status,
      failure_times: ele.status === 1 ? 0 : urlsData[i].failure_times + 1,
      translate_times:
        ele.status === 1 ? urlsData[i].translate_times + 1 : urlsData[i].translate_times,
      last_success:
        ele.status === 1 ? dayjs().format('YYYY-MM-DD HH:mm:ss') : urlsData[i].last_success,
    }),
  ]);
  await redis?.hSet('deepl-urls', handleSet.flat());
  return Response.json({
    status: 'success',
    message: `本次测试${results.length}条，成功${results.filter((ele) => ele.status === 1).length}条`,
  });
}
