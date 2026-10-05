import { createHash, randomUUID } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Match the existing Firebase project and admin; no client-supplied identity/config.
export const PROJECT_ID = 'kainursinglife';
export const ADMIN_UID = 'mYD4xk4Ii1aQI7DZSzC1kwllp5z1';
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export async function verifyFirebaseToken(token, keys = googleKeys) {
    const { payload, protectedHeader } = await jwtVerify(token, keys, {
        algorithms: ['RS256'],
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
        requiredClaims: ['sub', 'iat', 'exp', 'auth_time']
    });
    const now = Math.floor(Date.now() / 1000);
    if (typeof protectedHeader.kid !== 'string' || !protectedHeader.kid ||
        typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128 ||
        !Number.isInteger(payload.iat) || payload.iat > now || payload.iat < 0 ||
        !Number.isInteger(payload.auth_time) || payload.auth_time > now || payload.auth_time < 0) {
        throw new Error('Invalid Firebase claims');
    }
    return payload;
}

function reply(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}
    });
}

// Dependency injection is only for server tests; request data cannot select a verifier.
export function createSignatureHandler({ env = process.env, verifyToken = verifyFirebaseToken } = {}) {
    return async request => {
        if (request.method !== 'POST') return reply(405, {error: 'Method not allowed'});
        const origin = request.headers.get('origin');
        if (!origin || origin !== new URL(request.url).origin) return reply(403, {error: 'Origin not allowed'});
        const auth = request.headers.get('authorization') || '';
        if (!/^Bearer \S+$/.test(auth) || auth.length > 8192) return reply(401, {error: 'Login required'});
        let identity;
        try {
            identity = await verifyToken(auth.slice(7));
        } catch (error) {
            if (['ERR_JWKS_TIMEOUT', 'ERR_JOSE_GENERIC', 'ERR_JWKS_INVALID'].includes(error.code) || error instanceof TypeError) {
                return reply(503, {error: 'Identity verification temporarily unavailable'});
            }
            return reply(401, {error: 'Invalid or expired login'});
        }
        if (identity.sub !== ADMIN_UID) return reply(403, {error: 'Admin required'});
        const { CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret, CLOUDINARY_SIGNED_PRESET: preset } = env;
        if (!apiKey || !secret || !preset || preset === 'blog_upload') {
            return reply(503, {error: 'Signed upload is not configured'});
        }
        // No request body accepted: callers cannot choose arbitrary signing parameters.
        if (request.body && (await request.text()).trim()) return reply(400, {error: 'Upload parameters are server controlled'});
        const params = {
            overwrite: false,
            public_id: `kai-blog/${randomUUID()}`,
            timestamp: Math.floor(Date.now() / 1000),
            upload_preset: preset
        };
        const serialized = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
        const signature = createHash('sha256').update(serialized + secret).digest('hex');
        return reply(200, {cloud_name: 'p6esflub', api_key: apiKey, signature, params});
    };
}

