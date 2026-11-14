import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createDeleteImageHandler } from '../netlify/lib/delete-image.mjs';
import { ADMIN_UID } from '../netlify/lib/cloudinary-auth.mjs';

const SITE_ORIGIN = 'https://kai-personal-website.netlify.app';
const ENDPOINT = `${SITE_ORIGIN}/.netlify/functions/delete-image`;

const VALID_ENV = {
    CLOUDINARY_API_KEY: 'test-key-123',
    CLOUDINARY_API_SECRET: 'test-secret-xyz'
};

test('rejects cross-origin request with 403', async () => {
    const handler = createDeleteImageHandler({ env: VALID_ENV });
    const req = new Request(ENDPOINT, {
        method: 'POST',
        headers: { Origin: 'https://evil.example', Authorization: 'Bearer valid-jwt' },
        body: JSON.stringify({ public_id: 'kai-blog/abc' })
    });
    const res = await handler(req);
    assert.equal(res.status, 403);
});

test('rejects missing bearer token with 401', async () => {
    const handler = createDeleteImageHandler({ env: VALID_ENV });
    const req = new Request(ENDPOINT, {
        method: 'POST',
        headers: { Origin: SITE_ORIGIN },
        body: JSON.stringify({ public_id: 'kai-blog/abc' })
    });
    const res = await handler(req);
    assert.equal(res.status, 401);
});

test('rejects non-admin UID with 403', async () => {
    const handler = createDeleteImageHandler({
        env: VALID_ENV,
        verifyToken: async () => ({ sub: 'attacker-uid-000' })
    });
    const req = new Request(ENDPOINT, {
        method: 'POST',
        headers: { Origin: SITE_ORIGIN, Authorization: 'Bearer valid-jwt' },
        body: JSON.stringify({ public_id: 'kai-blog/abc' })
    });
    const res = await handler(req);
    assert.equal(res.status, 403);
});

test('returns 503 when Cloudinary secrets are absent', async () => {
    const handler = createDeleteImageHandler({
        env: {},
        verifyToken: async () => ({ sub: ADMIN_UID })
    });
    const req = new Request(ENDPOINT, {
        method: 'POST',
        headers: { Origin: SITE_ORIGIN, Authorization: 'Bearer valid-jwt' },
        body: JSON.stringify({ public_id: 'kai-blog/abc' })
    });
    const res = await handler(req);
    assert.equal(res.status, 503);
});

test('rejects public_id outside kai-blog folder with 400', async () => {
    const handler = createDeleteImageHandler({
        env: VALID_ENV,
        verifyToken: async () => ({ sub: ADMIN_UID })
    });

    for (const badId of ['', 'avatar/profile', 'kai-blog/../secret', 'kai-blog/a/b']) {
        const req = new Request(ENDPOINT, {
            method: 'POST',
            headers: { Origin: SITE_ORIGIN, Authorization: 'Bearer valid-jwt', 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: badId })
        });
        const res = await handler(req);
        assert.equal(res.status, 400, `Expected 400 for public_id="${badId}"`);
    }
});

test('signs Cloudinary destroy request correctly for valid kai-blog asset', async () => {
    let capturedUrl = '';
    let capturedForm = null;

    const handler = createDeleteImageHandler({
        env: VALID_ENV,
        verifyToken: async () => ({ sub: ADMIN_UID }),
        fetchImpl: async (url, init) => {
            capturedUrl = url;
            capturedForm = init.body;
            return new Response(JSON.stringify({ result: 'ok' }), { status: 200 });
        }
    });

    const req = new Request(ENDPOINT, {
        method: 'POST',
        headers: { Origin: SITE_ORIGIN, Authorization: 'Bearer valid-jwt', 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: 'kai-blog/photo_2026' })
    });

    const res = await handler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.equal(json.public_id, 'kai-blog/photo_2026');
    assert.match(capturedUrl, /\/image\/destroy$/);

    const ts = capturedForm.get('timestamp');
    assert.equal(capturedForm.get('invalidate'), 'true');
    const expectedSig = createHash('sha256')
        .update(`invalidate=true&public_id=kai-blog/photo_2026&timestamp=${ts}${VALID_ENV.CLOUDINARY_API_SECRET}`)
        .digest('hex');
    assert.equal(capturedForm.get('signature'), expectedSig);
    assert.equal(capturedForm.get('api_key'), VALID_ENV.CLOUDINARY_API_KEY);
});

test('returns 502 when Cloudinary responds with upstream failure', async () => {
    const handler = createDeleteImageHandler({
        env: VALID_ENV,
        verifyToken: async () => ({ sub: ADMIN_UID }),
        fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'Invalid Signature' } }), { status: 400 })
    });

    const req = new Request(ENDPOINT, {
        method: 'POST',
        headers: { Origin: SITE_ORIGIN, Authorization: 'Bearer valid-jwt', 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: 'kai-blog/photo_2026' })
    });

    const res = await handler(req);
    assert.equal(res.status, 502);
});
