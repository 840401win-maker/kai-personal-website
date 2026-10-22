const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const utils = fs.readFileSync(__dirname + '/utils.js', 'utf8');
const defaults = html.match(/const DEFAULT_FALLBACK_IMAGES = \{[\s\S]*?\n        \};/)[0];
const context = vm.createContext({ URL, window: {location: {href: 'https://example.com/post/test'}} });
vm.runInContext(defaults + '\n' + utils, context);
const image = (url, category) => context.sanitizeImageUrl(url, category);
const nursing = context.getImageFallback('nursing');
const finance = context.getImageFallback('finance');
for (const input of ['', '   ', null, undefined, {}, 'javascript:alert(1)', 'data:image/png;base64,x', 'https://[']) {
  assert.equal(image(input, 'finance'), finance);
}
assert.equal(image('', '__proto__'), nursing);
assert.equal(image('', 'unknown'), nursing);
const cloud = 'https://res.cloudinary.com/p6esflub/image/upload/f_auto,q_auto/a.png';
assert.equal(image(cloud, 'finance'), cloud);
assert.equal(image(' /images/example.png ', 'nursing'), 'https://example.com/images/example.png');
assert.equal(context.sanitizeUrl(''), 'https://www.instagram.com/kai.nursing_life');
const broken = {src: cloud, onerror: () => {}};
context.handleImgError(broken, 'finance');
assert.equal(broken.src, finance);
assert.equal(broken.onerror, null);
assert.match(html, /modalIgLink'\).href = sanitizeUrl\(post.igUrl\)/);
assert.equal((html.match(/sanitizeImageUrl\(/g) || []).length, 7);
for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!/src=|type="(?:module|application\/ld\+json)"/.test(script[1])) new vm.Script(script[2]);
}
console.log('PASS: image fallbacks, unsafe/empty inputs, category handling, valid URLs, navigation behavior, single error recovery, seven render paths, inline script syntax');
