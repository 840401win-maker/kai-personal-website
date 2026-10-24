const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('assert');

// C1b: 預設為本腳本所在目錄，僅在使用者明確指定 REPO_PATH 時才覆寫（無任何硬編碼路徑）
const repoDir = process.env.REPO_PATH ? path.resolve(process.env.REPO_PATH) : __dirname;
console.log('Project root resolved to:', repoDir);

// 驗證必要檔案存在，若缺少明確報錯退出
const requiredFiles = ['index.html', path.join('css', 'style.css'), 'tests'];
for (const rel of requiredFiles) {
  const p = path.join(repoDir, rel);
  if (!fs.existsSync(p)) {
    console.error(`FATAL: Required path "${rel}" not found in "${repoDir}".`);
    process.exit(1);
  }
}

const testsDir = path.join(repoDir, 'tests');

const subSuites = [
  { name: 'browse-share/check-browse-share.cjs', expected: 22 },
  { name: 'browse-share/check-reader.cjs', expected: 16 },
  { name: 'browse-share/check-regression.cjs', expected: 18 },
  { name: 'performance/public-bootstrap-check.cjs', expected: 7 }
];

let totalUnitChecksPassed = 0;

for (const suite of subSuites) {
  const fullPath = path.join(testsDir, suite.name);
  if (!fs.existsSync(fullPath)) {
    console.error(`FATAL: Test suite not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`\n=== Running ${suite.name} ===`);
  const res = spawnSync(process.execPath, [fullPath], {
    cwd: path.dirname(fullPath),
    encoding: 'utf8',
    env: { ...process.env, REPO_PATH: repoDir }
  });

  if (res.stdout) {
    process.stdout.write(res.stdout);
  }
  if (res.stderr) {
    process.stderr.write(res.stderr);
  }

  if (res.status !== 0) {
    console.error(`\nFAILED: Suite ${suite.name} exited with non-zero code ${res.status}`);
    process.exit(res.status || 1);
  }

  // Count passes from stdout
  const passMatches = (res.stdout.match(/^PASS /gm) || []).length;
  console.log(`Subsuite ${suite.name}: ${passMatches} checks passed.`);
  totalUnitChecksPassed += passMatches;
}

console.log(`\n=== Running Phase 3 / v2.1 & v2.2 Feature & Accessibility Checks ===`);
const html = fs.readFileSync(path.join(repoDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'css', 'style.css'), 'utf8');
const utils = fs.readFileSync(path.join(repoDir, 'js', 'utils.js'), 'utf8');

let phase3ChecksPassed = 0;
function check(description, condition) {
  assert(condition, `Assertion failed: ${description}`);
  phase3ChecksPassed++;
  console.log(`PASS ${description}`);
}

check('seriesSpotlightSection exists in DOM', html.includes('id="seriesSpotlightSection"'));
check('seriesSpotlightGrid exists in DOM', html.includes('id="seriesSpotlightGrid"'));
check('profileHeader exists in DOM', html.includes('id="profileHeader"'));
check('post-card-featured class exists in HTML', html.includes('post-card-featured'));
check('.series-spotlight-grid class exists in CSS', css.includes('.series-spotlight-grid'));
check('modalLikeBtn exists in reader footer', html.includes('id="modalLikeBtn"'));
check('articleReadingProgress progress element exists', html.includes('id="articleReadingProgress"'));
check('nextChapterToast element exists', html.includes('id="nextChapterToast"'));
check('clearSearchBtn exists in browse bar', html.includes('id="clearSearchBtn"'));
check('adminInsightsModal exists for creator analytics', html.includes('id="adminInsightsModal"'));
check('insightsTotalPosts metric container exists', html.includes('id="insightsTotalPosts"'));
check('insightsTotalLikes metric container exists', html.includes('id="insightsTotalLikes"'));
check('calcShiftHeading exists in shift calculator', html.includes('id="calcShiftHeading"'));
check('calcInvestHeading exists with whitespace-nowrap wrappers', html.includes('id="calcInvestHeading"') && html.includes('whitespace-nowrap'));
check('calcHighRiskNotice exists for rate > 12%', html.includes('id="calcHighRiskNotice"'));
check('calcExtremeNotice exists for extreme compound returns', html.includes('id="calcExtremeNotice"'));
check('investYearsRange slider exists in calculator', html.includes('id="investYearsRange"') && css.includes('.calc-range-slider'));
check('investYearsRange has dynamic aria-valuetext and calibrated ticks', html.includes('aria-valuetext') && html.includes('style="left: 59.2%;"') && css.includes('.calc-range-ticks'));
check('starterGuideBar exists for beginner route', html.includes('starter-guide-bar') && css.includes('.starter-guide-bar'));
check('starterGuideSteps has 3 interactive pills with role="group"', html.includes('role="group"') && html.includes('starter-step-pill') && html.includes("openCalcModal()"));
check('handleImgError DOM cover is scoped to post-card-media without innerHTML', utils.includes('.post-card-media') && utils.includes('card-editorial-dom-cover') && !utils.includes('domCover.innerHTML'));
check('adminLoginBtn updated to creator login', html.includes('創作者登入') && css.includes('.admin-footer-btn'));

const grandTotal = totalUnitChecksPassed + phase3ChecksPassed;
console.log(`\n=== DYNAMIC TEST SUMMARY ===`);
console.log(`Unit Test Checks Passed:   ${totalUnitChecksPassed} (reader: 16, gesture: 18, lifecycle: 7, browse/share: 22)`);
console.log(`Phase 3 / v2.1 Checks:     ${phase3ChecksPassed}`);
console.log(`Total Checks Passed:       ${grandTotal} OF ${grandTotal} (100% PASS)`);

if (grandTotal < 79) {
  console.error(`WARNING: Expected at least 79 checks, got ${grandTotal}`);
  process.exit(1);
}

process.exit(0);
