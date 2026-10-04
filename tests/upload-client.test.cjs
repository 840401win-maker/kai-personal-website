const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const upload=html.slice(html.indexOf('async function handleImageFileUpload'),html.indexOf('function setCoverImage'));
function setup({loggedIn=true,signatureStatus=200}={}) {
  const controls={uploadStatusLabel:{textContent:''},uploadPreviewRow:{appendChild(){}},newImages:{value:''}};
  const calls=[],toasts=[];
  class Form {constructor(){this.fields={};}append(k,v){this.fields[k]=v;}}
  const sandbox={Array,Object,String,FormData:Form,console:{error(){}},CLOUDINARY_CLOUD_NAME:'p6esflub',
    window:{fb:{auth:{currentUser:loggedIn?{getIdToken:async()=> 'synthetic-token'}:null}}},
    document:{getElementById:id=>controls[id],createElement:()=>({className:'',dataset:{},appendChild(){}})},
    escapeHtml:s=>s,addWatermark:s=>s,parseImageUrls:s=>s.split('\n').filter(Boolean),showToast:s=>toasts.push(s),setCoverImage(){},
    fetch:async(url,options)=>{calls.push({url,options});return url.startsWith('/')
      ?{ok:signatureStatus===200,status:signatureStatus,json:async()=>({cloud_name:'p6esflub',api_key:'test',signature:'test-signature',params:{timestamp:1,upload_preset:'test-signed',overwrite:false,public_id:'test-id'}})}
      :{ok:true,json:async()=>({secure_url:`https://res.cloudinary.com/p6esflub/image/upload/${calls.length}.png`})};}
  };
  vm.createContext(sandbox);vm.runInContext(upload,sandbox);
  return {sandbox,controls,calls,toasts};
}
test('multiple images request signed permission and preserve newline URLs',async()=>{
  const x=setup(),event={target:{files:[{name:'one.png',type:'image/png',size:100},{name:'two.png',type:'image/png',size:100}],value:'selected'}};
  await x.sandbox.handleImageFileUpload(event);
  assert.equal(x.calls.length,4);
  for(const c of x.calls.filter(c=>!c.url.startsWith('/'))){assert.equal(c.options.body.fields.signature,'test-signature');assert.equal(c.options.body.fields.upload_preset,'test-signed');assert.equal(c.options.body.fields.overwrite,'false');}
  assert.equal(x.controls.newImages.value.split('\n').length,2);assert.equal(event.target.value,'');
});
test('missing login never calls upload service',async()=>{
  const x=setup({loggedIn:false});await x.sandbox.handleImageFileUpload({target:{files:[{name:'one.png',type:'image/png',size:100}],value:'selected'}});
  assert.equal(x.calls.length,0);assert.ok(x.toasts.some(t=>t.includes('登入')));
});
test('unconfigured signer has no unsigned fallback',async()=>{
  const x=setup({signatureStatus:503});await x.sandbox.handleImageFileUpload({target:{files:[{name:'one.png',type:'image/png',size:100}],value:'selected'}});
  assert.equal(x.calls.length,1);assert.ok(x.calls[0].url.startsWith('/'));assert.equal(x.controls.newImages.value,'');
});
test('oversized and nonimage files never request a signature',async()=>{
  const x=setup();await x.sandbox.handleImageFileUpload({target:{files:[{name:'text.txt',type:'text/plain',size:1},{name:'large.png',type:'image/png',size:11*1024*1024}],value:'selected'}});
  assert.equal(x.calls.length,0);
});
test('inline scripts remain syntactically valid',()=>{
  for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(!/src=|type="(?:module|application\/ld\+json)"/.test(script[1]))new vm.Script(script[2]);
  }
});

