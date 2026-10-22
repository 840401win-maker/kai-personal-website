const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('review/snapshot/index.html','utf8');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('ld+json')&&!m[1].includes('src='));
for(const m of scripts)new vm.Script(m[2]);
console.log('PASS inline JavaScript syntax:',scripts.length);
for(const p of ['auth','firestore-read','firestore-write','utils'])new vm.Script(fs.readFileSync('review/snapshot/js/'+p+'.js','utf8'));
console.log('PASS classic modules syntax');
const main=scripts.at(-1)[2];
const route=main.match(/function parseRoute\(pathname\) \{[\s\S]*?\n        \}/)[0];
const ctx={};vm.createContext(ctx);vm.runInContext(route,ctx);
assert.equal(ctx.parseRoute('/post/post-9years'),'post-9years');
try{ctx.parseRoute('/post/%');console.log('unexpected route success')}catch(e){console.log('CONFIRMED malformed route throws:',e.name)}
const urlctx={URL,window:{location:{href:'https://kainursinglife.com/post/post-30years'}}};vm.createContext(urlctx);vm.runInContext(fs.readFileSync('review/snapshot/js/utils.js','utf8'),urlctx);
console.log('relative article image resolves to:',urlctx.sanitizeUrl('1.jpg'));
(async()=>{
 const code=fs.readFileSync('review/snapshot/netlify/edge-functions/article-metadata.js','utf8');
 const edge=(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
 for(const id of ['post-30years','ig-post-DSzZGbLknAR','post-9years','post-salary100','post-modely']){
  const res=await edge(new Request('https://kainursinglife.com/post/'+id),{next:async()=>new Response(html,{headers:{'content-type':'text/html'}})});
  const out=await res.text();assert(out.includes('href="https://kainursinglife.com/post/'+id+'"'));
  const json=[...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  assert.equal(json.length,2);assert.equal(json[1]['@type'],'BlogPosting');
  assert.equal(out.split('<body')[1],html.split('<body')[1]);console.log('PASS Edge metadata + JSON-LD + body preserved:',id);
 }
 try{await edge(new Request('https://kainursinglife.com/post/%'),{next:async()=>new Response(html)});}catch(e){console.log('CONFIRMED Edge malformed route throws:',e.name)}
})().catch(e=>{console.error(e);process.exitCode=1});
