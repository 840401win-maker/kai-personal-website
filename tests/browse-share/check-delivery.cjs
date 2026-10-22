const fs=require('node:fs'),assert=require('node:assert/strict');
const local=fs.readFileSync(__dirname+'/index.html','utf8'),served=fs.readFileSync(__dirname+'/served-index.html','utf8');
const programs=h=>Array.from(h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)).filter(m=>!m[1].includes('src=')&&!m[1].includes('application/ld+json')).map(m=>m[2]);
for(const program of programs(local))assert(programs(served).includes(program),'Candidate inline program was not delivered');
assert.equal(fs.readFileSync(__dirname+'/style.css','utf8').trim(),fs.readFileSync(__dirname+'/served-style.css','utf8').trim(),'Candidate CSS differs');
for(const id of ['clearSearchBtn','bookmarksFilter','bookmarkTotal','emptyStateMessage','articleReadingTools','articleReadingProgress']){
 assert.equal((local.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' must be unique');
 assert(served.includes('id="'+id+'"'),id+' is not served');
}
console.log('Preview HTTP source matches candidate inline programs/CSS and includes all new controls; not rendered UI evidence.');
