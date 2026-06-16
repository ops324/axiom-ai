// 公式プレス画像（報道対象“本人”の公式キービジュアル）を特定記事へ手動登録する CLI。
// 生成・自動ジョブの既定挙動（stock/抽象サムネ）は変えず、人手で個別に“昇格”させる安全運用。
// 登録した画像は kind:'press' になり backfill-images の自動上書き対象外になる。
//
// 使い方:
//   npm run set-press-image -- <slug> <imageUrl> <credit> [creditUrl] [source]
//   npm run set-press-image -- <slug> --clear     （プレス指定を解除。次回 backfill で stock 再取得）
//
//   <imageUrl>  公式発表ページの画像URL（外部直リンク）または "/assets/press/<slug>.jpg"（ローカル複製）
//   <credit>    クレジット表示名（必須・例: Anthropic）。表示は「提供: <credit>」
//   [creditUrl] クレジットのリンク先（任意・公式発表ページ）
//   [source]    許諾根拠などの内部メモ（任意・表示はしない）
//
// 注意（権利配慮）: 報道対象“本人”の公式画像に限る／各社の brand・press・newsroom で
//   報道利用可を確認する／不安なら使わず Unsplash・公式埋め込みにフォールバックする。
import { loadArticles, saveArticles } from './store.js';
import { renderSite } from './render.js';

const USAGE = `使い方:
  npm run set-press-image -- <slug> <imageUrl> <credit> [creditUrl] [source]
  npm run set-press-image -- <slug> --clear`;

const args = process.argv.slice(2);
if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log(USAGE);
  process.exit(args.length ? 0 : 1);
}

const [slug, ...rest] = args;
const arts = await loadArticles();
const a = arts.find((x) => x.slug === slug);
if (!a) {
  console.error(`✗ slug "${slug}" の記事が見つかりません。`);
  process.exit(1);
}

if (rest[0] === '--clear') {
  if (a.image?.kind !== 'press') {
    console.log(`記事 "${slug}" はプレス画像ではありません（変更なし）。`);
    process.exit(0);
  }
  delete a.image; // 次回 backfill-images で stock を再取得
  await saveArticles(arts);
  const stats = await renderSite(arts);
  console.log(`✓ "${slug}" のプレス画像を解除しました（計 ${stats.articles} 記事を再生成）。`);
  console.log('  → 抽象サムネ表示中。stock 写真に戻すには npm run backfill-images を実行してください。');
  process.exit(0);
}

const [imageUrl, creditRaw, creditUrl = '', source = ''] = rest;
const credit = (creditRaw || '').trim();
if (!imageUrl || !imageUrl.trim()) { console.error(`✗ imageUrl が必要です。\n${USAGE}`); process.exit(1); }
if (!credit) { console.error(`✗ クレジット(credit)は必須です（例: Anthropic）。\n${USAGE}`); process.exit(1); }

a.image = {
  kind: 'press',
  imageUrl: imageUrl.trim(),
  credit,
  ...(creditUrl.trim() ? { creditUrl: creditUrl.trim() } : {}),
  ...(source.trim() ? { source: source.trim() } : {}),
};

await saveArticles(arts);
const stats = await renderSite(arts);
console.log(`✓ "${slug}" にプレス画像を登録しました（計 ${stats.articles} 記事を再生成）。`);
console.log(`  画像: ${a.image.imageUrl}`);
console.log(`  クレジット: 提供: ${a.image.credit}${a.image.creditUrl ? ` (${a.image.creditUrl})` : ''}`);
console.log('  公開前に必ず npm run check を実行してください。');
