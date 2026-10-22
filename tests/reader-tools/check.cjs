const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const utils=fs.readFileSync(__dirname+'/../preferences-storage/utils.js','utf8');
for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!m[1].includes('src=')&&!m[1].includes('application/ld+json'))new vm.Script(m[2]);
const globals=html.match(/const ARTICLE_FONT_SIZES = [\s\S]*?let articleContentObserver = null;/)[0];
const functions=html.slice(html.indexOf('function updateArticleReadingProgress()'),html.indexOf('function setupKeyboardAndTouchEvents()'));
function harness(options={}){
 const state={...options.preferences},queue=[],listeners={},windowListeners={},style={},scrolls=[],observers=[];
 let frameId=0,reads=0,open=options.open!==false;
 const buttons=['standard','large','largest'].map(size=>({dataset:{readerSize:size},attributes:{},setAttribute(k,v){this.attributes[k]=v;}}));
 const body={scrollTop:0,_height:100,_scrollHeight:500,children:[{},{}],style:{setProperty:(k,v)=>style[k]=v},
 get clientHeight(){reads++;return this._height;},get scrollHeight(){reads++;return this._scrollHeight;},
 addEventListener:(name,fn,opts)=>{(listeners[name] ||= []).push({fn,opts});},scrollTo:opts=>{scrolls.push(opts);body.scrollTop=opts.top;}};
 const progress={value:0,textContent:'0%'},label={textContent:'0%'};
 const nodes={postModal:{classList:{contains:()=>!open}},modalBody:body,articleReadingProgress:progress,articleReadingProgressText:label};
 const sandbox={document:{getElementById:id=>nodes[id],querySelectorAll:()=>buttons},window:{addEventListener:(n,f,o)=>{(windowListeners[n] ||= []).push({fn:f,opts:o});},matchMedia:()=>({matches:!!options.reducedMotion})},
 localStorage:{getItem:k=>{if(options.readDenied)throw Error('SecurityError');return state[k]??null;},setItem:(k,v)=>{if(options.writeDenied)throw Error('QuotaExceededError');state[k]=v;}},
 requestAnimationFrame:fn=>{queue.push(fn);return ++frameId;}};
 if(!options.noObserver)sandbox.ResizeObserver=class{constructor(fn){this.fn=fn;this.observed=[];this.disconnects=0;observers.push(this);}observe(node){this.observed.push(node);}disconnect(){this.observed=[];this.disconnects++;}};
 const c=vm.createContext(sandbox);vm.runInContext(utils,c);vm.runInContext(globals+'\n'+functions,c);
 const flush=()=>{while(queue.length)queue.shift()();};
 return {c,state,buttons,style,body,progress,label,queue,scrolls,observers,listeners,windowListeners,flush,reads:()=>reads,setOpen:v=>open=v};
}
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('default size and one selected accessible button',()=>{const h=harness();h.c.setupArticleReadingControls();assert.equal(h.style['--article-font-size'],'1rem');assert.deepEqual(h.buttons.map(b=>b.attributes['aria-pressed']),['true','false','false']);assert.deepEqual(h.state,{});});
test('font choice persists and reload restores it without extra writes',()=>{const h=harness();h.c.setArticleFontSize('large');assert.equal(h.state.kai_article_font_size,'large');const next=harness({preferences:h.state});next.c.setupArticleReadingControls();assert.equal(next.style['--article-font-size'],'1.125rem');assert.deepEqual(next.state,h.state);});
test('largest size is20px at the default root and updates selected state',()=>{const h=harness();h.c.setArticleFontSize('largest');assert.equal(h.style['--article-font-size'],'1.25rem');assert.equal(h.buttons[2].attributes['aria-pressed'],'true');});
test('corrupt or prototype-like stored values select standard safely',()=>{for(const value of ['garbage','__proto__','toString']){const h=harness({preferences:{kai_article_font_size:value}});h.c.setupArticleReadingControls();assert.equal(h.style['--article-font-size'],'1rem');assert.equal(h.state.kai_article_font_size,value);}});
test('storage access denial still allows current-page font choice',()=>{const h=harness({readDenied:true,writeDenied:true});h.c.setupArticleReadingControls();h.c.setArticleFontSize('largest');assert.equal(h.style['--article-font-size'],'1.25rem');assert.deepEqual(h.state,{});});
test('font change does not forcibly scroll the article to the top',()=>{const h=harness();h.body.scrollTop=200;h.c.setArticleFontSize('large');assert.equal(h.body.scrollTop,200);assert.equal(h.scrolls.length,0);});
test('many scroll events coalesce into one frame using latest position',()=>{const h=harness();h.c.setupArticleReadingControls();h.flush();for(let i=0;i<20;i++){h.body.scrollTop=i*10;h.listeners.scroll[0].fn();}assert.equal(h.queue.length,1);h.body.scrollTop=200;h.flush();assert.equal(h.progress.value,50);assert.equal(h.label.textContent,'50%');});
test('elastic overscroll is bounded between0 and100',()=>{const h=harness();h.body.scrollTop=-60;h.c.updateArticleReadingProgress();assert.equal(h.progress.value,0);h.body.scrollTop=800;h.c.updateArticleReadingProgress();assert.equal(h.progress.value,100);});
test('short article entirely visible reports100 without division by zero',()=>{const h=harness();h.body._scrollHeight=80;h.c.updateArticleReadingProgress();assert.equal(h.progress.value,100);});
test('zero-height article reports0',()=>{const h=harness();h.body._height=0;h.c.updateArticleReadingProgress();assert.equal(h.progress.value,0);});
test('closed article avoids scroll geometry reads',()=>{const h=harness({open:false});h.c.setupArticleReadingControls();h.flush();assert.equal(h.reads(),0);});
test('image load and viewport changes refresh scroll position',()=>{const h=harness();h.c.setupArticleReadingControls();h.body.scrollTop=200;h.flush();assert.equal(h.progress.value,50);h.body._scrollHeight=900;assert.equal(h.listeners.load[0].opts,true);h.listeners.load[0].fn();h.flush();assert.equal(h.progress.value,25);h.body._height=500;h.windowListeners.resize[0].fn();h.flush();assert.equal(h.progress.value,50);});
test('observer drops old article nodes when another article opens',()=>{const h=harness();h.c.setupArticleReadingControls();h.c.observeArticleReadingContent();const old=h.observers[0].observed[1];h.body.children=[{}];h.c.observeArticleReadingContent();assert.equal(h.observers[0].disconnects,2);assert.equal(h.observers[0].observed.includes(old),false);assert.equal(h.observers[0].observed.length,2);});
test('controls initialize once without duplicate listeners or observers',()=>{const h=harness();h.c.setupArticleReadingControls();h.c.setupArticleReadingControls();assert.equal(h.listeners.scroll.length,1);assert.equal(h.listeners.load.length,1);assert.equal(h.windowListeners.resize.length,1);assert.equal(h.observers.length,1);assert.equal(h.listeners.scroll[0].opts.passive,true);});
test('progress works when ResizeObserver is unavailable',()=>{const h=harness({noObserver:true});h.c.setupArticleReadingControls();h.c.observeArticleReadingContent();h.body.scrollTop=100;h.flush();assert.equal(h.progress.value,25);});
test('back-to-top respects reduced motion',()=>{for(const reduced of [true,false]){const h=harness({reducedMotion:reduced});h.c.scrollArticleToTop();assert.equal(h.scrolls[0].behavior,reduced?'auto':'smooth');assert.equal(h.scrolls[0].top,0);}});
console.log(passed+' reader behavior checks and inline syntax passed; real layout and browser interaction remain pending.');
