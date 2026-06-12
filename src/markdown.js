// body_markdown を本文HTMLへ。marked を prose 用に最小設定で利用。
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export function mdToHtml(md) {
  if (!md) return '';
  return marked.parse(md);
}

// HTML特殊文字のエスケープ（テンプレ差込用）
export function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
