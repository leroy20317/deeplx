/**
 * @author: leroy
 * @date: 2025-01-23 17:10
 * @description：deepl 翻译接口
 */
import type { NextRequest } from 'next/server';
import axios from 'axios';
const authToken = process.env.AUTH_TOKEN || '';
const deeplCookies = (process.env.DEEPL_COOKIES || '').split(',').filter(Boolean);

const getNextCookie = () => {
  const length = deeplCookies.length;
  const index = Math.floor(Math.random() * length);
  return deeplCookies[index] || '';
};

function getICount(translateText?: string) {
  return (translateText || '').split('i').length - 1;
}

function getRandomNumber() {
  return Math.floor(Math.random() * 100000) + 83000000000;
}

function getTimestamp(iCount: number) {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

async function translate(
  text = '',
  sourceLang = 'AUTO',
  targetLang = 'ZH',
  quality = 'normal',
  tryCount = 0,
) {
  const iCount = getICount(text);
  const id = getRandomNumber();
  const cookie = getNextCookie();

  const maxRetries = 5;
  if (tryCount >= maxRetries) {
    console.error('Max retry limit reached.');
    return null;
  }

  const priority = quality === 'fast' ? -1 : 1;
  const advancedMode = quality !== 'fast';

  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_handle_jobs',
    id: id,
    params: {
      jobs: [
        {
          kind: 'default',
          sentences: [
            {
              text: text,
              id: 1,
              prefix: '',
            },
          ],
          raw_en_context_before: [],
          raw_en_context_after: [],
          preferred_num_beams: 4,
        },
      ],
      lang: {
        target_lang: targetLang.toUpperCase(),
        preference: {
          weight: {},
          default: 'default',
        },
        source_lang_computed: sourceLang.toUpperCase(),
      },
      priority: priority,
      commonJobParams: {
        quality: quality,
        regionalVariant: 'zh-Hans',
        mode: 'translate',
        browserType: 1,
        textType: 'plaintext',
        advancedMode: advancedMode,
      },
      timestamp: getTimestamp(iCount),
    },
  };

  try {
    const response = await axios.post('https://api.deepl.com/jsonrpc', postData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        Referer: 'https://www.deepl.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        cookie: cookie,
      },
    });
    if (response.status !== 200) {
      console.error('Error', response.status);
      return null;
    }

    const result = response.data.result;
    const translations = result && result.translations;
    if (translations && translations.length > 0 && translations[0].beams.length > 0) {
      const texts = translations[0].beams.flatMap((beam: any) =>
        beam.sentences.map((sentence: any) => sentence.text),
      );
      return {
        text: texts[0], // 返回第一个翻译结果
        alternatives: texts.slice(1), // 返回剩余的备用翻译
      };
    }
    return null;
  } catch (err) {
    console.error('response error:', err);
    console.log('Trying again due to assuming the current proxy or cookie is invalid...');
    return await translate(text, sourceLang, targetLang, quality, tryCount + 1);
  }
}

export async function POST(request: NextRequest) {
  // 检验 token
  if (authToken) {
    const token = request.nextUrl.pathname.split('/')[1];
    console.log('test token', token, authToken);
    if (authToken !== token) return new Response('Bad Request', { status: 400 });
  }

  // 检验 cookie
  if (!deeplCookies.length) {
    console.log('test deeplCookies', deeplCookies);
    return new Response('Server Error', { status: 500 });
  }

  const { text, source_lang, target_lang, quality } = await request.json();
  try {
    const result = await translate(text, source_lang, target_lang, quality || 'normal');
    if (!result) {
      return new Response('Translation failed or too many requests', { status: 500 });
    }

    return Response.json({
      alternatives: result.alternatives,
      code: 200,
      data: result.text,
      id: Math.floor(Math.random() * 10000000000),
      source_lang: source_lang.toUpperCase(),
      target_lang: target_lang.toUpperCase(),
    });
  } catch (error: any) {
    return new Response(error.message || 'Translation failed', { status: 500 });
  }
}
