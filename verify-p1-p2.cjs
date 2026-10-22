const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// C1b: 預設為本腳本所在目錄，僅在使用者明確指定 REPO_PATH 時才覆寫（無任何硬編碼路徑）
const repo = process.env.REPO_PATH ? path.resolve(process.env.REPO_PATH) : __dirname;
console.log('Project root resolved to:', repo);

if (!fs.existsSync(path.join(repo, 'index.html')) || !fs.existsSync(path.join(repo, 'css', 'style.css'))) {
  console.error(`FATAL: Required project files ("index.html", "css/style.css") not found in "${repo}".`);
  process.exit(1);
}

const outDir = __dirname;
const edge = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  let u = req.url.split('?')[0];
  if (u === '/' || u.startsWith('/post/')) u = '/index.html';
  const fp = path.join(repo, u);
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

(async () => {
  await new Promise(r => srv.listen(8148, '127.0.0.1', r));
  const URL = 'http://127.0.0.1:8148/';
  const tempProfile = path.join(process.env.TEMP || '.', 'cdp-profile-v21-final-' + Date.now());
  const proc = spawn(edge, ['--headless=new', '--disable-gpu', '--remote-debugging-port=9348', '--user-data-dir=' + tempProfile, 'about:blank'], { stdio: 'ignore' });
  let ver;
  for (let i = 0; i < 40; i++) { try { ver = await (await fetch('http://127.0.0.1:9348/json/version')).json(); break; } catch { await sleep(200); } }
  if (!ver) throw new Error('browser not up');

  async function withPage({ w, h, mobile, initialUrl }, fn) {
    const tgt = await (await fetch('http://127.0.0.1:9348/json/new?about:blank', { method: 'PUT' })).json();
    const ws = new WebSocket(tgt.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    let id = 0; const pending = new Map();
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || m.error); pending.delete(m.id); }
    });
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) console.error('EVAL EXCEPTION:', res.exceptionDetails);
      return res.result?.value;
    };
    const snap = async (name) => {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(path.join(outDir, name + '.png'), buf);
      if (process.env.ARTIFACT_DIR && fs.existsSync(process.env.ARTIFACT_DIR)) {
        fs.writeFileSync(path.join(process.env.ARTIFACT_DIR, name + '.png'), buf);
      }
    };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: !!mobile });
    await send('Page.navigate', { url: initialUrl || URL });
    await sleep(2200);
    const result = await fn({ send, ev, snap });
    ws.close();
    await fetch('http://127.0.0.1:9348/json/close/' + tgt.id);
    return result;
  }

  console.log('=== Test A1 & A2 & B3: Data Center Integrity & Real DOM renderAdminInsights ===');
  await withPage({ w: 1280, h: 900, mobile: false }, async ({ ev, snap }) => {
    // Clear storage for zero-base clean visitor
    await ev(`localStorage.clear(); sessionStorage.clear(); userReadingProgress = {}; userLikes = {}; userBookmarks = {}; renderPosts();`);
    await ev(`window.dispatchEvent(new CustomEvent('auth-changed', { detail: { isAdmin: true } }));`);
    await sleep(400);
    await ev(`openAdminInsightsModal();`);
    await sleep(400);

    const initialStats = await ev(`(() => ({
      posts: document.getElementById('insightsTotalPosts').innerText,
      likes: document.getElementById('insightsTotalLikes').innerText,
      bookmarks: document.getElementById('insightsTotalBookmarks').innerText,
      views: document.getElementById('insightsTotalViews').innerText,
      rankingCount: document.querySelectorAll('#insightsRankingList .insights-rank-item').length,
      hasHint: document.getElementById('insightsRankingList').innerText.includes('尚無讀者按讚'),
      rankingTitle: document.getElementById('insightsRankingTitle').innerText,
      badgeText: document.querySelector('.insights-rank-badge').innerText,
      likesScopeNote: document.querySelector('.insights-stats-grid .insights-stat-card:nth-child(2) span:nth-child(3)').innerText
    }))()`);
    console.log('Initial Insights Stats (Zero base):', initialStats);
    assert.strictEqual(initialStats.likes, '0', 'Initial likes must be 0');
    assert.strictEqual(initialStats.views, '0', 'Initial views must be 0 (no fake formula)');
    assert.strictEqual(initialStats.hasHint, true, 'Zero likes should display recommendation banner');
    assert(initialStats.rankingTitle.includes('精選推薦文章排序'), '0 likes ranking title must be editorial recommendation');
    assert.strictEqual(initialStats.badgeText, '1', '0 likes badge must be neutral number, not medal');
    assert(initialStats.likesScopeNote.includes('文章基底讚數＋本裝置互動，非全站即時統計'), 'A2 scope note must accurately disclose base + local');

    // B3: Test real renderAdminInsights directly in page DOM (not isolated test copy)
    const domSortResult = await ev(`(() => {
      const orig = [...postsData];
      postsData = [
        { id: 'post-old', title: 'Old 2020 Article', featured: false, date: '2020-01-01', likes: 0, category: 'nursing' },
        { id: 'post-new', title: 'New 2025 Article', date: '2025-01-01', likes: 0, category: 'finance' } // featured undefined
      ];
      renderAdminInsights();
      const firstTitle = document.querySelector('#insightsRankingList .insights-rank-title').innerText;
      postsData = orig; // restore
      renderAdminInsights();
      return firstTitle;
    })()`);
    console.log('Real DOM renderAdminInsights tiebreaker test: winner is', domSortResult);
    assert.strictEqual(domSortResult, 'New 2025 Article', '2025 article must win in real renderAdminInsights');

    await snap('v2-p1p2-insights-desktop-1280');
  });

  console.log('=== Test A3: Unified 85% Toast Qualification Gate ===');
  await withPage({ w: 375, h: 812, mobile: true }, async ({ ev }) => {
    await ev(`openPostModal(postsData[0].id);`);
    await sleep(500);

    const toastHiddenInitially = await ev(`(() => {
      const toast = document.getElementById('nextChapterToast');
      return !toast || toast.classList.contains('hidden');
    })()`);
    console.log('Toast hidden at scrollTop = 0:', toastHiddenInitially);
    assert.strictEqual(toastHiddenInitially, true, 'Toast must never show when reader has not scrolled');

    await ev(`showNextChapterToast()`);
    const toastStillHidden = await ev(`document.getElementById('nextChapterToast').classList.contains('hidden')`);
    console.log('Toast still hidden when calling showNextChapterToast at top:', toastStillHidden);
    assert.strictEqual(toastStillHidden, true, 'showNextChapterToast must be gated by canShowNextChapterToast');

    await ev(`document.getElementById('modalBody').scrollTo({ top: 3000, behavior: 'instant' });`);
    await sleep(500);
    const toastVisibleAfterScroll = await ev(`(() => {
      const toast = document.getElementById('nextChapterToast');
      return toast && !toast.classList.contains('hidden');
    })()`);
    console.log('Toast visible after actual 85%+ scroll:', toastVisibleAfterScroll);
    assert.strictEqual(toastVisibleAfterScroll, true, 'Toast should appear when qualified');
  });

  console.log('=== Test B1: Calculator Editing vs Blur Consistency & Finite Safety ===');
  await withPage({ w: 375, h: 812, mobile: true }, async ({ ev, snap }) => {
    await ev(`openCalcModal();`);
    await sleep(500);

    // 1. Editing rate > 20%: must display '--' and warning (no secret clamp while typing)
    await ev(`document.getElementById('investRate').value = '30'; calculateSalary();`);
    const typing30Result = await ev(`document.getElementById('investResult').innerText`);
    const typing30Notice = await ev(`document.getElementById('investPrincipalBreakdown').innerText`);
    console.log('Typing 30% rate result:', typing30Result, '| notice:', typing30Notice);
    assert.strictEqual(typing30Result, '--', 'Editing rate 30% must display -- (no hidden clamping)');
    assert(typing30Notice.includes('上限為 20%'), 'Editing rate 30% must display friendly limit notice');

    // On blur: normalizes to 20% and computes valid figure
    await ev(`normalizeCalculatorInputs();`);
    const blurred30Result = await ev(`document.getElementById('investResult').innerText`);
    const blurred30Rate = await ev(`document.getElementById('investRate').value`);
    console.log('Blurred 30% normalized to rate:', blurred30Rate, 'with valid result:', blurred30Result);
    assert.strictEqual(blurred30Rate, '20', 'Blur must normalize 30% to 20%');
    assert.notStrictEqual(blurred30Result, '--', 'Normalized rate must produce valid result');

    // 2. Editing years > 50: must display '--'
    await ev(`document.getElementById('investYears').value = '100'; calculateSalary();`);
    const typing100Result = await ev(`document.getElementById('investResult').innerText`);
    console.log('Typing 100 years result:', typing100Result);
    assert.strictEqual(typing100Result, '--', 'Editing 100 years must display --');
    await ev(`normalizeCalculatorInputs();`);
    const blurred100Years = await ev(`document.getElementById('investYears').value`);
    assert.strictEqual(blurred100Years, '50', 'Blur must normalize 100 years to 50');

    // 3. Editing decimal years 0.1 and 1.9: must display '--'
    await ev(`document.getElementById('investYears').value = '0.1'; calculateSalary();`);
    const decimal01Result = await ev(`document.getElementById('investResult').innerText`);
    assert.strictEqual(decimal01Result, '--', 'Editing 0.1 year must display --');
    await ev(`normalizeCalculatorInputs();`);
    assert.strictEqual(await ev(`document.getElementById('investYears').value`), '1', 'Blur on 0.1 year must normalize to 1');

    await ev(`document.getElementById('investYears').value = '1.9'; calculateSalary();`);
    assert.strictEqual(await ev(`document.getElementById('investResult').innerText`), '--', 'Editing 1.9 year must display --');
    await ev(`normalizeCalculatorInputs();`);
    assert.strictEqual(await ev(`document.getElementById('investYears').value`), '2', 'Blur on 1.9 year must round to 2');

    // 4. 0% rate test: monthly 15,000, 0%, 5 years -> Total: 900,000, Gain: 0
    await ev(`
      document.getElementById('monthlyInvest').value = '15000';
      document.getElementById('investRate').value = '0';
      document.getElementById('investYears').value = '5';
      calculateSalary();
    `);
    const zeroRateResult = await ev(`document.getElementById('investResult').innerText`);
    const zeroRateGain = await ev(`document.getElementById('investPrincipalBreakdown').innerText`);
    console.log('0% Rate Test - Total:', zeroRateResult, 'Breakdown:', zeroRateGain);
    assert.strictEqual(zeroRateResult, '900,000', '0% rate for 5yr 15k/mo must be 900,000');
    assert(zeroRateGain.includes('+$0'), '0% rate gain must be +$0');

    // 5. Number.isFinite check with extreme overflow input
    await ev(`document.getElementById('monthlyInvest').value = '1e300'; calculateSalary();`);
    const overflowResult = await ev(`document.getElementById('investResult').innerText`);
    console.log('Overflow input result:', overflowResult);
    assert.strictEqual(overflowResult, '--', 'Overflow input must safely display -- (no Infinity)');

    // Restore standard
    await ev(`
      document.getElementById('monthlyInvest').value = '15000';
      document.getElementById('investRate').value = '6';
      document.getElementById('investYears').value = '5';
      calculateSalary();
    `);

    // 6. Test B2 exact pill matching
    await ev(`document.getElementById('investRate').value = '14'; calculateSalary();`);
    const pill4ActiveWith14 = await ev(`document.querySelector('.calc-pill-btn[data-rate="4"]').classList.contains('is-active')`);
    assert.strictEqual(pill4ActiveWith14, false, '14% must not trigger 4% pill active state');

    await snap('v2-p1p2-calc-mobile-375');
  });

  console.log('=== Test Deep-Link Return Retention with Prior External History ===');
  await withPage({ w: 375, h: 812, mobile: true }, async ({ ev, snap }) => {
    // Simulate user navigating from Instagram/external search to article
    await ev(`
      history.pushState({ external: 'instagram' }, '', '/fake-external-referrer');
      history.pushState({ page: 'article' }, '', '/post/post-9years');
      initRouting();
    `);
    await sleep(500);

    const isModalOpen = await ev(`!document.getElementById('postModal').classList.contains('opacity-0')`);
    console.log('Is article opened via simulated external link:', isModalOpen);
    assert.strictEqual(isModalOpen, true, 'Article modal must open');

    // Click back button
    await ev(`document.querySelector('.reader-back-btn').click();`);
    await sleep(400);

    const pathAfterReturn = await ev(`window.location.pathname`);
    const isModalClosed = await ev(`document.getElementById('postModal').classList.contains('opacity-0')`);
    console.log('Path after return with external history:', pathAfterReturn, '| Modal closed:', isModalClosed);
    assert.strictEqual(pathAfterReturn, '/', 'Closing article from deep-link must retain reader on homepage /');
    assert.strictEqual(isModalClosed, true, 'Article modal must close');

    await snap('v2-p1p2-deeplink-return');
  });

  console.log('=== Test Mobile Reader Like Duplicate Fix & Mystery Element Identification ===');
  await withPage({ w: 375, h: 812, mobile: true }, async ({ ev, snap }) => {
    // 1. Verify reader like button does NOT display "讚 按讚"
    await ev(`openPostModal(postsData[0].id);`);
    await sleep(400);
    const likeBtnText = await ev(`document.getElementById('modalLikeBtn').innerText.trim()`);
    console.log('Reader footer like button text on 0 likes:', JSON.stringify(likeBtnText));
    assert.strictEqual(likeBtnText, '按讚', '0 likes reader footer button must be "按讚", never "讚 按讚"');

    // 2. Identify element at (x=40, y=115) behind login modal
    await ev(`closePostModal(true); openLoginModal();`);
    await sleep(400);
    const circleIdentification = await ev(`(() => {
      // Find element behind backdrop at (40, 115)
      const modal = document.getElementById('loginModal');
      modal.style.display = 'none';
      const el = document.elementFromPoint(40, 115);
      const res = {
        tag: el ? el.tagName : null,
        src: el ? el.getAttribute('src') : null,
        alt: el ? el.getAttribute('alt') : null,
        className: el ? el.className : null
      };
      modal.style.display = '';
      return res;
    })()`);
    console.log('Element identified at (40, 115) behind login modal:', circleIdentification);
    assert.strictEqual(circleIdentification.tag, 'IMG', 'Element at (40, 115) is an IMG element');
    assert(circleIdentification.alt.includes('大頭貼'), 'Element at (40, 115) is Kai profile header avatar');

    await snap('v2-p1p2-login-mobile-375');
  });

  srv.close();
  proc.kill();

  console.log('\n=== ALL P1 & P2 AUDIT FIXES VERIFIED SUCCESSFULLY (100% PASS) ===');
  process.exit(0);
})().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
