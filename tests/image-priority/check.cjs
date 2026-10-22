const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const helper = html.slice(html.indexOf('        function prioritizeVisiblePostImage'), html.indexOf('        function renderPosts'));
let checkedScripts = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=|application\/ld\+json|type=["']module/.test(match[1])) continue;
  new vm.Script(match[2]); checkedScripts++;
}
function run(rectangles, size=[1280,720], path='/', supported=true) {
 const images=rectangles.map(rect=>({loading:'lazy',fetchPriority:'auto',getBoundingClientRect:()=>{throw Error('Synchronous layout must not be queried');}}));
 let instance;
 class FakeObserver {
  constructor(callback){this.callback=callback;this.images=[];instance=this;}
  observe(img){this.images.push(img);}
  disconnect(){this.disconnected=true;}
 }
 const context={window:{location:{pathname:path}},IntersectionObserver:FakeObserver};
 if(supported) context.window.IntersectionObserver=FakeObserver;
 vm.createContext(context);
 vm.runInContext(helper,context);
 context.prioritizeVisiblePostImage({querySelectorAll:()=>images});
 if(instance){
  assert.equal(instance.images.length,images.length);
  instance.callback(rectangles.map((rect,index)=>{
   const width=Math.max(0,Math.min(rect.right,size[0])-Math.max(rect.left,0));
   const height=Math.max(0,Math.min(rect.bottom,size[1])-Math.max(rect.top,0));
   return {target:images[index],isIntersecting:width>0&&height>0,intersectionRect:{width,height}};
  }));
  assert.equal(instance.disconnected,true);
 }
 return images;
}
const r=(left,top,right,bottom)=>({left,top,right,bottom});
let images=run([r(0,650,300,850),r(310,600,900,900),r(0,800,1280,1600)]);
assert.deepEqual(images.map(i=>i.fetchPriority),['auto','high','auto']);
assert.deepEqual(images.map(i=>i.loading),['lazy','eager','lazy']);
images=run([r(0,1100,375,1300),r(0,1600,375,1800)],[375,812]);
assert.ok(images.every(i=>i.loading==='lazy'&&i.fetchPriority==='auto'));
images=run([r(-1000,0,-100,500),r(10,-50,200,100),r(1300,0,1700,500)]);
assert.deepEqual(images.map(i=>i.fetchPriority),['auto','high','auto']);
images=run([r(0,0,500,500)],[1280,720],'/post/post-30years');
assert.equal(images[0].loading,'lazy');assert.equal(images[0].fetchPriority,'auto');
assert.deepEqual(run([]),[]);
images=run([r(0,0,500,500)],[1280,720],'/',false);
assert.equal(images[0].loading,'lazy');assert.equal(images[0].fetchPriority,'auto');
console.log('PASS: visible-area choice, mobile below-fold, viewport clipping, direct article exclusion, empty grid, unsupported-browser fallback, observer disconnect and no synchronous geometry read; '+checkedScripts+' inline scripts parse');
