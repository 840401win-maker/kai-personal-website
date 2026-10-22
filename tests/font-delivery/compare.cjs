const fs = require('node:fs');
const zlib = require('node:zlib');
for (const name of ['before','after']) {
  const css = fs.readFileSync(__dirname + '/' + name + '.css');
  const text = css.toString();
  console.log(name, JSON.stringify({bytes:css.length,gzipBytes:zlib.gzipSync(css).length,faces:(text.match(/@font-face/g)||[]).length,uniqueFontUrls:new Set([...text.matchAll(/src: url\(([^)]+)\)/g)].map(x=>x[1])).size}));
}
