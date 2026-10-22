const fs=require('fs'),assert=require('assert'),{JSDOM}=require('jsdom');
const dom=new JSDOM('',{runScripts:'outside-only'}); const win=dom.window;
win.eval(fs.readFileSync(__dirname+'/purify.min.js','utf8'));win.eval(fs.readFileSync(__dirname+'/utils.js','utf8'));
const good='<h3>Title</h3><p class="whitespace-pre-line">Hello <strong>world</strong></p><ul><li>Item</li></ul>';
assert.equal(win.sanitizeArticleContent(good),good);
for(const bad of ['<script>alert(1)</script><p>safe</p>','<img src=x onerror="alert(1)">','<a href="javascript:alert(1)">bad</a>','<svg><g onload="alert(1)"></g></svg>','<form><input name=location></form>','<p style="position:fixed">text</p>']){const clean=win.sanitizeArticleContent(bad);assert(!/script|onerror|onload|javascript:|<svg|<form|<input|style=/i.test(clean),clean);}
win.DOMPurify=undefined;assert.equal(win.sanitizeArticleContent('<img onerror=x>'),'&lt;img onerror=x&gt;');
const html=fs.readFileSync(__dirname+'/index.html','utf8');assert(html.indexOf('/js/vendor/purify.min.js')<html.indexOf('/js/utils.js'));for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!m[1].includes('ld+json')&&!m[1].includes('src='))new(require('vm').Script)(m[2]);
console.log('PASS formatting, XSS vectors, HTML-only profile, unavailable-library fallback and syntax');
