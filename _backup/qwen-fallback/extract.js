// link 先ページの本文を抽出し、LLMの grounding（参照専用）テキストにする。
// 再公開はしない。失敗/薄い場合は短文モードへ縮退させるため null を返す。
import { extract } from '@extractus/article-extractor';
import { config } from './config.js';

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 戻り値: { text, thin } — thin=true なら抽出が薄く短文モード推奨
export async function extractBody(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const data = await extract(url, {}, { signal: ctrl.signal });
      clearTimeout(timer);
      const text = stripHtml(data?.content || '');
      if (text && text.length >= config.extractMinChars) {
        return { text: text.slice(0, 8000), thin: false };
      }
      return { text, thin: true };
    } catch (err) {
      if (attempt === 1) {
        console.warn(`  [extract] 失敗: ${url} (${err.message})`);
        return { text: '', thin: true };
      }
    }
  }
  return { text: '', thin: true };
}
