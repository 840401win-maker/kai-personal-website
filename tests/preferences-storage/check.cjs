const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const utils = fs.readFileSync(__dirname + '/utils.js', 'utf8');
const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(m => !m[0].includes('application/ld+json')).map(m => m[1]);
inline.forEach(s => new vm.Script(s));
new vm.Script(utils);
function functionSource(name) {
  const start = html.indexOf('function ' + name + '(');
  const open = html.indexOf('{', start);
  let depth = 1, end = open + 1;
  while (depth && end < html.length) { if (html[end] === '{') depth++; if (html[end] === '}') depth--; end++; }
  return html.slice(start, end);
}
let passed = 0;
function check(name, action) { action(); passed++; console.log('PASS ' + name); }
function context(data = {}, options = {}) {
  const state = { ...data }; const classes = new Set(); const listeners = {};
  const icon = { className: '' };
  const c = vm.createContext({
    localStorage: {
      getItem(key) { if (options.readDenied) throw new Error('SecurityError'); return state[key] ?? null; },
      setItem(key, value) { if (options.writeDenied) throw new Error('QuotaExceededError'); state[key] = value; }
    },
    window: { matchMedia: () => ({ matches: !!options.darkSystem }) },
    document: {
      documentElement: { classList: { add: x => classes.add(x), remove: x => classes.delete(x), toggle: x => { if (classes.has(x)) { classes.delete(x); return false; } classes.add(x); return true; } } },
      getElementById: id => id === 'themeIcon' ? icon : { addEventListener: (event, fn) => { listeners[event] = fn; } }
    },
    showToast() {}, renderPosts() { c.renderCount++; }, renderCount: 0
  });
  vm.runInContext(utils, c);
  vm.runInContext('showToast = function () {};', c);
  const init = html.match(/let userLikes = [^;]+;\s*let userBookmarks = [^;]+;/)[0];
  vm.runInContext(init + '\n' + functionSource('initTheme') + '\n' + functionSource('toggleLike') + '\n' + functionSource('toggleBookmark'), c);
  return { c, state, classes, listeners };
}
check('original malformed JSON reproduces initialization failure', () => assert.throws(() => JSON.parse('{broken'), SyntaxError));
for (const value of ['{broken', 'null', '[]', '42', '"text"']) {
  check('invalid preference is safe: ' + value, () => {
    const { c, state } = context({ kai_user_likes: value, kai_user_bookmarks: value });
    assert.equal(vm.runInContext('Object.keys(userLikes).length + Object.keys(userBookmarks).length', c), 0);
    assert.equal(state.kai_user_likes, value);
    vm.runInContext("toggleLike('post-30years'); toggleBookmark('post-9years');", c);
    assert.equal(c.renderCount, 2);
  });
}
check('valid existing likes/bookmarks persist and toggle correctly', () => {
  const { c, state } = context({ kai_user_likes: '{"post-30years":true}', kai_user_bookmarks: '{"post-9years":true}' });
  assert.equal(vm.runInContext("userLikes['post-30years'] && userBookmarks['post-9years']", c), true);
  vm.runInContext("toggleLike('post-30years'); toggleBookmark('post-9years');", c);
  assert.deepEqual(JSON.parse(state.kai_user_likes), {});
  assert.deepEqual(JSON.parse(state.kai_user_bookmarks), {});
});
check('inherited names and non-boolean values do not create phantom selections', () => {
  const { c } = context({ kai_user_likes: '{"valid":true,"bad":"false","no":false,"__proto__":true}' });
  assert.equal(vm.runInContext('userLikes.valid === true && userLikes.bad === undefined && userLikes.no === undefined && userLikes.toString === undefined && userLikes.__proto__ === true', c), true);
});
check('read-denied storage still initializes theme and in-memory actions', () => {
  const { c, classes } = context({}, { readDenied: true, darkSystem: true });
  vm.runInContext("initTheme(); toggleLike('post-30years');", c);
  assert.equal(classes.has('dark'), true); assert.equal(c.renderCount, 1);
});
check('storage getter throwing is contained', () => {
  const c = vm.createContext({});
  Object.defineProperty(c, 'localStorage', { get() { throw new Error('SecurityError'); } });
  vm.runInContext(utils, c);
  assert.equal(vm.runInContext('Object.keys(readStoredFlags("test")).length', c), 0);
  assert.equal(vm.runInContext('writeStoredPreference("test", "value")', c), false);
});
check('write-denied storage keeps theme and selections usable', () => {
  const { c, classes, listeners, state } = context({}, { writeDenied: true });
  vm.runInContext("initTheme(); toggleLike('post-30years'); toggleBookmark('post-9years');", c);
  listeners.click(); assert.equal(classes.has('dark'), true); assert.equal(c.renderCount, 2);
  assert.equal(vm.runInContext("userLikes['post-30years'] && userBookmarks['post-9years']", c), true);
  assert.deepEqual(state, {});
});
for (const theme of ['dark', 'light', '']) {
  check('existing theme retains precedence: ' + JSON.stringify(theme), () => {
    const { c, classes } = context({ theme }, { darkSystem: true });
    vm.runInContext('initTheme()', c); assert.equal(classes.has('dark'), theme === 'dark');
  });
}
console.log(passed + ' behavior checks passed; inline scripts and utils syntax passed');
