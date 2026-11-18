const assert = require('node:assert/strict');

const BASE_URL = 'https://kai-personal-website.netlify.app';
const REPORT_ONLY = process.argv.includes('--report-only');

async function checkEndpoint(label, checkFn) {
  try {
    const detail = await checkFn();
    return { label, status: 'LIVE', detail };
  } catch (err) {
    return { label, status: 'PENDING_NETLIFY_DEPLOY', detail: err.message };
  }
}

async function fetchText(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { 'Cache-Control': 'no-cache' } });
  assert.equal(res.status, 200, `HTTP ${res.status}`);
  return await res.text();
}

async function fetchHead(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'HEAD', headers: { 'Cache-Control': 'no-cache' } });
  return { status: res.status, contentType: res.headers.get('content-type') || '' };
}

(async () => {
  const results = [];

  results.push(await checkEndpoint('Home <meta og:image> = og-brand-home.jpg', async () => {
    const html = await fetchText('/');
    const m = html.match(/<meta property="og:image" content="([^"]+)"/);
    const img = m ? m[1] : '(missing)';
    assert(img.includes('og-brand-home.jpg'), `actual: ${img}`);
    return img;
  }));

  results.push(await checkEndpoint('Asset /assets/covers/og-brand-home.jpg (image/jpeg)', async () => {
    const { status, contentType } = await fetchHead('/assets/covers/og-brand-home.jpg');
    assert.equal(status, 200, `HTTP ${status}`);
    assert(contentType.includes('image/jpeg'), `Content-Type: ${contentType}`);
    return contentType;
  }));

  for (const name of ['cover-ig-archive.webp', 'cover-9years.webp', 'cover-salary100.webp', 'cover-modely.webp']) {
    results.push(await checkEndpoint(`Asset /assets/covers/${name} (image/webp)`, async () => {
      const { status, contentType } = await fetchHead(`/assets/covers/${name}`);
      assert.equal(status, 200, `HTTP ${status}`);
      assert(contentType.includes('image/webp'), `Content-Type: ${contentType}`);
      return contentType;
    }));
  }

  results.push(await checkEndpoint('Edge Meta /post/post-modely og:image = cover-modely.webp', async () => {
    const html = await fetchText('/post/post-modely');
    const m = html.match(/<meta property="og:image" content="([^"]+)"/);
    const img = m ? m[1] : '(missing)';
    assert(img.includes('cover-modely.webp'), `actual: ${img}`);
    return img;
  }));

  results.push(await checkEndpoint('Edge Meta dynamic Firestore /post/JEdxU4Mrihz9qg3cpYnr', async () => {
    const html = await fetchText('/post/JEdxU4Mrihz9qg3cpYnr');
    const m = html.match(/<meta property="og:title" content="([^"]+)"/);
    const title = m ? m[1] : '(missing)';
    assert(title.includes('300 萬'), `actual: ${title}`);
    return title;
  }));

  results.push(await checkEndpoint('/js/admin-cms.js has window.KaiCMS & highlights', async () => {
    const js = await fetchText('/js/admin-cms.js');
    assert(js.includes('window.KaiCMS = KaiCMS'), 'missing window.KaiCMS');
    assert(js.includes('id="newHighlights"'), 'missing newHighlights');
    return 'window.KaiCMS + newHighlights';
  }));

  results.push(await checkEndpoint('/js/firestore-read.js has replacesStaticId dedup', async () => {
    const js = await fetchText('/js/firestore-read.js');
    assert(js.includes('replacesStaticId'), 'missing replacesStaticId');
    return 'replacesStaticId';
  }));

  results.push(await checkEndpoint('/js/firebase.js has GA4 trackSiteEvent', async () => {
    const js = await fetchText('/js/firebase.js');
    assert(js.includes('trackSiteEvent'), 'missing trackSiteEvent');
    return 'trackSiteEvent';
  }));

  console.log('\n=== LIVE NETLIFY DEPLOY STATUS REPORT ===');
  let pendingCount = 0;
  for (const r of results) {
    if (r.status !== 'LIVE') pendingCount++;
    console.log(`[${r.status}] ${r.label} -> ${r.detail}`);
  }
  console.log(`\nSummary: ${results.length - pendingCount}/${results.length} LIVE, ${pendingCount} PENDING_NETLIFY_DEPLOY\n`);

  if (!REPORT_ONLY && pendingCount > 0) {
    process.exitCode = 1;
  }
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
