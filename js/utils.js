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

function handleImgError(imgElem, category) {
    const fallback = DEFAULT_FALLBACK_IMAGES[category] || DEFAULT_FALLBACK_IMAGES['nursing'];
    imgElem.onerror = null;
    imgElem.src = fallback;
}

function addWatermark(url) {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
    const mark = 'l_text:Arial_36_bold:%40kai.nursing_life,co_white,o_75,g_south_east,x_18,y_18/';
    return url.replace('/upload/', `/upload/${mark}`);
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-[-10px] opacity-0 pointer-events-auto';
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
