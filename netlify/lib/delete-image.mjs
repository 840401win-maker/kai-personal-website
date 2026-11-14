import { createHash } from 'node:crypto';
import {
    CLOUDINARY_CLOUD_NAME,
    verifyFirebaseToken,
    reply,
    authorizeAdminRequest
} from './cloudinary-auth.mjs';

// Strictly restrict destruction to creator-uploaded blog images inside kai-blog/
const ALLOWED_PUBLIC_ID_RE = /^kai-blog\/[a-zA-Z0-9_-]{1,128}$/;

export function createDeleteImageHandler({
    env = process.env,
    verifyToken = verifyFirebaseToken,
    fetchImpl = fetch
} = {}) {
    return async request => {
        const authResult = await authorizeAdminRequest(request, verifyToken);
        if (authResult.errorResponse) return authResult.errorResponse;

        const { CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret } = env;
        if (!apiKey || !secret) {
            return reply(503, { error: 'Cloudinary admin credentials are not configured' });
        }

        let payload;
        try {
            payload = await request.json();
        } catch {
            return reply(400, { error: 'Invalid JSON request body' });
        }

        const publicId = typeof payload?.public_id === 'string' ? payload.public_id.trim() : '';
        if (!ALLOWED_PUBLIC_ID_RE.test(publicId)) {
            return reply(400, { error: 'Only kai-blog uploaded images may be deleted' });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const serialized = `public_id=${publicId}&timestamp=${timestamp}`;
        const signature = createHash('sha256').update(serialized + secret).digest('hex');

        const form = new FormData();
        form.append('public_id', publicId);
        form.append('api_key', apiKey);
        form.append('timestamp', String(timestamp));
        form.append('signature', signature);

        try {
            const res = await fetchImpl(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
                method: 'POST',
                body: form
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || (data.result !== 'ok' && data.result !== 'not found')) {
                return reply(502, { error: data.error?.message || 'Cloudinary delete failed' });
            }
            return reply(200, { ok: true, result: data.result, public_id: publicId });
        } catch {
            return reply(502, { error: 'Network error communicating with Cloudinary' });
        }
    };
}
