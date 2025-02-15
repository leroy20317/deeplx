/**
 * @author: leroy
 * @date: 2025-02-15 16:10
 * @description：划词翻译自定义接口
 */
import type { NextRequest } from 'next/server';
import axios from 'axios';
const authToken = process.env.AUTH_TOKEN || '';

const translate = async (params: { text: string; source: string; destination: string[] }) => {
  // 定义一个 map，用于将划词翻译的语种名称转为翻译api的语种代码
  const languagesMap: Record<string, string> = {
    '中文(简体)': 'zh',
    英语: 'en',
    日语: 'ja',
  };

  // 先尝试翻译为首要目标语种
  const dest = params.destination[0];
  // 将划词翻译的语种名称转为翻译api的语种代码
  const destCode = languagesMap[dest];
  const source = params.source ? languagesMap[params.source] : 'auto';

  if (!destCode || !source) {
    throw new TypeError(`翻译api不支持${params.source}或者${dest}`);
  }
  const translateUrl = `${process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:5700'}/translate`;
  // { "source_lang": "EN","target_lang": "ZH","text": "Hello World." }
  const res = await axios.post<{ code: number; data: string }>(translateUrl, {
    source_lang: source.toUpperCase(),
    target_lang: destCode.toUpperCase(),
    text: params.text,
  });
  // 如果源文本的语种跟首要目标语种一致，翻译api会将源文本原样返回。
  // 此时就需要重新调用接口，将文本翻译为次要目标语种
  if (
    params.text === res.data.data &&
    // destination 数组也可能只有一个元素，所以这里需要做一个判断
    params.destination.length > 1
  ) {
    return translate({ ...params, destination: params.destination.slice(1) });
  }
  return {
    data: res.data.data,
    from: '',
    to: dest,
  };
};

export async function POST(request: NextRequest) {
  // 检验 token
  if (authToken) {
    const token = request.nextUrl.pathname.split('/')[1];
    console.log('test token', token, authToken);
    if (authToken !== token) return new Response('Bad Request', { status: 400 });
  }

  // {
  //   "name": "翻译一", // 翻译源名称
  //   "text": "你好，划词翻译", // 这是需要翻译的文本
  //   "destination": ["中文(简体)", "英语"], // 目标语种，这是一个数组，原因会在下面解释
  //   "source": "" // 源语种，可能是 undefined，此时就需要你的接口自动判断语种
  // }
  const { text, name, destination, source } = await request.json();

  if (name !== 'DeepLX') {
    return new Response('Bad Request', { status: 400 });
  }

  try {
    const result = await translate({ text, source, destination });
    if (!result?.data) {
      return new Response('Translation failed or too many requests', { status: 500 });
    }

    return Response.json({
      text: text, // 翻译的文本
      from: result.from, // 翻译文本的源语种，这个语种会显示在翻译名称右侧并且可以切换
      to: result.to, // 翻译结果的语种
      result: [result.data], // 翻译结果，可以有多条，一个段落对应一个翻译结果。可选。
      // ttsURI: 'https://....', // 翻译文本的语音地址，源语种名称右侧的播放按钮会用它播放语音。可选。
      // link: 'https://...', // 此翻译接口的在线查询地址，点击翻译名称最右侧的图标会跳转到这个链接。可选。
      // phonetic: [
      //   {
      //     // 查询文本的音标（英文音标或汉语拼音），可以有多个。可选。
      //     name: '中', // 语种的中文名称，如“美”、“英”。可选。
      //     ttsURI: 'https://...', // 此音标对应的语音地址。可选。
      //     value: 'ni hao, hua ci fan yi', // 此语种对应的音标值。可选。
      //   },
      // ],
      // dict: [
      //   {
      //     // 如果有词典数据则用 dict 表示，可以有多条。可选。
      //     pos: 'n.', // 词性，显示在每一行词典释义的开头，例如 “n.”、“v.”。可选。
      //     terms: ['考试', '测试', '考验'], // 单词的多个释义，例如英文单词 test 的释义是 ["考试", "测试", "考验"]
      //   },
      // ],
    });
  } catch (error: any) {
    return new Response(error.message || 'Translation failed', { status: 500 });
  }
}
