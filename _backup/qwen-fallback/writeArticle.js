// ローカル qwen2.5:14b で「短い独自要約＋編集論評」を生成する。
// ollama の構造化出力(format=JSONスキーマ)で安定パース。捏造抑制が最優先。
//
// 見出し品質対策（2段構え・課金0）:
//   (1) 予防 … プロンプトで「日本語のみ/略語を作らない」を明示＋低temperature。
//   (2) 検出&再生成 … 生成後に見出しを機械チェックし、崩れ/捏造があれば
//        見出しだけ最大 config.headlineRetries 回まで作り直し、最後は安全な見出しにフォールバック。
import { config } from './config.js';

// ollama /api/chat に渡す JSON スキーマ（構造化出力）
const SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    lead: { type: 'string' },
    body_markdown: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['headline', 'lead', 'body_markdown', 'tags'],
};

// 日本語文字（ひらがな・カタカナ・漢字・長音）の直後に小文字ラテンが3字以上連結 = 崩れ
// 例: 「トランジillionaire」。「GPT-5を」「AIモデル」等の正当な並びは検出しない。
const GARBLE_RE = /[ぁ-ゖァ-ヶー一-龯][a-z]{3,}/;

function buildCorpus(candidate, grounding) {
  return [candidate.title, candidate.summary, grounding].filter(Boolean).join(' ');
}

// 見出しの不具合を検出。問題があれば理由文字列、無ければ null。
export function headlineProblem(headline, corpus) {
  const h = (headline || '').trim();
  if (!h) return '空';
  if (h.length > 60) return '長すぎ';
  if (GARBLE_RE.test(h)) return '文字崩れ(日本語と英字の連結)';
  // 3字以上の大文字略語がソースに存在しない = 捏造（例: 本文に無い「MANGOS」）
  const upper = (corpus || '').toUpperCase();
  for (const tok of h.match(/[A-Z]{3,}/g) || []) {
    if (!upper.includes(tok)) return `ソース外の略語(${tok})`;
  }
  return null;
}

// 本文の不具合検出。文字崩れ、またはソースに無い4字以上の大文字略語（捏造）。
// 一般的な3字略語(IPO/CEO/GPU/API等)は誤検出回避のため対象外。
export function bodyProblem(body, corpus) {
  const t = (body || '').trim();
  if (!t) return '空';
  if (GARBLE_RE.test(t)) return '文字崩れ(日本語と英字の連結)';
  const upper = (corpus || '').toUpperCase();
  for (const tok of t.match(/[A-Z]{4,}/g) || []) {
    if (!upper.includes(tok)) return `ソース外の略語(${tok})`;
  }
  return null;
}

function buildPrompt(candidate, grounding, thin) {
  const limit = thin ? config.shortModeMaxChars : config.bodyTargetChars;
  const lengthRule = thin
    ? `本文は ${limit} 文字以内、3〜4文の簡潔な要約のみ（薄い情報源のため論評は最小限）。`
    : `本文は ${limit} 文字程度。前半で「何が起きたか」を要約し、後半で「なぜ重要か」を1〜2文で論評。`;

  return [
    'あなたはAI専門ニュースメディアの日本語編集者です。以下の【ソース情報】だけを根拠に、日本語の短い解説記事を書いてください。',
    '',
    '## 厳守ルール（最重要）',
    '- ソースに書かれていない数値・固有名詞・日付・出来事を絶対に創作しない。',
    '- 推測や一般論で事実を補わない。情報が乏しければ短く書く。',
    '- 誇張表現を避け、中立で落ち着いた報道トーンにする。',
    `- ${lengthRule}`,
    '- body_markdown は Markdown（段落、必要なら箇条書き）。見出し(#)は使わない。',
    '- tags は日本語で3〜5個（トピックや固有名詞）。',
    '- 出典リンクは本文に含めない（システムが自動付与する）。',
    '',
    '## 見出し(headline)の厳守ルール',
    '- 40文字以内・**日本語で**書く。lead は記事の要点1文（80文字以内）。',
    '- **英単語の途中に日本語が混ざる綴りや、意味不明なスペルを絶対に出さない**（例:「トランジillionaire」のような崩れは厳禁）。',
    '- 固有名詞や略語は**ソース情報に実際に出てくる表記だけ**を使う。**略語を自分で発明しない**。',
    '- 英語の固有名詞は無理に訳さず、一般的なカタカナ表記か原綴り(GPT-5, OpenAI 等ソースにある形)で書く。',
    '',
    '## ソース情報',
    `提供元: ${candidate.source}`,
    `元タイトル: ${candidate.title}`,
    candidate.summary ? `要約: ${candidate.summary}` : '',
    grounding ? `本文抜粋:\n${grounding}` : '（本文抽出なし。元タイトルと要約のみを根拠にすること）',
  ].filter(Boolean).join('\n');
}

// ollama /api/chat を1回叩いて JSON を返す。失敗時は null。
async function callModel(reqBody) {
  try {
    const res = await fetch(config.ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });
    if (!res.ok) throw new Error(`ollama ${res.status}`);
    const data = await res.json();
    return JSON.parse(data?.message?.content || '');
  } catch {
    return null;
  }
}

// 本文を踏まえて見出しだけを作り直す（崩れ/捏造を避ける強い指示つき）。
export async function regenerateHeadline(candidate, grounding, article, problem) {
  const prompt = [
    'あなたはAI専門ニュースの日本語編集者です。以下の記事本文に対する見出しを1つだけ作り直してください。',
    '',
    '## 厳守',
    '- **日本語のみ**で書く。英単語の途中に日本語が混ざる崩れや、意味不明な綴りを絶対に出さない。',
    '- ソースに出てこない固有名詞・略語・数値を作らない。**略語を発明しない**。',
    '- 40文字以内、誇張なし、報道トーン。',
    `- 直前の見出し「${article.headline}」には「${problem}」という問題があった。これを必ず避けること。`,
    '',
    '## 記事本文',
    article.body_markdown,
    '',
    '## 参考（ソース）',
    `元タイトル: ${candidate.title}`,
    candidate.summary ? `要約: ${candidate.summary}` : '',
  ].filter(Boolean).join('\n');

  const data = await callModel({
    model: config.model,
    stream: false,
    format: { type: 'object', properties: { headline: { type: 'string' } }, required: ['headline'] },
    options: { temperature: 0.15 },
    messages: [{ role: 'user', content: prompt }],
  });
  const h = data?.headline?.trim();
  return h || null;
}

// 再生成でも直らない場合の安全な見出し。崩れの無い lead → 元タイトルの順。
export function safeFallbackHeadline(article, candidate) {
  const lead = (article.lead || '').trim();
  if (lead && !GARBLE_RE.test(lead)) {
    return lead.length > 40 ? lead.slice(0, 39) + '…' : lead;
  }
  return (candidate.title || 'AI関連ニュース').slice(0, 60);
}

export async function writeArticle(candidate, grounding, thin) {
  const reqBody = {
    model: config.model,
    stream: false,
    format: SCHEMA,
    options: { temperature: config.temperature },
    messages: [{ role: 'user', content: buildPrompt(candidate, grounding, thin) }],
  };

  const corpus = buildCorpus(candidate, grounding);

  // --- 本体生成＋本文ガード ---
  // パース失敗は即リトライ。本文に崩れ/捏造があれば記事まるごと再生成、
  // bodyRetries を超えても直らなければ「破棄」（捏造記事を公開しない）。
  let article = null;
  const maxGen = 2 + config.bodyRetries;
  for (let attempt = 0; attempt < maxGen; attempt++) {
    const parsed = await callModel(reqBody);
    if (!parsed?.headline || !parsed?.body_markdown) continue; // パース失敗→再試行
    parsed.tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [];
    const bp = bodyProblem(parsed.body_markdown, corpus);
    if (!bp) { article = parsed; break; }
    console.warn(`  [body] 不具合(${bp}) → 記事を再生成 (${attempt + 1}/${maxGen})`);
    article = parsed; // 暫定保持（最終的に直らなければ破棄）
  }
  if (!article) {
    console.warn(`  [write] 失敗: ${candidate.title}`);
    return null;
  }
  if (bodyProblem(article.body_markdown, corpus)) {
    console.warn(`  [body] 再生成不可 → 記事を破棄: ${candidate.title}`);
    return null;
  }

  // --- 見出し検証＆再生成（課金0の品質ガード）---
  let problem = headlineProblem(article.headline, corpus);
  for (let i = 0; problem && i < config.headlineRetries; i++) {
    console.warn(`  [headline] 不具合(${problem}) → 再生成 ${i + 1}/${config.headlineRetries}`);
    const fixed = await regenerateHeadline(candidate, grounding, article, problem);
    if (fixed) article.headline = fixed;
    problem = headlineProblem(article.headline, corpus);
  }
  if (problem) {
    article.headline = safeFallbackHeadline(article, candidate);
    console.warn(`  [headline] 再生成不可 → フォールバック採用: ${article.headline}`);
  }

  return article;
}
