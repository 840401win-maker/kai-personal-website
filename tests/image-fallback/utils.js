// Browser preferences are optional; damaged or blocked storage must not stop the page.
function readStoredPreference(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function writeStoredPreference(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        return false;
    }
}

function readStoredFlags(key) {
    const flags = Object.create(null);
    try {
        const value = JSON.parse(readStoredPreference(key) || '{}');
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value).forEach(id => {
                if (value[id] === true) flags[id] = true;
            });
        }
    } catch (error) {
        // Keep a usable in-memory state without deleting the stored data.
    }
    return flags;
}

// P1 Item: Comprehensive XSS Escaping Helper
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// P1 Item: Strict URL Scheme Whitelisting to prevent javascript: / data: attacks
function sanitizeUrl(url) {
    if (!url) return 'https://www.instagram.com/kai.nursing_life';
    try {
        const parsed = new URL(url, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (e) {
        // Invalid URL string fallback
    }
    return 'https://www.instagram.com/kai.nursing_life';
}

// Image URLs must fall back to an image, never a navigation destination.
function getImageFallback(category) {
    return Object.prototype.hasOwnProperty.call(DEFAULT_FALLBACK_IMAGES, category)
        ? DEFAULT_FALLBACK_IMAGES[category]
        : DEFAULT_FALLBACK_IMAGES.nursing;
}

function sanitizeImageUrl(url, category) {
    const fallback = getImageFallback(category);
    if (typeof url !== 'string' || !url.trim()) return fallback;
    try {
        const parsed = new URL(url.trim(), window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch (e) {
        // Malformed image URL: use the category image immediately.
    }
    return fallback;
}

function handleImgError(imgElem, category) {
    const fallback = getImageFallback(category);
    imgElem.onerror = null;
    imgElem.src = fallback;
    if (imgElem.classList) imgElem.classList.add('is-fallback-cover');

    // 僅在文章卡片封面容器（.post-card-media）內提供純 DOM/CSS 文藝封面降級
    // 其他小縮圖、輪播圖保留優雅的 SVG 降級，避免撐壞佈局
    if (typeof document !== 'undefined' && imgElem && imgElem.closest && imgElem.closest('.post-card-media')) {
        try {
            const mediaWrap = imgElem.closest('.post-card-media');
            if (mediaWrap.querySelector('.card-editorial-dom-cover')) return; // 避免重複建立

            const card = imgElem.closest('.post-card') || mediaWrap.parentElement;
            const titleEl = card ? card.querySelector('.post-card-title, h3, h2') : null;
            const titleText = titleEl ? titleEl.textContent.trim() : (imgElem.alt || 'Kai 個人成長與財務思維');
            const accentColor = category === 'nursing' ? 'var(--cat-nursing)' : (category === 'invest' ? 'var(--cat-invest)' : 'var(--cat-finance)');
            const catLabel = category === 'nursing' ? '護理職場' : (category === 'invest' ? '投資理財' : '財務思維');

            const domCover = document.createElement('div');
            domCover.className = 'card-editorial-dom-cover';
            domCover.style.setProperty('--cover-accent', accentColor);
            domCover.setAttribute('aria-hidden', 'true'); // 封面在卡片標題旁，隱藏以避免朗讀器重複念

            const tagSpan = document.createElement('span');
            tagSpan.className = 'card-dom-cover-tag';
            tagSpan.textContent = catLabel;

            const titleDiv = document.createElement('div');
            titleDiv.className = 'card-dom-cover-title';
            titleDiv.textContent = titleText; // 安全賦值，杜絕 innerHTML XSS 隱患

            const brandSpan = document.createElement('span');
            brandSpan.className = 'card-dom-cover-brand';
            brandSpan.textContent = 'KAI · NURSING & FINANCE';

            domCover.appendChild(tagSpan);
            domCover.appendChild(titleDiv);
            domCover.appendChild(brandSpan);

            imgElem.style.display = 'none';
            imgElem.parentNode.insertBefore(domCover, imgElem.nextSibling);
        } catch (e) {
            // 靜默降級，保留 imgElem.src
        }
    }
}

// Newline-separated URLs; retain legacy commas only between absolute URLs.
function parseImageUrls(value) {
    return String(value || '').split(/\r?\n|,\s*(?=https?:\/\/)/i)
        .map(url => url.trim()).filter(Boolean);
}

function addWatermark(url) {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
    const mark = 'l_text:Arial_36_bold:%40kai.nursing_life,co_white,o_75,g_south_east,x_18,y_18/';
    if (url.includes(mark)) return url;
    return url.replace('/upload/', `/upload/${mark}`);
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-[-10px] opacity-0 pointer-events-auto';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-teal-400 dark:text-teal-600"></i> ${escapeHtml(message)}`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-y-[-10px]', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-10px]');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Firestore HTML is untrusted; static article markup stays unchanged.
function sanitizeArticleContent(content) {
    const html = String(content || '');
    if (!window.DOMPurify || !window.DOMPurify.isSupported) return escapeHtml(html);
    return window.DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
        FORBID_ATTR: ['style']
    });
}
