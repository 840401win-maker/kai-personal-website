// Phase 2B-6: /post/:id Server-side Article Metadata Injection
//
// 只處理目前 GitHub main 實際存在的 5 篇 staticPostsData 靜態文章。
// 不讀取 Firestore、不使用 Firebase Admin 憑證、不修改 HTML body、不修改既有 Person JSON-LD。
// customPosts（Firestore 自訂文章）完全不在本階段處理範圍內。
//
// ⚠️ 資料同步風險：下面 STATIC_ARTICLES 是手動從 index.html 的 staticPostsData 複製過來的
// 最小必要欄位快照（id/title/summary/date/image）。如果之後有人修改 staticPostsData 裡任何一篇
// 文章的內容，這裡不會自動同步，必須手動更新，否則這裡回傳的 metadata 會跟畫面上實際顯示的
// 文章內容不一致（資料漂移）。這是 Option B 方案本身的已知限制，不是本次實作的錯誤。

const STATIC_ARTICLES = {
  'post-30years': {
    title: '【我 30 歲了】30 歲的心路歷程與下個十年展望：從國北護畢業到公職護理師',
    summary: '2026.04.01 我滿 30 歲了！自 22 歲從國立臺北護理健康大學畢業後，回到南部公立醫院服務至今已滿 8 年。經歷風雨與挫折，如今考取公職護理師、晉升 N4 職級並成為臨床教師。內含 16 張完整圖文全典藏與下個十年藍圖...',
    date: '2026-04-01',
    // 原始值為 '1.jpg'，不是完整 http/https 網址。依規則，凡非完整網址一律不輸出
    // article-level image metadata（og:image / twitter:image / JSON-LD image），
    // 不猜測、不補完、不當成 https://kainursinglife.com/1.jpg 這種可能錯誤的網址。
    image: '1.jpg'
  },
  'ig-post-DSzZGbLknAR': {
    title: '【IG 最新貼文】Kai 的護理與理財圖文筆記實錄',
    summary: '這是一篇來自 IG @kai.nursing_life (DSzZGbLknAR) 的最新圖文分享！點擊展開觀看詳細心得與摘要，亦可直接點擊連結跳轉至 IG 看原文圖文討論...',
    date: '2026-08-08',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80'
  },
  'post-9years': {
    title: '【2026.08.01】擔任護理師的第 9 年，我還在！從成績倒數到公職護理師的心路歷程',
    summary: '2026.08.01 是我擔任護理師的第 9 年，今年我 31 歲，我還在！22 歲成績倒數的小屁孩，如今取得 N4 職級、公職護理師與臨床教師殊榮。只要還能行，我就會繼續堅守下去...',
    date: '2026-08-01',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80'
  },
  'post-salary100': {
    title: '【薪資公開】護理師如何達成年薪百萬？113 & 114 年連續達標的薪資結構拆解',
    summary: '護理師真的能領到年薪百萬嗎？公開公職護理師的薪資結構：本薪、專業加給、夜班津貼、年終與績效獎金，以及如何透過理性排班與存股打造百萬年收入...',
    date: '2026-02-15',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80'
  },
  'post-modely': {
    title: '【夢想清單】2030 擁有一台 Tesla Model Y！資產 90 天成長百萬的理財規劃',
    summary: '設定目標是實現夢想的第一步！分享我的 2030 買車目標：如何透過「淨資產 90 天成長百萬」的紀律記帳與指數化投資，按部就班往 Tesla Model Y 邁進...',
    date: '2026-06-10',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80'
  }
};

function isAbsoluteHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

// 只用來安全地放進 HTML 屬性 / 文字節點，避免文章資料裡萬一含有 < > " & 破壞 HTML 結構
function escapeForHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async (request, context) => {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/post\/([^/]+)\/?$/);

  // 非 /post/:id 網址：理論上 netlify.toml 的 path 設定已經只會讓這個 Function 在
  // /post/* 觸發，這裡再加一層防呆，確保萬一設定範圍比預期寬，也不會誤動其他頁面。
  if (!match) {
    return context.next();
  }

  const id = decodeURIComponent(match[1]);
  const article = STATIC_ARTICLES[id];

  // 不是目前已知的 5 篇靜態文章之一（可能是打錯字、或是 Firestore 自訂文章的 id）
  // → 完全不處理，交回原本既有的 SPA 行為，不猜測、不捏造內容。
  if (!article) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  // 防呆：只處理實際上是 HTML 的回應（避免誤動到非預期的回應類型）
  if (!contentType.includes('text/html')) {
    return response;
  }

  let html = await response.text();

  const articleUrl = `https://kainursinglife.com/post/${encodeURIComponent(id)}`;
  const safeTitle = escapeForHtml(article.title);
  const safeSummary = escapeForHtml(article.summary);
  const safePageTitle = escapeForHtml(`${article.title} | Kai 護理生活 & 理財投資筆記`);
  const hasValidImage = isAbsoluteHttpUrl(article.image);
  const safeImage = hasValidImage ? escapeForHtml(article.image) : null;

  // 以下每一處都用「函式當替換內容」而不是字串，避免文章資料裡萬一出現 $ 這類字元
  // 被 String.replace 誤判成特殊 replacement pattern（例如 $1、$&）。

  // 1. <title>
  html = html.replace(/<title>.*?<\/title>/, () => `<title>${safePageTitle}</title>`);

  // 2. meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    () => `<meta name="description" content="${safeSummary}">`
  );

  // 3. canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    () => `<link rel="canonical" href="${articleUrl}">`
  );

  // 4. Open Graph
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    () => `<meta property="og:title" content="${safeTitle}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    () => `<meta property="og:description" content="${safeSummary}">`
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*">/,
    () => `<meta property="og:type" content="article">`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    () => `<meta property="og:url" content="${articleUrl}">`
  );

  // 5. Twitter
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    () => `<meta name="twitter:title" content="${safeTitle}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    () => `<meta name="twitter:description" content="${safeSummary}">`
  );

  // 6. image（只有確認是完整 http/https URL 時才輸出；post-30years 的 "1.jpg" 會被跳過，
  //    維持首頁預設圖片，不產生錯誤或猜測的網址）
  if (hasValidImage) {
    html = html.replace(
      /<meta property="og:image" content="[^"]*">/,
      () => `<meta property="og:image" content="${safeImage}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="[^"]*">/,
      () => `<meta name="twitter:image" content="${safeImage}">`
    );
  }

  // 7. BlogPosting JSON-LD —— 新增獨立區塊，插入在既有 Person JSON-LD 的 </script> 之後，
  //    不修改、不刪除 Person schema 本身任何一個字元。
  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.summary,
    url: articleUrl,
    datePublished: article.date,
    author: { '@type': 'Person', name: 'Kai' }
  };
  if (hasValidImage) {
    blogPosting.image = article.image;
  }
  const jsonLdBlock = `\n    <script type="application/ld+json">\n    ${JSON.stringify(blogPosting)}\n    </script>`;

  html = html.replace(
    /(<!-- JSON-LD Structured Data for Person & Blog \(P1 Item\) -->[\s\S]*?<\/script>)/,
    (personBlock) => `${personBlock}${jsonLdBlock}`
  );

  const newHeaders = new Headers(response.headers);
  newHeaders.delete('content-length'); // 內容長度已改變，交給平台重新計算，避免長度不符

  return new Response(html, {
    status: response.status,
    headers: newHeaders
  });
};
