// body_markdown を本文HTMLへ。marked を prose 用に最小設定で利用。
// 本文は外部ソース由来の素材から生成されるため、生HTML・危険プロトコルを無害化する
// （無人＋push=即本番のため、混入時の公開事故を防ぐ多層防御）。
import { marked } from 'marked';

// 許可するURLプロトコル。これ以外（javascript:/data:/vbscript: 等）は危険として弾く。
// 相対パス・アンカー（#…）・http(s)・mailto は許可。
const SAFE_URL = /^(https?:\/\/|mailto:|#|\/|\.\/|\.\.\/)/i;
function safeUrl(u = '') {
  return SAFE_URL.test(String(u).trim()) ? String(u).trim() : '#';
}

// 本文は純Markdown前提。生HTMLトークンは出力せずテキスト化し、リンク/画像は
// プロトコル許可リストで検証する（XSS・スクリプト注入の多層防御）。
const renderer = {
  // 生HTML（<script> 等）は描画せず、画面に無害な文字列として出す。
  html({ text }) {
    return esc(text);
  },
  link({ href, title, tokens }) {
    const url = esc(safeUrl(href));
    const t = title ? ` title="${esc(title)}"` : '';
    const text = this.parser.parseInline(tokens);
    return `<a href="${url}" rel="noopener nofollow"${t}>${text}</a>`;
  },
  image({ href, title, text }) {
    const url = esc(safeUrl(href));
    const t = title ? ` title="${esc(title)}"` : '';
    return `<img src="${url}" alt="${esc(text)}"${t}>`;
  },
};

marked.setOptions({ gfm: true, breaks: false });
marked.use({ renderer });

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
