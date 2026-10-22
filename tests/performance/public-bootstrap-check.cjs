const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname+'/public-bootstrap-index.html','utf8');
const inline = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')&&!m[1].includes('application/ld+json')).map(m=>m[2]).join('\n');
new vm.Script(inline);
const publicCalls=['initTheme','renderSubTags','renderPosts','setupScrollListener','calculateSalary','setupKeyboardAndTouchEvents','applySiteLogo'];
const hook='// All page elements and handlers above are ready here.';
assert.equal(inline.includes(hook),true);
function scenario(initialFb) {
  const calls=[], winListeners={}, docListeners={};
  const add=(map,type,fn,opts)=>{(map[type] ||= []).push({fn,once:opts?.once});};
  const emit=(map,type)=>{for(const entry of [...(map[type]||[])]) {entry.fn({detail:{isAdmin:false}});if(entry.once)map[type]=map[type].filter(x=>x!==entry);}};
  const c=vm.createContext({window:{fb:initialFb,addEventListener:(t,f,o)=>add(winListeners,t,f,o)},document:{addEventListener:(t,f,o)=>add(docListeners,t,f,o)},readStoredFlags:()=>Object.create(null),calls,console});
  const spies=publicCalls.concat(['initRouting','startFirestoreSync']).map(name=>name+' = function(){ calls.push('+JSON.stringify(name)+'); };').join('\n');
  vm.runInContext(inline.replace(hook,spies+'\n        '+hook),c);
  return {calls,c,dom:()=>emit(docListeners,'DOMContentLoaded'),ready:()=>emit(winListeners,'fb-ready'),winListeners};
}
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
check('public UI initializes before DOMContentLoaded with SDK absent',()=>{const s=scenario();assert.deepEqual(s.calls,publicCalls);});
check('missing SDK does not start routing timeout or Firestore early',()=>{const s=scenario();assert.equal(s.calls.includes('initRouting'),false);assert.equal(s.calls.includes('startFirestoreSync'),false);});
check('delayed SDK starts sync once after DOM ready',()=>{const s=scenario();s.dom();assert.deepEqual(s.calls,[...publicCalls,'initRouting']);s.c.window.fb={};s.ready();s.ready();assert.deepEqual(s.calls,[...publicCalls,'initRouting','startFirestoreSync']);});
check('SDK already ready preserves routing then sync order',()=>{const s=scenario({});s.dom();assert.deepEqual(s.calls,[...publicCalls,'initRouting','startFirestoreSync']);s.ready();assert.equal(s.calls.filter(x=>x==='startFirestoreSync').length,1);});
check('SDK ready before DOM uses ready state without duplicate public initialization',()=>{const s=scenario();s.c.window.fb={};s.ready();s.dom();assert.deepEqual(s.calls,[...publicCalls,'initRouting','startFirestoreSync']);});
check('auth event listener registered before public UI bootstrap',()=>{const s=scenario();assert.equal(s.winListeners['auth-changed'].length,1);});
check('all existing page elements precede bootstrap script',()=>{const firstPublic=html.lastIndexOf('// All page elements');for(const id of ['postsGrid','emptyState','themeIcon','themeToggle','searchInput','backToTop','postModal','addPostModal'])assert.ok(html.indexOf('id="'+id+'"')<firstPublic);});
console.log(passed+' lifecycle checks and inline syntax passed. DOM rendering and measured speed require preview validation.');
