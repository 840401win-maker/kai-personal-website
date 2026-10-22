const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) if(!m[1].includes('src=')&&!m[1].includes('application/ld+json')) new vm.Script(m[2]);
const start=html.indexOf('function setupKeyboardAndTouchEvents()');
const end=html.indexOf('function closePostModal()',start);
const source=html.slice(start,end);
function harness(){
 const listeners={},keys={},moves=[],closed=[];
 const modal={classList:{contains:()=>false}};
 const body={addEventListener:(name,fn,options)=>{assert.equal(options.passive,true);listeners[name]=fn;}};
 const c=vm.createContext({setupArticleReadingControls(){},document:{getElementById:id=>id==='modalBody'?body:modal,addEventListener:(name,fn)=>keys[name]=fn},changeCarousel:n=>moves.push(n),closeImageLightbox:()=>closed.push('lightbox'),closePostModal:()=>closed.push('post'),closeAboutModal(){},closeCalcModal(){},closeAddPostModal(){},closeLoginModal(){}});
 vm.runInContext(source+'\nsetupKeyboardAndTouchEvents();',c);
 const target=region=>({closest:s=>s==='#carouselImageContainer'?(region==='text'?null:{}):(region==='button'||region==='thumbnail'?{}:null)});
 const point=(x,y,id=1)=>({clientX:x,clientY:y,identifier:id});
 return {listeners,moves,keys,closed,begin:(region='image',points=[point(200,200)])=>listeners.touchstart({target:target(region),touches:points}),end:(x,y,id=1,touches=[])=>listeners.touchend({touches,changedTouches:[point(x,y,id)]}),point};
}
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
for(const [name,region,x,y,expected] of [
 ['left swipe on image','image',100,205,[1]],
 ['right swipe on image','image',300,195,[-1]],
 ['vertical image scroll','image',180,30,[]],
 ['diagonal reading scroll','image',120,40,[]],
 ['ambiguous diagonal','image',120,130,[]],
 ['horizontal movement in article text','text',80,200,[]],
 ['native thumbnail strip scroll','thumbnail',80,200,[]],
 ['button gesture does not also switch slide','button',80,200,[]],
 ['short movement','image',160,200,[]]
]) test(name,()=>{const h=harness();h.begin(region);h.end(x,y);assert.deepEqual(h.moves,expected);});
test('pinch start does not switch slides',()=>{const h=harness();h.begin('image',[h.point(200,200),h.point(240,240,2)]);h.end(80,200);assert.deepEqual(h.moves,[]);});
test('adding a second finger cancels a pending swipe',()=>{const h=harness();h.begin();h.begin('image',[h.point(200,200),h.point(240,240,2)]);h.end(80,200);assert.deepEqual(h.moves,[]);});
test('touch cancellation clears pending swipe',()=>{const h=harness();h.begin();h.listeners.touchcancel();h.end(80,200);assert.deepEqual(h.moves,[]);});
test('different touch identifier cannot finish swipe',()=>{const h=harness();h.begin();h.end(80,200,2);assert.deepEqual(h.moves,[]);});
test('remaining finger prevents slide change',()=>{const h=harness();h.begin();h.end(80,200,1,[h.point(80,200,2)]);assert.deepEqual(h.moves,[]);});
test('end without start is ignored',()=>{const h=harness();h.end(80,200);assert.deepEqual(h.moves,[]);});
test('one swipe changes one slide only',()=>{const h=harness();h.begin();h.end(80,200);h.end(80,200);assert.deepEqual(h.moves,[1]);});
test('existing keyboard left/right behavior remains',()=>{const h=harness();h.keys.keydown({key:'ArrowLeft'});h.keys.keydown({key:'ArrowRight'});assert.deepEqual(h.moves,[-1,1]);});
test('enlarged image exposes exit control and toggles accessibility state',()=>{
 const classes=new Set(),imageClasses=new Set(),exitClasses=new Set(['hidden']),attrs={};
 const list=set=>({add:(...v)=>v.forEach(x=>set.add(x)),remove:(...v)=>v.forEach(x=>set.delete(x)),toggle:(x,on)=>on?set.add(x):set.delete(x)});
 const wrapper={classList:list(new Set())};
 const container={classList:list(classes),querySelector:()=>wrapper};
 const img={classList:list(imageClasses)};
 let active=null;
 const button={setAttribute:(k,v)=>attrs[k]=v,focus:()=>active=button};
 const exit={classList:list(exitClasses),focus:()=>active=exit,contains:node=>node===exit};
 const icon={className:''};
 const nodes={carouselImageContainer:container,carouselMainImg:img,fullscreenBtn:button,exitFullscreenImageBtn:exit};
 const c=vm.createContext({document:{get activeElement(){return active;},getElementById:id=>nodes[id],querySelector:()=>icon}});
 const s=html.slice(html.indexOf('function toggleFullscreenImage()'),html.indexOf('function openPostModal('));
 vm.runInContext('let isFullscreenImage=false;\n'+s,c);
 vm.runInContext('toggleFullscreenImage()',c);
 assert.equal(classes.has('fixed'),true);assert.equal(exitClasses.has('hidden'),false);assert.equal(attrs['aria-pressed'],'true');
 assert.equal(active,exit);
 vm.runInContext('toggleFullscreenImage()',c);
 assert.equal(classes.has('fixed'),false);assert.equal(exitClasses.has('hidden'),true);assert.equal(attrs['aria-pressed'],'false');
 assert.equal(active,button);
});
console.log(passed+' gesture/keyboard/image-control checks and inline syntax passed. Visual layout, pinch zoom and real gestures still require browser validation.');
