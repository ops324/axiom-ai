// 既存 index.html / article.html のマークアップを逐語再現した共通骨格。
// 記事差込領域以外のデザインは一切変えない。
import { config } from '../src/config.js';

const FONTS = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap">`;

export const ticker = `  <!-- ============== TICKER ============== -->
  <div class="ticker" role="region" aria-label="マーケット・モデル指標">
    <div class="ticker__inner">
      <div class="ticker__label">LIVE</div>
      <div class="ticker__feed">
        <span class="ticker__item"><strong>GPT-5</strong><span class="ticker__up">▲ MMLU 91.4</span></span>
        <span class="ticker__item"><strong>CLAUDE-OPUS-4.7</strong><span class="ticker__up">▲ HumanEval 92.1</span></span>
        <span class="ticker__item"><strong>GEMINI-2.5-PRO</strong><span class="ticker__down">▼ MATH 84.0</span></span>
        <span class="ticker__item"><strong>NVDA</strong><span class="ticker__up">▲ $1,284.20 +2.1%</span></span>
        <span class="ticker__item"><strong>EU AI Act</strong><span>Phase II 施行</span></span>
        <span class="ticker__item"><strong>METASTAKE</strong><span class="ticker__up">▲ Llama 4 公開</span></span>
        <span class="ticker__item"><strong>GPT-5</strong><span class="ticker__up">▲ MMLU 91.4</span></span>
        <span class="ticker__item"><strong>CLAUDE-OPUS-4.7</strong><span class="ticker__up">▲ HumanEval 92.1</span></span>
        <span class="ticker__item"><strong>GEMINI-2.5-PRO</strong><span class="ticker__down">▼ MATH 84.0</span></span>
        <span class="ticker__item"><strong>NVDA</strong><span class="ticker__up">▲ $1,284.20 +2.1%</span></span>
        <span class="ticker__item"><strong>EU AI Act</strong><span>Phase II 施行</span></span>
        <span class="ticker__item"><strong>METASTAKE</strong><span class="ticker__up">▲ Llama 4 公開</span></span>
      </div>
    </div>
  </div>`;

export function header(dateLabel, activeNav = 'トップ', base = '') {
  const nav = [{ name: 'トップ', slug: '' }, ...config.navSections];
  const items = nav
    .map(({ name, slug }) => {
      const href = name === 'トップ' ? `${base}index.html` : `${base}sections/${slug}.html`;
      const cur = name === activeNav ? ' aria-current="page"' : '';
      return `          <li><a href="${href}"${cur}>${name}</a></li>`;
    })
    .join('\n');
  return `  <!-- ============== HEADER ============== -->
  <header class="site-header">
    <div class="container">
      <div class="site-header__top">
        <a class="brand" href="${base}index.html">
          <span class="brand__mark">AXIOM<em>·</em>AI</span>
          <span class="brand__sub">Intelligence Daily</span>
        </a>
        <div class="site-header__right">
        <div class="site-header__meta">
          <span>東京</span>
          <time>${dateLabel}</time>
          <a href="#" class="btn btn--ghost" title="準備中" onclick="event.preventDefault(); alert('ログイン機能は準備中です');">ログイン</a>
          <a href="#" class="btn btn--primary" title="準備中" onclick="event.preventDefault(); alert('購読機能は準備中です');">購読 ¥0/月</a>
        </div>
        <div class="site-header__tools">
          <div class="hsearch">
            <input type="search" id="site-search" class="hsearch__input" placeholder="記事を検索…" aria-label="サイト内検索" autocomplete="off" data-base="${base}">
            <div id="site-search-results" class="hsearch__results" role="listbox" hidden></div>
          </div>
          <button type="button" id="theme-toggle" class="theme-toggle" aria-label="配色テーマを切り替え" title="配色テーマを切り替え" onclick="(function(d){var n=d.getAttribute('data-theme')==='light'?'dark':'light';d.setAttribute('data-theme',n);try{localStorage.setItem('theme',n)}catch(e){}var b=document.getElementById('theme-toggle');if(b)b.textContent=n==='light'?'☀':'☾';})(document.documentElement)">☾</button>
        </div>
        </div>
      </div>
      <nav class="site-nav container" aria-label="主要セクション">
        <ul class="site-nav__list">
${items}
        </ul>
      </nav>
    </div>
  </header>`;
}

export const footer = `  <!-- ============== FOOTER ============== -->
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__top">
        <div class="site-footer__brand">
          <span class="brand__mark">AXIOM<em>·</em>AI</span>
          <p>生成 AI と基盤モデルを中心に、世界の意思決定者向けに編集された一次情報を毎日お届けします。本サイトの記事は各一次情報源の要約・論評であり、詳細は必ず出典元をご確認ください。</p>
        </div>
        <div class="site-footer__col">
          <h4>セクション</h4>
          <ul>
            <li><a href="#">基盤モデル</a></li>
            <li><a href="#">研究</a></li>
            <li><a href="#">産業応用</a></li>
            <li><a href="#">規制・倫理</a></li>
            <li><a href="#">ハードウェア</a></li>
          </ul>
        </div>
        <div class="site-footer__col">
          <h4>会社情報</h4>
          <ul>
            <li><a href="#">運営者情報</a></li>
            <li><a href="#">編集方針</a></li>
            <li><a href="#">採用情報</a></li>
            <li><a href="#">取材・お問い合わせ</a></li>
            <li><a href="#">広告掲載</a></li>
          </ul>
        </div>
        <div class="site-footer__col">
          <h4>規約</h4>
          <ul>
            <li><a href="#">プライバシーポリシー</a></li>
            <li><a href="#">利用規約</a></li>
            <li><a href="#">Cookie ポリシー</a></li>
            <li><a href="#">情報公開</a></li>
            <li><a href="#">訂正・更新ポリシー</a></li>
          </ul>
        </div>
        <div class="site-footer__col">
          <h4>購読</h4>
          <ul>
            <li><a href="#">Morning Brief</a></li>
            <li><a href="#">Weekly Outlook</a></li>
            <li><a href="#">RSS フィード</a></li>
            <li><a href="#">X (Twitter)</a></li>
            <li><a href="#">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        <span>© 2026 AXIOM AI Editorial K.K. All rights reserved.</span>
        <div class="site-footer__legal">
          <a href="#">特定商取引法に基づく表記</a>
          <a href="#">セキュリティ</a>
          <a href="#">アクセシビリティ</a>
        </div>
      </div>
    </div>
  </footer>`;

// Cloudflare Web Analytics（Cookieless）。token が設定されているときのみ出力。
function analyticsSnippet() {
  const t = config.analytics?.token;
  if (!t) return '';
  return `  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${t}"}'></script>\n`;
}

// ページ全体のHTMLを組み立てる（base: 記事サブディレクトリ用の相対プレフィックス）
export function page({ title, description, body, base = '' }) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="preconnect" href="https://images.unsplash.com" crossorigin>
${FONTS}
  <link rel="stylesheet" href="${base}assets/styles.css">
${analyticsSnippet()}</head>
<body>

${body}

  <script defer src="${base}assets/search.js"></script>
</body>
</html>
`;
}
