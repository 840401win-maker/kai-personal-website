import { createHash, randomUUID } from 'node:crypto';
import {
    PROJECT_ID,
    ADMIN_UID,
    CLOUDINARY_CLOUD_NAME,
    verifyFirebaseToken,
    reply,
    authorizeAdminRequest
} from './cloudinary-auth.mjs';

export { PROJECT_ID, ADMIN_UID, verifyFirebaseToken };

// Dependency injection is only for server tests; request data cannot select a verifier.
export function createSignatureHandler({ env = process.env, verifyToken = verifyFirebaseToken } = {}) {
    return async request => {
        const authResult = await authorizeAdminRequest(request, verifyToken);
        if (authResult.errorResponse) return authResult.errorResponse;

        const { CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret, CLOUDINARY_SIGNED_PRESET: preset } = env;
        if (!apiKey || !secret || !preset || preset === 'blog_upload') {
            return reply(503, { error: 'Signed upload is not configured' });
        }
        // No request body accepted: callers cannot choose arbitrary signing parameters.
        if (request.body && (await request.text()).trim()) {
            return reply(400, { error: 'Upload parameters are server controlled' });
        }
        const params = {
            overwrite: false,
            public_id: `kai-blog/${randomUUID()}`,
            timestamp: Math.floor(Date.now() / 1000),
            upload_preset: preset
        };
        const serialized = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
        const signature = createHash('sha256').update(serialized + secret).digest('hex');
        return reply(200, { cloud_name: CLOUDINARY_CLOUD_NAME, api_key: apiKey, signature, params });
    };
}
