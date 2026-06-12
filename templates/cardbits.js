// カードの共有部品: 実写真サムネと Unsplash 帰属（index/article/section で共用）。
import { esc } from '../src/markdown.js';

// 実写真があれば背景画像サムネ、無ければ CSS 抽象サムネ
export function thumb(a, variant) {
  const img = a.image || {};
  if (img.imageUrl) {
    return `<figure class="thumb" style="background-image: url('${esc(img.imageUrl)}'); background-size: cover; background-position: center;" aria-hidden="true"></figure>`;
  }
  return `<figure class="thumb ${variant}" aria-hidden="true"></figure>`;
}

// Unsplash 規約準拠の帰属（実写真のときのみ）
export function credit(a) {
  const img = a.image || {};
  if (!img.imageUrl) return '';
  return `<span style="color: var(--color-ink-3); font-size: var(--text-xs);">Photo: <a href="${esc(img.profileUrl)}" target="_blank" rel="noopener">${esc(img.photographer)}</a> / ${esc(img.provider)}</span>`;
}
