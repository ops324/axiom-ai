// パイプライン全体の設定。ソース・モデル・件数などはここで調整する。
import 'dotenv/config';

export const config = {
  // --- 生成設定（執筆はヘッドレス Claude が担当。ollama は廃止）---
  maxArticles: Number(process.env.MAX_ARTICLES || 2), // 1回で「掲載する」本数（×3回/日 = 6本/日）
  candidatePool: 12,    // Claude に提示する候補プール数（この中から重要度で maxArticles 本を選別）
  importanceFloor: 3,   // 重要度(1-5)がこれ未満の候補は掲載しない（些末ネタの除外）
  retentionTop: 40,     // トップページに載せる最新記事の上限。超過分はアーカイブへ

  // 弱いソース除外: 動画/ポッドキャスト等は本文が乏しく取材に向かないためスキップ
  skipUrlPatterns: ['/video/', '/videos/', '/podcast/', '/podcasts/', '/live/', 'youtube.com', 'youtu.be'],

  // --- 画像（フリー素材API・任意）---
  imageProvider: process.env.IMAGE_PROVIDER || 'unsplash', // 'unsplash' | 'pexels'
  unsplashKey: process.env.UNSPLASH_KEY || '',
  pexelsKey: process.env.PEXELS_KEY || '',

  // --- ニュース補助ソース（任意・キーがあれば使用）---
  newsapiKey: process.env.NEWSAPI_KEY || '',
  gnewsKey: process.env.GNEWS_KEY || '',
  tavilyKey: process.env.TAVILY_KEY || '',

  // --- RSS（キー不要・主力ソース）---
  // AI関連の公式/メディアRSS。増やす場合はここに追加。
  // tier: 'primary'=企業公式の一次情報（優先）／'media'=報道メディア（補助・要裏取り）
  rssFeeds: [
    { url: 'https://openai.com/news/rss.xml',                source: 'OpenAI',        section: '基盤モデル', tier: 'primary' },
    { url: 'https://blog.google/technology/ai/rss/',         source: 'Google AI',     section: '研究',       tier: 'primary' },
    { url: 'https://huggingface.co/blog/feed.xml',           source: 'Hugging Face',  section: '研究',       tier: 'primary' },
    { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', section: 'スタートアップ', tier: 'media' },
    { url: 'https://venturebeat.com/category/ai/feed/',      source: 'VentureBeat',   section: '産業応用',   tier: 'media' },
    { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', source: 'The Verge', section: '産業応用', tier: 'media' },
    { url: 'https://www.technologyreview.com/feed/',         source: 'MIT Tech Review', section: '研究',     tier: 'media' },
    { url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',   source: 'ITmedia AI＋',   section: '産業応用',   tier: 'media' },
  ],

  // CSS抽象サムネのフォールバック候補（styles.css のクラス）
  thumbVariants: ['thumb--blue', 'thumb--amber', 'thumb--violet', 'thumb--teal', 'thumb--rose', 'thumb--lime'],
};
