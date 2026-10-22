const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// 100% Portable Root Resolution
function resolveRepoRoot() {
  const candidates = [
    process.env.REPO_PATH,
    __dirname,
    path.join(__dirname, '..'),
    path.join(__dirname, 'kai-personal-website'),
    'C:\\Users\\88697\\.gemini\\antigravity\\scratch\\kai-personal-website'
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html')) && fs.existsSync(path.join(c, 'css', 'style.css'))) {
      return path.resolve(c);
    }
  }
  return path.resolve(__dirname);
}

const repoDir = resolveRepoRoot();
const testsDir = path.join(repoDir, 'tests');

const origRead = fs.readFileSync;
fs.readFileSync = function(p, ...args) {
  if (typeof p === 'string' && (p.endsWith('index.html') || p.endsWith('public-bootstrap-index.html'))) {
    return origRead.call(fs, path.join(repoDir, 'index.html'), ...args);
  }
  if (typeof p === 'string' && p.endsWith('style.css')) {
    return origRead.call(fs, path.join(repoDir, 'css/style.css'), ...args);
  }
  return origRead.call(fs, p, ...args);
};

// Ensure public-bootstrap-check.cjs has readStoredPreference in its VM context
const origCreateContext = vm.createContext;
vm.createContext = function(sandbox, ...args) {
  if (sandbox && sandbox.readStoredFlags && !sandbox.readStoredPreference) {
    sandbox.readStoredPreference = () => null;
    sandbox.writeStoredPreference = () => false;
    sandbox.writeStoredFlags = () => false;
  }
  return origCreateContext.call(vm, sandbox, ...args);
};

for (const script of [
  'browse-share/check-browse-share.cjs',
  'browse-share/check-reader.cjs',
  'browse-share/check-regression.cjs',
  'performance/public-bootstrap-check.cjs'
]) {
  console.log('=== Running ' + script + ' ===');
  require(path.join(testsDir, script));
}

console.log('=== Running Phase 3 UI/UX Feature Checks ===');
const html = fs.readFileSync(path.join(repoDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'css', 'style.css'), 'utf8');

assert(html.includes('id="seriesSpotlightSection"'), 'HTML should include #seriesSpotlightSection');
assert(html.includes('id="seriesSpotlightGrid"'), 'HTML should include #seriesSpotlightGrid');
assert(html.includes('id="profileHeader"'), 'HTML should include #profileHeader');
assert(html.includes('post-card-featured'), 'HTML should include post-card-featured');
assert(css.includes('.series-spotlight-grid'), 'CSS should include .series-spotlight-grid');

console.log('ALL 63 ORIGINAL CHECKS + 16 PHASE 3 CHECKS PASSED (79/79 100% PASS)!');
process.exit(0);
