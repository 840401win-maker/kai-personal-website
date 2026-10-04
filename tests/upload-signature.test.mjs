import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateKeyPair, SignJWT} from 'jose';
import {ADMIN_UID, PROJECT_ID, verifyFirebaseToken, createSignatureHandler} from '../netlify/lib/upload-signature.mjs';

const {publicKey, privateKey} = await generateKeyPair('RS256');
const otherKeys = await generateKeyPair('RS256');
const origin = 'https://kai-personal-website.netlify.app';
const env = {URL: origin, CLOUDINARY_API_KEY:'test-key', CLOUDINARY_API_SECRET:'test-only-secret', CLOUDINARY_SIGNED_PRESET:'test-signed'};
const handler = createSignatureHandler({env, verifyToken: token => verifyFirebaseToken(token, publicKey)});
async function token(uid = ADMIN_UID, options = {}) {
    const now = Math.floor(Date.now()/1000);
    return new SignJWT({auth_time: now - 5, ...options.claims})
        .setProtectedHeader({alg:'RS256',kid:'local-test'})
        .setSubject(uid).setIssuer(options.issuer || `https://securetoken.google.com/${PROJECT_ID}`)
        .setAudience(options.audience || PROJECT_ID).setIssuedAt(options.iat || now - 2)
        .setExpirationTime(options.exp || now + 3600).sign(options.key || privateKey);
}
function request(jwt, options = {}) {
    return new Request(origin + '/.netlify/functions/upload-signature', {
        method: options.method || 'POST',
        headers: {Origin: options.origin || origin, ...(jwt ? {Authorization:`Bearer ${jwt}`} : {})},
        ...(options.body ? {body: options.body} : {})
    });
}
test('anonymous request denied', async()=>assert.equal((await handler(request())).status,401));
test('valid non-admin identity denied', async()=>assert.equal((await handler(request(await token('non-admin')))).status,403));
test('expired token denied', async()=>assert.equal((await handler(request(await token(ADMIN_UID,{exp:Math.floor(Date.now()/1000)-10})))).status,401));
test('wrong issuer denied', async()=>assert.equal((await handler(request(await token(ADMIN_UID,{issuer:'https://attacker.example'})))).status,401));
test('wrong project denied', async()=>assert.equal((await handler(request(await token(ADMIN_UID,{audience:'another-project'})))).status,401));
test('forged signature denied', async()=>assert.equal((await handler(request(await token(ADMIN_UID,{key:otherKeys.privateKey})))).status,401));
test('tampered payload denied', async()=>{
    const parts=(await token('non-admin')).split('.');
    const payload=JSON.parse(Buffer.from(parts[1],'base64url'));
    payload.sub=ADMIN_UID;parts[1]=Buffer.from(JSON.stringify(payload)).toString('base64url');
    assert.equal((await handler(request(parts.join('.')))).status,401);
});
test('future authentication time denied', async()=>assert.equal((await handler(request(await token(ADMIN_UID,{claims:{auth_time:Math.floor(Date.now()/1000)+100}})))).status,401));
test('future issued-at denied', async()=>assert.equal((await handler(request(await token(ADMIN_UID,{iat:Math.floor(Date.now()/1000)+100})))).status,401));
test('missing authentication time denied', async()=>assert.equal((await handler(request(await token(ADMIN_UID,{claims:{auth_time:undefined}})))).status,401));
test('cross-origin and wrong method rejected', async()=>{
    assert.equal((await handler(request(await token(),{origin:'https://attacker.example'}))).status,403);
    assert.equal((await handler(request(null,{method:'GET'}))).status,405);
});
test('arbitrary upload fields rejected', async()=>assert.equal((await handler(request(await token(),{body:'{"overwrite":true}'}))).status,400));
test('missing secret and old unsigned preset fail closed', async()=>{
    for (const badEnv of [{...env,CLOUDINARY_API_SECRET:''},{...env,CLOUDINARY_SIGNED_PRESET:'blog_upload'}]) {
        const closed=createSignatureHandler({env:badEnv,verifyToken:t=>verifyFirebaseToken(t,publicKey)});
        assert.equal((await closed(request(await token()))).status,503);
    }
});
test('admin receives fixed valid signature without secret exposure',async()=>{
    const res=await handler(request(await token()));assert.equal(res.status,200);
    assert.equal(res.headers.get('cache-control'),'no-store');
    const raw=await res.text();assert.ok(!raw.includes(env.CLOUDINARY_API_SECRET));
    const data=JSON.parse(raw);
    assert.equal(data.cloud_name,'p6esflub');assert.equal(data.params.overwrite,false);
    assert.match(data.params.public_id,/^kai-blog\/[0-9a-f-]{36}$/);
    assert.equal(data.params.upload_preset,'test-signed');
    const expected=createHash('sha256').update(`overwrite=false&public_id=${data.params.public_id}&timestamp=${data.params.timestamp}&upload_preset=test-signed`+env.CLOUDINARY_API_SECRET).digest('hex');
    assert.equal(data.signature,expected);
});
test('separate requests use different public IDs',async()=>{
    const jwt=await token();const a=await (await handler(request(jwt))).json();const b=await (await handler(request(jwt))).json();
    assert.notEqual(a.params.public_id,b.params.public_id);
});

