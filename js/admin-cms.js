/**
 * Kai 個人專刊 — 動態按需載入之創作者管理中心 (Creator Studio CMS)
 * 僅於管理員觸發隱藏入口 (#admin / 連點年份) 或驗證通過時才由 index.html 動態 import()。
 * 一般前台讀者完全不下載與掛載本模組，達成首屏瘦身與前後台結構徹底隔離。
 */

const CLOUDINARY_CLOUD_NAME = 'p6esflub';
const ADMIN_UID = 'mYD4xk4Ii1aQI7DZSzC1kwllp5z1';
const LOCKOUT_STORAGE_KEY = 'kai_admin_auth_lock_v1';
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 1000;
const VALID_CATEGORIES = new Set(['nursing', 'finance', 'invest']);

function normalizeCategorySlug(category) {
    return VALID_CATEGORIES.has(category) ? category : 'nursing';
}

function isCreatorAuthenticated() {
    if (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn === true) return true;
    return window.fb?.auth?.currentUser?.uid === ADMIN_UID;
}

let domMounted = false;
let currentStudioTab = 'posts';
let editingPostId = null;
let overridingStaticPostId = null;
let lockoutTimerId = null;

function readLockState() {
    try {
        const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
        if (!raw) return { fails: 0, until: 0 };
        const parsed = JSON.parse(raw);
        return {
            fails: Number.isInteger(parsed?.fails) ? parsed.fails : 0,
            until: Number.isFinite(parsed?.until) ? parsed.until : 0
        };
    } catch {
        return { fails: 0, until: 0 };
    }
}

function writeLockState(state) {
    try {
        localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore storage restrictions */ }
}

function clearLockState() {
    try {
        localStorage.removeItem(LOCKOUT_STORAGE_KEY);
    } catch { /* ignore */ }
}

function extractKaiBlogPublicId(url) {
    if (typeof url !== 'string') return null;
    const match = url.match(/\/upload\/(?:[^/]+\/)*?(kai-blog\/[a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9]+)?(?:\?|$)/);
    return match ? match[1] : null;
}

function buildAdminDomHtml() {
    return `
    <!-- Modal: 隱藏創作者安全登入 (Lazy Mounted) -->
    <div id="loginModal" role="dialog" aria-modal="true" aria-labelledby="loginModalTitle" onclick="if(event.target === this) closeLoginModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="editorial-modal-card w-full max-w-sm overflow-hidden flex flex-col transform scale-95 transition-transform duration-300" id="loginModalCard">
            <div class="editorial-modal-header">
                <h3 id="loginModalTitle" class="editorial-modal-title">
                    <svg class="ico" style="width:16px;height:16px;color:var(--gold-text);"><use href="#i-shield-check"/></svg>
                    <span>創作者安全驗證</span>
                </h3>
                <button type="button" onclick="closeLoginModal()" aria-label="關閉登入視窗" class="reader-back-btn">
                    <svg class="ico" aria-hidden="true"><use href="#i-x"/></svg>
                    <span>關閉</span>
                </button>
            </div>
            <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" class="p-5 space-y-4 text-xs">
                <p class="text-[11px] leading-relaxed" style="color:var(--ink-3);">僅限經 Firebase UID 授權之創作者本人存取。連續輸入錯誤 3 次將啟動 60 秒冷卻保護。</p>
                <div>
                    <label for="loginEmail" class="font-bold text-slate-700 block mb-1">管理員 Email</label>
                    <input type="email" id="loginEmail" name="username" autocomplete="username" required class="calc-input w-full">
                </div>
                <div>
                    <label for="loginPassword" class="font-bold text-slate-700 block mb-1">登入密碼</label>
                    <input type="password" id="loginPassword" name="password" autocomplete="current-password" required class="calc-input w-full">
                </div>
                <p id="loginError" role="alert" class="hidden text-rose-600 text-xs font-semibold leading-relaxed"></p>
                <p id="loginLockNotice" role="status" class="hidden p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold leading-relaxed"></p>
                <button type="submit" id="loginSubmitBtn" class="reader-foot-btn reader-foot-primary w-full justify-center py-2.5">驗證並進入創作者中心</button>
            </form>
        </div>
    </div>

    <!-- Modal: 一站式創作者管理中心 (Creator Studio, Lazy Mounted) -->
    <div id="creatorStudioModal" role="dialog" aria-modal="true" aria-labelledby="creatorStudioTitle" onclick="if(event.target === this) closeCreatorStudio()" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="editorial-modal-card studio-modal-card w-full max-w-4xl overflow-hidden flex flex-col transform scale-95 transition-transform duration-300" id="creatorStudioCard">
            <div class="editorial-modal-header">
                <div class="calc-header-copy">
                    <span class="calc-header-kicker"><svg class="ico" aria-hidden="true"><use href="#i-shield-check"/></svg> 創作者專屬工作台 · @kai.nursing_life</span>
                    <div class="flex flex-wrap items-center gap-2">
                        <h3 id="creatorStudioTitle" class="editorial-modal-title leading-snug">Kai 創作者中心</h3>
                        <span id="studioAdminEmail" class="studio-email-pill"></span>
                    </div>
                </div>
                <button type="button" onclick="closeCreatorStudio()" aria-label="返回前台並關閉創作者中心" class="reader-back-btn">
                    <svg class="ico" aria-hidden="true"><use href="#i-arrow-left"/></svg>
                    <span>返回前台</span>
                </button>
            </div>

            <!-- Studio 導覽分頁列 -->
            <div class="studio-tabs-bar" role="tablist" aria-label="創作者管理功能分頁">
                <button type="button" role="tab" id="studioTabBtn-posts" aria-selected="true" aria-controls="studioPanel-posts" onclick="switchCreatorTab('posts')" class="studio-tab-btn is-active">
                    <svg class="ico" aria-hidden="true"><use href="#i-layers"/></svg>
                    <span>文章管理</span>
                </button>
                <button type="button" role="tab" id="studioTabBtn-editor" aria-selected="false" aria-controls="studioPanel-editor" onclick="switchCreatorTab('editor')" class="studio-tab-btn">
                    <svg class="ico" aria-hidden="true"><use href="#i-sparkles"/></svg>
                    <span id="studioEditorTabLabel">新增／編輯文章</span>
                </button>
                <button type="button" role="tab" id="studioTabBtn-insights" aria-selected="false" aria-controls="studioPanel-insights" onclick="switchCreatorTab('insights')" class="studio-tab-btn">
                    <svg class="ico" aria-hidden="true"><use href="#i-trending-up"/></svg>
                    <span>網站數據中心</span>
                </button>
                <button type="button" role="tab" id="studioTabBtn-security" aria-selected="false" aria-controls="studioPanel-security" onclick="switchCreatorTab('security')" class="studio-tab-btn">
                    <svg class="ico" aria-hidden="true"><use href="#i-user-round"/></svg>
                    <span>帳號安全與登出</span>
                </button>
            </div>

            <!-- Studio 內容捲動區 -->
            <div class="calc-modal-body overflow-y-auto space-y-4" id="creatorStudioBody">
                <!-- Panel 1: 文章清單總覽 -->
                <section id="studioPanel-posts" role="tabpanel" aria-labelledby="studioTabBtn-posts" class="space-y-4">
                    <div class="studio-toolbar">
                        <div class="relative flex-1 min-w-[200px]">
                            <input type="search" id="studioPostFilter" placeholder="搜尋已發布或預設文章標題..." oninput="renderStudioPostList()" class="calc-input w-full text-xs">
                        </div>
                        <button type="button" onclick="openAddPostModal()" class="reader-foot-btn reader-foot-primary">
                            <svg class="ico" aria-hidden="true"><use href="#i-sparkles"/></svg>
                            <span>＋ 新增圖文文章</span>
                        </button>
                    </div>
                    <div id="studioPostsList" class="studio-posts-list"></div>
                </section>

                <!-- Panel 2: 新增與編輯文章 + 圖片管理器 -->
                <section id="studioPanel-editor" role="tabpanel" aria-labelledby="studioTabBtn-editor" class="hidden">
                    <div class="calc-panel">
                        <div class="calc-panel-head flex items-center justify-between gap-2">
                            <h4 id="addPostModalTitle" class="calc-panel-title">➕ 匯入 / 新增 IG 圖文貼文</h4>
                            <button type="button" onclick="switchCreatorTab('posts')" class="reader-back-btn text-xs">回到文章清單</button>
                        </div>

                        <form id="addPostForm" onsubmit="handleSaveCustomPost(event)" class="space-y-4 text-xs">
                            <div>
                                <label for="newTitle" class="font-bold text-slate-700 block mb-1">文章標題 *</label>
                                <input type="text" id="newTitle" required placeholder="例如：【護理日常】臨床夜班小心臟與理財節奏" class="calc-input w-full">
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label for="newCategory" class="font-bold text-slate-700 block mb-1">文章分類</label>
                                    <select id="newCategory" class="calc-input w-full">
                                        <option value="nursing">🩺 護理職場</option>
                                        <option value="finance">💼 理財筆記</option>
                                        <option value="invest">📈 存股投資</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="newReadTime" class="font-bold text-slate-700 block mb-1">預估閱讀時間</label>
                                    <input type="text" id="newReadTime" value="3 分鐘" class="calc-input w-full">
                                </div>
                            </div>

                            <label for="newFeatured" class="studio-switch-card">
                                <div>
                                    <span class="studio-switch-title">⭐ 設為精選主打文章（Featured）</span>
                                    <span class="studio-switch-desc">開啟後將優先顯示於首頁跨欄精選卡片，並作為所屬專欄 Spotlight 的領銜推薦文章。</span>
                                </div>
                                <span class="studio-switch">
                                    <input type="checkbox" id="newFeatured" class="studio-switch-input">
                                    <span class="studio-switch-track" aria-hidden="true"></span>
                                </span>
                            </label>

                            <div>
                                <label class="font-bold text-slate-700 block mb-1">圖片上傳與視覺管理（支援設為首圖、從文章移除或雲端永久刪除）</label>
                                <div class="flex items-center gap-2">
                                    <label for="imageFileInput" class="studio-upload-dropzone">
                                        <i class="fa-solid fa-cloud-arrow-up"></i>
                                        <span id="uploadStatusLabel">選擇圖片檔案上傳（自動簽名並加浮水印）</span>
                                    </label>
                                    <input type="file" id="imageFileInput" accept="image/*" multiple class="hidden" onchange="handleImageFileUpload(event)">
                                </div>
                                <div id="uploadPreviewRow" class="studio-image-grid mt-3"></div>
                            </div>

                            <div>
                                <label for="newImages" class="font-bold text-slate-700 block mb-1">圖片網址列表（第一行＝文章首圖，也可直接點擊上方縮圖卡片排序／移除）</label>
                                <textarea id="newImages" oninput="syncEditorImagePreviews()" placeholder="每行一個完整圖片網址" class="calc-input w-full font-mono text-[11px]" rows="3"></textarea>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label for="newIgUrl" class="font-bold text-slate-700 block mb-1">IG 原文連結 (選填)</label>
                                    <input type="url" id="newIgUrl" placeholder="https://www.instagram.com/p/..." class="calc-input w-full">
                                </div>
                                <div>
                                    <label for="newTags" class="font-bold text-slate-700 block mb-1">標籤 Tags (逗號分隔)</label>
                                    <input type="text" id="newTags" placeholder="#護理日常, #臨床經驗, #指數投資" class="calc-input w-full">
                                </div>
                            </div>

                            <div>
                                <label for="newHighlights" class="font-bold text-slate-700 block mb-1">📌 本文重點整理 Highlights（選填，每行一項，自動於閱讀器頂部生成重點盒）</label>
                                <textarea id="newHighlights" rows="3" placeholder="例如：&#10;🏥 完整拆解公立醫院本俸、夜班津貼與考績獎金比例&#10;📈 結合定期定額指數投資打造穩定被動現金流" class="calc-input w-full leading-relaxed"></textarea>
                            </div>

                            <div>
                                <label for="newSummary" class="font-bold text-slate-700 block mb-1">文章正文與內文摘要 *</label>
                                <div class="studio-format-bar" role="toolbar" aria-label="文章排版快捷工具">
                                    <button type="button" onclick="insertEditorSnippet('h2')" class="studio-format-btn">+ 章節標題 H2</button>
                                    <button type="button" onclick="insertEditorSnippet('nursing')" class="studio-format-btn">+ 🩺 臨床提醒框</button>
                                    <button type="button" onclick="insertEditorSnippet('money')" class="studio-format-btn">+ ⚠️ 理財聲明框</button>
                                    <button type="button" onclick="insertEditorSnippet('quote')" class="studio-format-btn">+ 💬 金句引言</button>
                                </div>
                                <textarea id="newSummary" required rows="8" placeholder="在此撰寫或貼上完整圖文內文，或使用上方按鈕插入章節與提醒框..." class="calc-input w-full leading-relaxed"></textarea>
                            </div>

                            <div class="pt-2 flex flex-wrap items-center justify-end gap-2">
                                <button type="button" onclick="closeAddPostModal()" class="reader-back-btn">取消返回清單</button>
                                <button type="submit" id="addPostSubmitBtn" class="reader-foot-btn reader-foot-primary">儲存並發布至網站</button>
                            </div>
                        </form>
                    </div>
                </section>

                <!-- Panel 3: 網站數據中心 (保留既有 IDs 以相容 renderAdminInsights 與驗證) -->
                <section id="studioPanel-insights" role="tabpanel" aria-labelledby="studioTabBtn-insights" class="hidden space-y-4">
                    <div class="insights-stats-grid">
                        <div class="insights-stat-card">
                            <span class="insights-stat-title"><svg class="ico" style="width:13px;height:13px;color:#d97706;"><use href="#i-layers"/></svg> 全部文章數</span>
                            <span id="insightsTotalPosts" class="insights-stat-val num">0</span>
                            <span class="text-[11px] text-slate-400">已公開發布</span>
                        </div>
                        <div class="insights-stat-card">
                            <span class="insights-stat-title"><svg class="ico" style="width:13px;height:13px;color:#f43f5e;"><use href="#i-heart"/></svg> 文章獲得愛心</span>
                            <span id="insightsTotalLikes" class="insights-stat-val num">0</span>
                            <span class="text-[11px] text-slate-400">文章基底讚數＋本裝置互動，非全站即時統計</span>
                        </div>
                        <div class="insights-stat-card">
                            <span class="insights-stat-title"><svg class="ico" style="width:13px;height:13px;color:#2563eb;"><use href="#i-bookmark"/></svg> 本裝置收藏</span>
                            <span id="insightsTotalBookmarks" class="insights-stat-val num">0</span>
                            <span class="text-[11px] text-slate-400">儲存於當前瀏覽器</span>
                        </div>
                        <div class="insights-stat-card">
                            <span class="insights-stat-title"><svg class="ico" style="width:13px;height:13px;color:#059669;"><use href="#i-clock"/></svg> 本機已讀紀錄</span>
                            <span id="insightsTotalViews" class="insights-stat-val num">0</span>
                            <span class="text-[11px] text-slate-400">當前瀏覽器紀錄（下方卡片為本機與即時資料庫數據）</span>
                        </div>
                    </div>

                    <div class="p-3 rounded-xl bg-teal-50/70 border border-teal-200/70 text-[11px] text-teal-900 leading-relaxed">
                        📈 <b>跨裝置全站行為事件追蹤已啟用（GA4 · <span class="num">G-5JH7SP3NS2</span>）</b>：訪客觸發之 <code>article_view</code>、<code>article_like</code>、<code>article_bookmark</code> 與 <code>calc_share_card_generate</code> 將自動傳送至 Firebase Analytics 後台報表。
                    </div>

                    <section class="calc-panel">
                        <div class="calc-panel-head">
                            <h4 id="insightsRankingTitle" class="calc-panel-title">
                                <svg class="ico" aria-hidden="true"><use href="#i-sparkles"/></svg>
                                <span>最受歡迎文章排行榜（Top 5 熱門推薦）</span>
                            </h4>
                        </div>
                        <div id="insightsRankingList" class="insights-ranking-list"></div>
                    </section>

                    <section class="calc-panel">
                        <div class="calc-panel-head">
                            <h4 class="calc-panel-title">
                                <svg class="ico" aria-hidden="true"><use href="#i-filter"/></svg>
                                <span>專欄文章表現與互動概覽</span>
                            </h4>
                        </div>
                        <div id="insightsCategoryList" class="grid grid-cols-1 sm:grid-cols-3 gap-3"></div>
                    </section>
                </section>

                <!-- Panel 4: 帳號安全與登出 -->
                <section id="studioPanel-security" role="tabpanel" aria-labelledby="studioTabBtn-security" class="hidden space-y-4">
                    <div class="calc-panel space-y-2">
                        <div class="calc-panel-head">
                            <h4 class="calc-panel-title"><svg class="ico" aria-hidden="true"><use href="#i-shield-check"/></svg> 創作者權限識別狀態</h4>
                        </div>
                        <p class="text-xs leading-relaxed" style="color:var(--ink-2);">
                            目前登入信箱：<strong id="studioSecurityEmail" class="num">未登入</strong><br>
                            安全機制：全站寫入與 Cloudinary 簽名權限皆嚴格綁定創作者 Firebase UID，變更登入信箱不會遺失管理員權限。
                        </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <form id="updatePasswordForm" onsubmit="handleUpdatePassword(event)" class="calc-panel space-y-3 text-xs">
                            <div class="calc-panel-head">
                                <h4 class="calc-panel-title">變更登入密碼</h4>
                            </div>
                            <div>
                                <label for="secCurrentPwdPwd" class="font-bold text-slate-700 block mb-1">目前密碼 *</label>
                                <input type="password" id="secCurrentPwdPwd" required autocomplete="current-password" class="calc-input w-full">
                            </div>
                            <div>
                                <label for="secNewPwd" class="font-bold text-slate-700 block mb-1">新密碼（至少 8 碼）*</label>
                                <input type="password" id="secNewPwd" required minlength="8" autocomplete="new-password" class="calc-input w-full">
                            </div>
                            <div>
                                <label for="secConfirmPwd" class="font-bold text-slate-700 block mb-1">確認新密碼 *</label>
                                <input type="password" id="secConfirmPwd" required minlength="8" autocomplete="new-password" class="calc-input w-full">
                            </div>
                            <p id="secPwdMsg" role="status" class="hidden text-xs font-semibold leading-relaxed"></p>
                            <button type="submit" class="reader-foot-btn reader-foot-primary w-full justify-center">更新登入密碼</button>
                        </form>

                        <form id="updateEmailForm" onsubmit="handleUpdateEmail(event)" class="calc-panel space-y-3 text-xs">
                            <div class="calc-panel-head">
                                <h4 class="calc-panel-title">變更管理員登入 Email</h4>
                            </div>
                            <div>
                                <label for="secCurrentPwdEmail" class="font-bold text-slate-700 block mb-1">驗證目前密碼 *</label>
                                <input type="password" id="secCurrentPwdEmail" required autocomplete="current-password" class="calc-input w-full">
                            </div>
                            <div>
                                <label for="secNewEmail" class="font-bold text-slate-700 block mb-1">新管理員 Email *</label>
                                <input type="email" id="secNewEmail" required placeholder="new-email@example.com" class="calc-input w-full">
                            </div>
                            <p class="text-[11px] leading-relaxed" style="color:var(--ink-3);">送出後系統將發送驗證連結至新信箱，點擊信中連結即完成切換。</p>
                            <p id="secEmailMsg" role="status" class="hidden text-xs font-semibold leading-relaxed"></p>
                            <button type="submit" class="reader-foot-btn reader-foot-primary w-full justify-center">發送變更信箱驗證</button>
                        </form>
                    </div>

                    <div class="calc-panel flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h4 class="font-bold text-xs text-slate-800">登出管理員工作台</h4>
                            <p class="text-[11px] text-slate-500 mt-0.5">在共用電腦編輯完成後，請務必登出以清除登入憑證。</p>
                        </div>
                        <button type="button" onclick="handleAdminLogout()" class="studio-danger-btn">
                            <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
                            <span>安全登出創作者身分</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    </div>
    `;
}

export function ensureAdminDomMounted() {
    if (domMounted && document.getElementById('creatorStudioModal')) return;
    const host = document.createElement('div');
    host.id = 'adminCmsLazyRoot';
    host.innerHTML = buildAdminDomHtml();
    document.body.appendChild(host);
    domMounted = true;
}

function updateLockoutUi() {
    const lockNotice = document.getElementById('loginLockNotice');
    const submitBtn = document.getElementById('loginSubmitBtn');
    if (!lockNotice || !submitBtn) return false;

    const { until } = readLockState();
    const remainMs = until - Date.now();
    if (remainMs > 0) {
        const secs = Math.ceil(remainMs / 1000);
        lockNotice.textContent = `連續登入失敗次數過多，為防護安全請於 ${secs} 秒後再試。`;
        lockNotice.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        if (!lockoutTimerId) {
            lockoutTimerId = setInterval(() => {
                if (!updateLockoutUi()) {
                    clearInterval(lockoutTimerId);
                    lockoutTimerId = null;
                }
            }, 500);
        }
        return true;
    }

    lockNotice.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    if (lockoutTimerId) {
        clearInterval(lockoutTimerId);
        lockoutTimerId = null;
    }
    return false;
}

export function openLoginModal() {
    ensureAdminDomMounted();
    if (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) {
        openCreatorStudio('posts');
        return;
    }
    const modal = document.getElementById('loginModal');
    const card = document.getElementById('loginModalCard');
    const errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.classList.add('hidden');
    updateLockoutUi();
    modal.classList.remove('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
    if (typeof moveFocusIntoModal === 'function') moveFocusIntoModal('loginModal');
    if (location.pathname === '/' && location.hash !== '#admin') {
        history.pushState({ modal: 'admin' }, '', '/#admin');
        if (typeof window.isModalPushed !== 'undefined') window.isModalPushed = true;
    }
}

export function closeLoginModal(options = {}) {
    const { fromHistory = false, skipHistoryReset = false, skipRestoreFocus = false } =
        typeof options === 'boolean' ? { fromHistory: options } : options;
    const modal = document.getElementById('loginModal');
    const card = document.getElementById('loginModalCard');
    if (!modal || !card) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    card.classList.add('scale-95');
    document.body.style.overflow = '';
    if (lockoutTimerId) {
        clearInterval(lockoutTimerId);
        lockoutTimerId = null;
    }
    if (!skipRestoreFocus && typeof restoreFocusAfterModalClose === 'function') {
        restoreFocusAfterModalClose();
    }
    if (!skipHistoryReset && !fromHistory && location.hash === '#admin') {
        if (history.state && history.state.modal === 'admin') history.back();
        else history.replaceState({ page: 'home' }, '', '/');
    }
}

export async function handleAdminLogin(e) {
    e.preventDefault();
    ensureAdminDomMounted();
    const errorElem = document.getElementById('loginError');
    if (errorElem) errorElem.classList.add('hidden');

    if (updateLockoutUi()) return;
    if (!window.fb) {
        if (errorElem) {
            errorElem.textContent = '身分驗證服務尚未就緒，請稍候再試';
            errorElem.classList.remove('hidden');
        }
        return;
    }

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const { auth, signInWithEmailAndPassword } = window.fb;
        await signInWithEmailAndPassword(auth, email, password);
        clearLockState();
        if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
        e.target.reset();
        // 標記剛由登入框成功進入，立即跳轉至創作者中心並顯示一次登入提示
        closeLoginModal({ skipHistoryReset: true, skipRestoreFocus: true });
        openCreatorStudio('posts');
        if (typeof showToast === 'function') showToast('🔓 驗證通過！歡迎回到創作者中心');
    } catch (err) {
        console.error('登入失敗：', err);
        const state = readLockState();
        const nextFails = (state.until && state.until < Date.now()) ? 1 : state.fails + 1;
        if (nextFails >= MAX_LOGIN_ATTEMPTS) {
            writeLockState({ fails: nextFails, until: Date.now() + LOCKOUT_DURATION_MS });
            updateLockoutUi();
        } else {
            writeLockState({ fails: nextFails, until: 0 });
            if (errorElem) {
                errorElem.textContent = `帳號或密碼不正確（剩餘 ${MAX_LOGIN_ATTEMPTS - nextFails} 次嘗試機會）`;
                errorElem.classList.remove('hidden');
            }
        }
    }
}

export async function handleAdminLogout() {
    if (!window.fb) return;
    const { auth, signOut } = window.fb;
    await signOut(auth);
    closeCreatorStudio({ skipRestoreFocus: false });
    if (typeof showToast === 'function') showToast('已安全登出創作者管理身分');
}

function updateStudioAccountLabels() {
    const email = (window.fb?.auth?.currentUser?.email) || window.__kaiAdminEmail || '已授權創作者 (UID 鎖定)';
    const headerPill = document.getElementById('studioAdminEmail');
    const secEmail = document.getElementById('studioSecurityEmail');
    if (headerPill) headerPill.textContent = email;
    if (secEmail) secEmail.textContent = email;
}

export function switchCreatorTab(tabName) {
    ensureAdminDomMounted();
    const validTabs = ['posts', 'editor', 'insights', 'security'];
    const target = validTabs.includes(tabName) ? tabName : 'posts';
    currentStudioTab = target;

    validTabs.forEach(t => {
        const btn = document.getElementById(`studioTabBtn-${t}`);
        const panel = document.getElementById(`studioPanel-${t}`);
        const active = t === target;
        if (btn) {
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', String(active));
        }
        if (panel) {
            panel.classList.toggle('hidden', !active);
        }
    });

    if (target === 'posts') renderStudioPostList();
    if (target === 'insights') renderAdminInsights();
    if (target === 'security') updateStudioAccountLabels();
}

export function openCreatorStudio(initialTab = 'posts') {
    ensureAdminDomMounted();
    if (!isCreatorAuthenticated()) {
        openLoginModal();
        return;
    }
    updateStudioAccountLabels();
    renderStudioPostList();
    renderAdminInsights();
    switchCreatorTab(initialTab);

    const modal = document.getElementById('creatorStudioModal');
    const card = document.getElementById('creatorStudioCard');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
    if (typeof moveFocusIntoModal === 'function') moveFocusIntoModal('creatorStudioModal');
    if (location.pathname === '/' && location.hash !== '#admin') {
        history.pushState({ modal: 'admin' }, '', '/#admin');
    }
}

export function closeCreatorStudio(options = {}) {
    const { fromHistory = false, skipRestoreFocus = false } =
        typeof options === 'boolean' ? { fromHistory: options } : options;
    const modal = document.getElementById('creatorStudioModal');
    const card = document.getElementById('creatorStudioCard');
    if (!modal || !card) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    card.classList.add('scale-95');
    document.body.style.overflow = '';
    editingPostId = null;
    if (!skipRestoreFocus && typeof restoreFocusAfterModalClose === 'function') {
        restoreFocusAfterModalClose();
    }
    if (!fromHistory && location.hash === '#admin') {
        if (history.state && history.state.modal === 'admin') history.back();
        else history.replaceState({ page: 'home' }, '', '/');
    }
}

export function openAdminInsightsModal() {
    openCreatorStudio('insights');
}

export function closeAdminInsightsModal(fromHistory = false) {
    closeCreatorStudio({ fromHistory });
}

export function renderStudioPostList() {
    const listEl = document.getElementById('studioPostsList');
    if (!listEl || typeof postsData === 'undefined') return;

    const filterInput = document.getElementById('studioPostFilter');
    const keyword = (filterInput ? filterInput.value : '').trim().toLowerCase();
    const catMap = { nursing: '護理職場', finance: '理財筆記', invest: '存股投資' };

    const filtered = postsData.filter(p => !keyword || (p.title || '').toLowerCase().includes(keyword));
    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">找不到符合「${escapeHtml(keyword)}」的文章。</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(post => {
        const safeId = sanitizePostId(post.id);
        const safeCat = normalizeCategorySlug(post.category);
        const safeTitle = escapeHtml(post.title);
        const safeImg = optimizeCloudinaryUrl(sanitizeImageUrl(post.image, safeCat), 160);
        const isCustom = post._isCustom === true;
        const isOverride = Boolean(post.replacesStaticId);
        const isFeatured = Boolean(post.featured);
        const badge = isCustom
            ? (isOverride
                ? '<span class="studio-badge studio-badge--cloud">雲端覆寫</span>'
                : '<span class="studio-badge studio-badge--cloud">雲端文章</span>')
            : '<span class="studio-badge studio-badge--seed">預設範本</span>';
        const featuredBadge = isFeatured
            ? '<span class="studio-badge studio-badge--featured">⭐ 精選主打</span>'
            : '';

        const actions = isCustom
            ? `
                <button type="button" onclick="togglePostFeatured('${safeId}', event)" aria-pressed="${isFeatured}" class="studio-act-btn ${isFeatured ? 'studio-act-btn--featured-on' : ''}">${isFeatured ? '⭐ 已精選' : '☆ 設為精選'}</button>
                <button type="button" onclick="openEditPostModal('${safeId}', event)" class="studio-act-btn">編輯</button>
                <button type="button" onclick="handleDeletePost('${safeId}', event)" class="studio-act-btn studio-act-btn--danger">刪除</button>
              `
            : `
                <button type="button" onclick="togglePostFeatured('${safeId}', event)" aria-pressed="${isFeatured}" class="studio-act-btn ${isFeatured ? 'studio-act-btn--featured-on' : ''}">${isFeatured ? '⭐ 已精選' : '☆ 設為精選'}</button>
                <button type="button" onclick="duplicateStaticPostToEditor('${safeId}')" class="studio-act-btn" title="編修並覆寫此預設範本（不重複出現）">覆寫編修</button>
              `;

        return `
            <div class="studio-post-row">
                <img src="${safeImg}" alt="${safeTitle}" class="studio-post-thumb" onerror="handleImgError(this, '${safeCat}')">
                <div class="studio-post-info">
                    <div class="flex flex-wrap items-center gap-1.5 mb-1">
                        ${badge}
                        ${featuredBadge}
                        <span class="text-[11px] font-semibold text-slate-500">${escapeHtml(catMap[safeCat] || safeCat)}</span>
                        <span class="text-slate-300">·</span>
                        <span class="text-[11px] text-slate-400 num">${escapeHtml(post.date || '')}</span>
                    </div>
                    <div class="studio-post-title">${safeTitle}</div>
                </div>
                <div class="studio-post-actions">
                    <button type="button" onclick="closeCreatorStudio(); openPostModal('${safeId}')" class="studio-act-btn">檢視</button>
                    ${actions}
                </div>
            </div>
        `;
    }).join('');
}

export async function togglePostFeatured(postId, event) {
    if (event) event.stopPropagation();
    if (!window.fb) {
        if (typeof showToast === 'function') showToast('⚠️ 尚未連上資料庫，請稍後再試一次');
        return;
    }

    const customPost = (typeof customPosts !== 'undefined')
        ? customPosts.find(p => p.id === postId || p.replacesStaticId === postId)
        : null;
    const seedPost = (!customPost && typeof staticPostsData !== 'undefined')
        ? staticPostsData.find(p => p.id === postId)
        : null;
    if (!customPost && !seedPost) return;

    const btn = event?.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
    const nextFeatured = customPost ? !Boolean(customPost.featured) : !Boolean(seedPost.featured);
    if (btn) btn.disabled = true;

    try {
        const { db, collection, addDoc, doc, updateDoc, serverTimestamp } = window.fb;
        if (customPost) {
            await updateDoc(doc(db, 'posts', customPost.id), { featured: nextFeatured });
            customPost.featured = nextFeatured;
        } else if (seedPost) {
            const imgs = (Array.isArray(seedPost.images) && seedPost.images.length)
                ? seedPost.images
                : [seedPost.image].filter(Boolean);
            const overridePayload = {
                title: seedPost.title || '',
                category: normalizeCategorySlug(seedPost.category),
                tags: Array.isArray(seedPost.tags) ? seedPost.tags : ['#精選'],
                date: seedPost.date || new Date().toISOString().split('T')[0],
                readTime: seedPost.readTime || '3 分鐘',
                likes: seedPost.likes ?? 0,
                featured: nextFeatured,
                image: imgs[0] || seedPost.image || '',
                images: imgs,
                summary: seedPost.summary || '',
                highlights: Array.isArray(seedPost.highlights) ? seedPost.highlights : [],
                igUrl: seedPost.igUrl || '',
                content: seedPost.content || `<p class="whitespace-pre-line">${escapeHtml(seedPost.summary || '')}</p>`,
                replacesStaticId: seedPost.id,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'posts'), overridePayload);
            if (typeof customPosts !== 'undefined') {
                const newId = docRef?.id || `override-${seedPost.id}`;
                if (!customPosts.some(p => p.id === newId || p.replacesStaticId === seedPost.id)) {
                    customPosts.unshift({ id: newId, ...overridePayload, _isCustom: true });
                }
            }
        }
        if (typeof rebuildPostsData === 'function') rebuildPostsData();
        if (typeof renderPosts === 'function') renderPosts();
        renderStudioPostList();
        if (typeof showToast === 'function') {
            showToast(nextFeatured ? '⭐ 已設為精選主打文章' : '已取消精選主打狀態');
        }
    } catch (err) {
        console.error('切換精選狀態失敗：', err);
        if (typeof showToast === 'function') showToast('❌ 切換失敗，請確認網路連線或管理員權限');
    } finally {
        if (btn && btn.isConnected) btn.disabled = false;
    }
}

export function duplicateStaticPostToEditor(postId) {
    const existingOverride = (typeof customPosts !== 'undefined')
        ? customPosts.find(p => p.replacesStaticId === postId || p.id === postId)
        : null;
    if (existingOverride) {
        openEditPostModal(existingOverride.id);
        return;
    }

    const post = (typeof postsData !== 'undefined') ? postsData.find(p => p.id === postId) : null;
    if (!post) return;
    ensureAdminDomMounted();
    editingPostId = null;
    overridingStaticPostId = post.id;
    document.getElementById('addPostModalTitle').textContent = '✨ 編修並覆寫預設範本';
    document.getElementById('studioEditorTabLabel').textContent = '覆寫範本';
    document.getElementById('addPostSubmitBtn').textContent = '儲存並覆寫範本';

    document.getElementById('newTitle').value = post.title || '';
    document.getElementById('newCategory').value = post.category || 'nursing';
    document.getElementById('newReadTime').value = post.readTime || '3 分鐘';
    document.getElementById('newFeatured').checked = Boolean(post.featured);
    document.getElementById('newImages').value = (post.images && post.images.length ? post.images : [post.image].filter(Boolean)).join('\n');
    document.getElementById('newIgUrl').value = post.igUrl || '';
    document.getElementById('newTags').value = (post.tags || []).join(', ');
    document.getElementById('newHighlights').value = (post.highlights || []).join('\n');
    document.getElementById('newSummary').value = post.rawBody || post.summary || '';

    syncEditorImagePreviews();
    switchCreatorTab('editor');
}

export function openAddPostModal() {
    ensureAdminDomMounted();
    editingPostId = null;
    overridingStaticPostId = null;
    document.getElementById('addPostModalTitle').textContent = '➕ 匯入 / 新增 IG 圖文貼文';
    document.getElementById('studioEditorTabLabel').textContent = '新增文章';
    document.getElementById('addPostSubmitBtn').textContent = '儲存並發布至網站';
    document.getElementById('addPostForm').reset();
    document.getElementById('newFeatured').checked = false;
    document.getElementById('newHighlights').value = '';
    syncEditorImagePreviews();

    const modal = document.getElementById('creatorStudioModal');
    if (modal.classList.contains('opacity-0')) {
        openCreatorStudio('editor');
    } else {
        switchCreatorTab('editor');
    }
}

export function openEditPostModal(postId, event) {
    if (event) event.stopPropagation();
    const post = (typeof customPosts !== 'undefined') ? customPosts.find(p => p.id === postId) : null;
    if (!post) return;

    ensureAdminDomMounted();
    editingPostId = postId;
    overridingStaticPostId = post.replacesStaticId || null;
    document.getElementById('addPostModalTitle').textContent = '✏️ 編輯圖文貼文';
    document.getElementById('studioEditorTabLabel').textContent = '編輯中';
    document.getElementById('addPostSubmitBtn').textContent = '儲存更新';

    document.getElementById('newTitle').value = post.title || '';
    document.getElementById('newCategory').value = post.category || 'nursing';
    document.getElementById('newReadTime').value = post.readTime || '3 分鐘';
    document.getElementById('newFeatured').checked = Boolean(post.featured);
    document.getElementById('newImages').value = (post.images || []).join('\n');
    document.getElementById('newIgUrl').value = post.igUrl || '';
    document.getElementById('newTags').value = (post.tags || []).join(', ');
    document.getElementById('newHighlights').value = (post.highlights || []).join('\n');
    document.getElementById('newSummary').value = post.rawBody || post.summary || '';

    syncEditorImagePreviews();

    const modal = document.getElementById('creatorStudioModal');
    if (modal.classList.contains('opacity-0')) {
        openCreatorStudio('editor');
    } else {
        switchCreatorTab('editor');
    }
}

export function closeAddPostModal() {
    editingPostId = null;
    overridingStaticPostId = null;
    const label = document.getElementById('studioEditorTabLabel');
    if (label) label.textContent = '新增／編輯文章';
    const previewRow = document.getElementById('uploadPreviewRow');
    if (previewRow) previewRow.innerHTML = '';
    switchCreatorTab('posts');
}

export function syncEditorImagePreviews() {
    const previewRow = document.getElementById('uploadPreviewRow');
    const imagesInput = document.getElementById('newImages');
    if (!previewRow || !imagesInput) return;

    const urls = parseImageUrls(imagesInput.value);
    previewRow.innerHTML = '';
    if (urls.length === 0) return;

    urls.forEach((url, idx) => {
        const card = document.createElement('div');
        card.className = 'studio-image-card';
        card.dataset.url = url;

        const img = document.createElement('img');
        img.src = sanitizeImageUrl(addWatermark(url), 'nursing');
        img.alt = `文章預覽圖 ${idx + 1}`;
        img.className = 'w-full h-20 object-cover rounded-lg border border-slate-200';
        card.appendChild(img);

        if (idx === 0) {
            const coverTag = document.createElement('span');
            coverTag.className = 'studio-cover-tag';
            coverTag.textContent = '首圖';
            card.appendChild(coverTag);
        }

        const btnRow = document.createElement('div');
        btnRow.className = 'flex items-center justify-between gap-1 mt-1.5';

        const starBtn = document.createElement('button');
        starBtn.type = 'button';
        starBtn.title = '設為首圖';
        starBtn.className = `studio-img-mini-btn ${idx === 0 ? 'is-cover' : ''}`;
        starBtn.textContent = idx === 0 ? '★ 首圖' : '☆ 設首圖';
        starBtn.onclick = () => setCoverImage(url);
        btnRow.appendChild(starBtn);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.title = '從這篇文章移除此圖片';
        removeBtn.className = 'studio-img-mini-btn is-danger';
        removeBtn.textContent = '移除';
        removeBtn.onclick = () => removeEditorImage(url);
        btnRow.appendChild(removeBtn);

        card.appendChild(btnRow);

        const publicId = extractKaiBlogPublicId(url);
        if (publicId) {
            const purgeBtn = document.createElement('button');
            purgeBtn.type = 'button';
            purgeBtn.title = '從 Cloudinary 雲端空間永久刪除原圖';
            purgeBtn.className = 'studio-img-purge-btn';
            purgeBtn.textContent = '☁️ 雲端徹底清除';
            purgeBtn.onclick = () => deleteCloudinaryImage(url, publicId);
            card.appendChild(purgeBtn);
        }

        previewRow.appendChild(card);
    });
}

export function setCoverImage(url) {
    const imagesInput = document.getElementById('newImages');
    if (!imagesInput) return;
    let urls = parseImageUrls(imagesInput.value);
    urls = urls.filter(u => u !== url);
    urls.unshift(url);
    imagesInput.value = urls.join('\n');
    syncEditorImagePreviews();
    if (typeof showToast === 'function') showToast('⭐ 已設為文章首圖');
}

export function removeEditorImage(url) {
    const imagesInput = document.getElementById('newImages');
    if (!imagesInput) return;
    const urls = parseImageUrls(imagesInput.value).filter(u => u !== url);
    imagesInput.value = urls.join('\n');
    syncEditorImagePreviews();
    if (typeof showToast === 'function') showToast('已從文章移除該圖片');
}

export async function deleteCloudinaryImage(url, publicId) {
    const otherRefs = (typeof postsData !== 'undefined' ? postsData : []).filter(p =>
        p.id !== editingPostId && [p.image, ...(p.images || [])].some(u => typeof u === 'string' && u.includes(publicId))
    );
    const confirmMsg = otherRefs.length > 0
        ? `⚠️ 注意：網站中仍有 ${otherRefs.length} 篇其他文章引用這張圖片。確定要從 Cloudinary 雲端圖庫「永久刪除」嗎？此動作無法復原。`
        : '確定要從 Cloudinary 雲端圖庫「永久刪除」這張照片嗎？此動作無法復原。';
    if (!confirm(confirmMsg)) return;

    const user = window.fb?.auth?.currentUser;
    if (!user) {
        if (typeof showToast === 'function') showToast('⚠️ 請先登入創作者帳號');
        return;
    }
    try {
        const idToken = await user.getIdToken();
        const res = await fetch('/.netlify/functions/delete-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + idToken
            },
            body: JSON.stringify({ public_id: publicId })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || '雲端刪檔失敗');
        removeEditorImage(url);

        // 若正在編輯已發布的雲端文章，同步將剩餘圖片列表寫回 Firestore，避免不按儲存就離開導致前台破圖
        if (editingPostId && window.fb?.db && window.fb?.doc && window.fb?.updateDoc) {
            const safeCat = normalizeCategorySlug(document.getElementById('newCategory')?.value);
            let syncedImages = parseImageUrls(document.getElementById('newImages')?.value || '');
            if (syncedImages.length === 0 && typeof DEFAULT_FALLBACK_IMAGES !== 'undefined') {
                syncedImages = [DEFAULT_FALLBACK_IMAGES[safeCat]];
            }
            syncedImages = syncedImages.map(addWatermark);
            await window.fb.updateDoc(window.fb.doc(window.fb.db, 'posts', editingPostId), {
                images: syncedImages,
                image: syncedImages[0] || ''
            });
            renderStudioPostList();
        }
        if (typeof showToast === 'function') showToast('🗑️ 已從 Cloudinary 雲端徹底清除圖片並同步文章');
    } catch (err) {
        console.error('雲端刪除失敗：', err);
        if (typeof showToast === 'function') showToast(`❌ 雲端刪除失敗：${err.message}`);
    }
}

export async function handleImageFileUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
            if (typeof showToast === 'function') showToast(`⚠️ 「${escapeHtml(file.name)}」不是有效的圖片格式！`);
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            if (typeof showToast === 'function') showToast(`⚠️ 「${escapeHtml(file.name)}」檔案超過 10MB 限制！`);
            return false;
        }
        return true;
    });

    if (validFiles.length === 0) return;

    const statusLabel = document.getElementById('uploadStatusLabel');
    const imagesInput = document.getElementById('newImages');
    const uploadedUrls = [];

    if (statusLabel) statusLabel.textContent = `上傳中... (0/${validFiles.length})`;

    for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const user = window.fb?.auth?.currentUser;
            if (!user) throw new Error('請先登入管理員再上傳');
            const idToken = await user.getIdToken();
            const signatureResponse = await fetch('/.netlify/functions/upload-signature', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + idToken }
            });
            if (!signatureResponse.ok) {
                throw new Error(signatureResponse.status === 503
                    ? '安全上傳尚未設定完成，請稍後再試'
                    : '登入已失效或沒有上傳權限，請重新登入');
            }
            const signedUpload = await signatureResponse.json();
            if (signedUpload.cloud_name !== CLOUDINARY_CLOUD_NAME || !signedUpload.signature || !signedUpload.api_key) {
                throw new Error('上傳授權回應無效');
            }
            formData.append('api_key', signedUpload.api_key);
            formData.append('signature', signedUpload.signature);
            for (const [key, value] of Object.entries(signedUpload.params)) {
                formData.append(key, String(value));
            }
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || '上傳失敗');

            uploadedUrls.push(data.secure_url);
            if (statusLabel) statusLabel.textContent = `上傳中... (${i + 1}/${validFiles.length})`;
        } catch (err) {
            console.error('圖片上傳失敗：', err);
            if (typeof showToast === 'function') showToast(`❌ 「${escapeHtml(file.name)}」上傳失敗：${err.message || '請確認上傳設定'}`);
        }
    }

    if (uploadedUrls.length > 0 && imagesInput) {
        imagesInput.value = parseImageUrls(imagesInput.value).concat(uploadedUrls).join('\n');
        syncEditorImagePreviews();
        if (typeof showToast === 'function') showToast(`✅ 成功上傳 ${uploadedUrls.length} 張圖片！`);
    }

    if (statusLabel) statusLabel.textContent = '選擇圖片檔案上傳（自動簽名並加浮水印）';
    event.target.value = '';
}

export async function handleDeletePost(postId, event) {
    if (event) event.stopPropagation();
    if (!window.fb) return;
    if (!confirm('確定要刪除這篇貼文嗎？刪除後無法復原。')) return;

    try {
        const { db, doc, deleteDoc } = window.fb;
        await deleteDoc(doc(db, 'posts', postId));
        if (typeof showToast === 'function') showToast('🗑️ 貼文已刪除');
        renderStudioPostList();
    } catch (err) {
        console.error('刪除貼文失敗：', err);
        if (typeof showToast === 'function') showToast('❌ 刪除失敗，請確認網路連線或安全規則');
    }
}

const CALLOUT_DEFAULT_TITLES = {
    nursing: '🩺 臨床提醒',
    money: '⚠️ 理財風險聲明',
    note: '💡 重點筆記'
};

export function insertEditorSnippet(type) {
    const textarea = document.getElementById('newSummary');
    if (!textarea) return;
    const snippets = {
        h2: '\n\n## 📌 請輸入章節標題\n',
        nursing: '\n\n:::nursing 🩺 臨床提醒\n請輸入臨床提醒或排班建議...\n:::\n',
        money: '\n\n:::money ⚠️ 理財風險聲明\n本文僅為個人紀律分享，不構成任何投資建議。\n:::\n',
        quote: '\n\n> 「請輸入想強調的金句或感悟...」\n'
    };
    const snippet = snippets[type];
    if (!snippet) return;

    const value = textarea.value || '';
    const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : value.length;
    const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : value.length;
    const inserted = (start === 0 ? snippet.replace(/^\n+/, '') : snippet);
    textarea.value = value.slice(0, start) + inserted + value.slice(end);
    const nextPos = start + inserted.length;
    textarea.focus();
    if (typeof textarea.setSelectionRange === 'function') {
        textarea.setSelectionRange(nextPos, nextPos);
    }
}

export function extractCleanSummary(rawText) {
    const cleaned = String(rawText || '')
        .replace(/\r\n?/g, '\n')
        .replace(/^:::(?:nursing|money|note)\s*/gmi, '')
        .replace(/^:::\s*$/gm, '')
        .replace(/^#{2,3}\s+/gm, '')
        .replace(/^>\s*/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (cleaned.length <= 180) return cleaned;
    return cleaned.slice(0, 177).trimEnd() + '...';
}

export function buildCustomArticleContent(rawText) {
    const trimmed = String(rawText || '').replace(/\r\n?/g, '\n').trim();
    if (!trimmed) return '';

    const hasStructuredSyntax = /^(?:::(?:nursing|money|note)\b|#{2,3}\s+|>\s*)/mi.test(trimmed);
    if (!hasStructuredSyntax) {
        return `<p class="whitespace-pre-line">${escapeHtml(trimmed)}</p>`;
    }

    const lines = trimmed.split('\n');
    const blocks = [];
    let paraLines = [];
    let callout = null;
    let headingCount = 0;

    const flushPara = () => {
        if (paraLines.length > 0) {
            blocks.push(`<p>${paraLines.map(escapeHtml).join('<br>')}</p>`);
            paraLines = [];
        }
    };
    const flushCallout = () => {
        if (!callout) return;
        const bodyHtml = escapeHtml(callout.lines.join('\n').trim()).replace(/\n/g, '<br>');
        blocks.push(
            `<div class="callout callout--${callout.kind}"><div class="callout-title">${escapeHtml(callout.title)}</div><p>${bodyHtml}</p></div>`
        );
        callout = null;
    };

    for (const line of lines) {
        if (callout) {
            if (line.trim() === ':::') {
                flushCallout();
            } else {
                callout.lines.push(line);
            }
            continue;
        }
        const calloutStart = line.match(/^:::(nursing|money|note)\s*(.*)$/i);
        if (calloutStart) {
            flushPara();
            const kind = calloutStart[1].toLowerCase();
            const title = (calloutStart[2] || '').trim() || CALLOUT_DEFAULT_TITLES[kind] || '💡 重點提醒';
            callout = { kind, title, lines: [] };
            continue;
        }
        const h2Match = line.match(/^##\s+(.+)$/);
        if (h2Match) {
            flushPara();
            headingCount++;
            blocks.push(`<h2 id="sec-custom-${headingCount}">${escapeHtml(h2Match[1].trim())}</h2>`);
            continue;
        }
        const h3Match = line.match(/^###\s+(.+)$/);
        if (h3Match) {
            flushPara();
            headingCount++;
            blocks.push(`<h3 id="sec-custom-${headingCount}">${escapeHtml(h3Match[1].trim())}</h3>`);
            continue;
        }
        const quoteMatch = line.match(/^>\s*(.+)$/);
        if (quoteMatch) {
            flushPara();
            blocks.push(`<blockquote>${escapeHtml(quoteMatch[1].trim())}</blockquote>`);
            continue;
        }
        if (!line.trim()) {
            flushPara();
            continue;
        }
        paraLines.push(line.trim());
    }

    flushCallout();
    flushPara();
    return blocks.join('\n');
}

export async function handleSaveCustomPost(e) {
    e.preventDefault();

    if (!window.fb) {
        if (typeof showToast === 'function') showToast('⚠️ 尚未連上資料庫，請稍後再試一次');
        return;
    }

    const title = document.getElementById('newTitle').value.trim();
    const category = document.getElementById('newCategory').value;
    const readTime = document.getElementById('newReadTime').value.trim() || '3 分鐘';
    const featured = Boolean(document.getElementById('newFeatured')?.checked);
    const rawImages = document.getElementById('newImages').value.trim();
    const igUrl = document.getElementById('newIgUrl').value.trim();
    const rawTags = document.getElementById('newTags').value.trim();
    const rawHighlights = document.getElementById('newHighlights')?.value || '';
    const rawBody = document.getElementById('newSummary').value.trim();

    let imagesArr = parseImageUrls(rawImages);
    if (imagesArr.length === 0) {
        imagesArr = [DEFAULT_FALLBACK_IMAGES[category]];
    }
    imagesArr = imagesArr.map(addWatermark);

    const tagsArr = rawTags ? rawTags.split(',').map(s => s.trim().startsWith('#') ? s.trim() : '#' + s.trim()) : ['#新圖文'];
    const highlightsArr = rawHighlights.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

    const existingPost = (editingPostId && typeof customPosts !== 'undefined')
        ? customPosts.find(p => p.id === editingPostId)
        : null;
    const staticTargetId = existingPost?.replacesStaticId || overridingStaticPostId || null;
    const seedPost = (staticTargetId && typeof staticPostsData !== 'undefined')
        ? staticPostsData.find(p => p.id === staticTargetId)
        : null;

    const keptSeedSummaryOnly = Boolean(
        seedPost &&
        rawBody === seedPost.summary &&
        !(existingPost?.rawBody && existingPost.rawBody !== seedPost.summary) &&
        seedPost.content
    );
    const summary = (seedPost && rawBody === seedPost.summary)
        ? seedPost.summary
        : extractCleanSummary(rawBody);
    const content = keptSeedSummaryOnly
        ? (existingPost?.content || seedPost.content)
        : buildCustomArticleContent(rawBody);

    const newPost = {
        title,
        category,
        tags: tagsArr,
        date: existingPost?.date || seedPost?.date || new Date().toISOString().split('T')[0],
        readTime,
        likes: existingPost?.likes ?? seedPost?.likes ?? 0,
        featured,
        image: imagesArr[0],
        images: imagesArr,
        highlights: highlightsArr,
        summary,
        rawBody,
        igUrl: sanitizeUrl(igUrl),
        content
    };
    if (staticTargetId) {
        newPost.replacesStaticId = staticTargetId;
    }

    try {
        const { db, collection, addDoc, doc, updateDoc, serverTimestamp } = window.fb;
        if (editingPostId) {
            await updateDoc(doc(db, 'posts', editingPostId), newPost);
            e.target.reset();
            closeAddPostModal();
            if (typeof showToast === 'function') showToast('✅ 貼文已更新');
        } else {
            newPost.createdAt = serverTimestamp();
            await addDoc(collection(db, 'posts'), newPost);
            e.target.reset();
            closeAddPostModal();
            if (typeof showToast === 'function') {
                showToast(staticTargetId ? '✨ 已覆寫預設範本並同步發布' : '✨ 成功新增並發布新圖文貼文！所有訪客都看得到囉');
            }
        }
        renderStudioPostList();
    } catch (err) {
        console.error('儲存貼文失敗：', err);
        if (typeof showToast === 'function') showToast('❌ 儲存失敗，請確認網路連線或 Firestore 安全規則');
    }
}

export async function handleUpdatePassword(e) {
    e.preventDefault();
    const msgEl = document.getElementById('secPwdMsg');
    const showMsg = (txt, isOk) => {
        if (!msgEl) return;
        msgEl.textContent = txt;
        msgEl.className = `text-xs font-semibold leading-relaxed ${isOk ? 'text-teal-700' : 'text-rose-600'}`;
        msgEl.classList.remove('hidden');
    };

    const currentPwd = document.getElementById('secCurrentPwdPwd').value;
    const newPwd = document.getElementById('secNewPwd').value;
    const confirmPwd = document.getElementById('secConfirmPwd').value;

    if (newPwd !== confirmPwd) {
        showMsg('兩次輸入的新密碼不一致，請重新確認。', false);
        return;
    }
    if (newPwd.length < 8) {
        showMsg('為確保帳號安全，新密碼長度須至少 8 個字元。', false);
        return;
    }
    const user = window.fb?.auth?.currentUser;
    if (!user || !window.fb.EmailAuthProvider || !window.fb.reauthenticateWithCredential || !window.fb.updatePassword) {
        showMsg('目前尚未完成真實身分登入或驗證元件未載入。', false);
        return;
    }
    try {
        const cred = window.fb.EmailAuthProvider.credential(user.email, currentPwd);
        await window.fb.reauthenticateWithCredential(user, cred);
        await window.fb.updatePassword(user, newPwd);
        e.target.reset();
        showMsg('✅ 登入密碼已成功更新！下次登入請使用新密碼。', true);
    } catch (err) {
        console.error('更新密碼失敗：', err);
        showMsg('驗證失敗或密碼更新未成功（請確認目前密碼是否正確）。', false);
    }
}

export async function handleUpdateEmail(e) {
    e.preventDefault();
    const msgEl = document.getElementById('secEmailMsg');
    const showMsg = (txt, isOk) => {
        if (!msgEl) return;
        msgEl.textContent = txt;
        msgEl.className = `text-xs font-semibold leading-relaxed ${isOk ? 'text-teal-700' : 'text-rose-600'}`;
        msgEl.classList.remove('hidden');
    };

    const currentPwd = document.getElementById('secCurrentPwdEmail').value;
    const newEmail = document.getElementById('secNewEmail').value.trim();

    const user = window.fb?.auth?.currentUser;
    if (!user || !window.fb.EmailAuthProvider || !window.fb.reauthenticateWithCredential || !window.fb.verifyBeforeUpdateEmail) {
        showMsg('目前尚未完成真實身分登入或驗證元件未載入。', false);
        return;
    }
    try {
        const cred = window.fb.EmailAuthProvider.credential(user.email, currentPwd);
        await window.fb.reauthenticateWithCredential(user, cred);
        await window.fb.verifyBeforeUpdateEmail(user, newEmail);
        e.target.reset();
        showMsg(`✅ 已寄送驗證信至 ${newEmail}！點擊信中連結後即正式更換信箱。`, true);
    } catch (err) {
        console.error('更換信箱失敗：', err);
        showMsg(`無法發送驗證信：${err.message || '請確認密碼與信箱格式'}`, false);
    }
}

export function renderAdminInsights() {
    ensureAdminDomMounted();
    const totalPostsEl = document.getElementById('insightsTotalPosts');
    const totalLikesEl = document.getElementById('insightsTotalLikes');
    const totalBookmarksEl = document.getElementById('insightsTotalBookmarks');
    const totalViewsEl = document.getElementById('insightsTotalViews');
    const rankingListEl = document.getElementById('insightsRankingList');
    const categoryListEl = document.getElementById('insightsCategoryList');

    if (!totalPostsEl || !rankingListEl) return;

    const totalPosts = postsData.length;
    let totalLikes = 0;
    postsData.forEach(p => {
        totalLikes += (p.likes || 0) + (userLikes[p.id] ? 1 : 0);
    });

    const bookmarkCount = Object.keys(userBookmarks || {}).filter(id => userBookmarks[id] && postsData.some(p => p.id === id)).length;
    const progressKeys = Object.keys(userReadingProgress || {}).filter(id => userReadingProgress[id] && postsData.some(p => p.id === id));
    const localReadCount = progressKeys.length;

    totalPostsEl.textContent = totalPosts;
    totalLikesEl.textContent = totalLikes.toLocaleString();
    totalBookmarksEl.textContent = bookmarkCount.toLocaleString();
    totalViewsEl.textContent = localReadCount.toLocaleString();

    const categoryLabels = { nursing: '臨床護理', finance: '理財筆記', invest: '存股投資' };

    const sorted = [...postsData].sort((a, b) => {
        const likesA = (a.likes || 0) + (userLikes[a.id] ? 1 : 0);
        const likesB = (b.likes || 0) + (userLikes[b.id] ? 1 : 0);
        if (likesB !== likesA) return likesB - likesA;

        const featA = a.featured ? 1 : 0;
        const featB = b.featured ? 1 : 0;
        if (featB !== featA) return featB - featA;

        const parseDateMs = (d) => {
            if (!d) return 0;
            const ms = new Date(d).getTime();
            return Number.isFinite(ms) ? ms : 0;
        };
        const dateA = parseDateMs(a.date);
        const dateB = parseDateMs(b.date);
        if (dateB !== dateA) return dateB - dateA;

        return String(a.id || '').localeCompare(String(b.id || ''));
    });

    const hasAnyLikes = totalLikes > 0;
    const top5 = sorted.slice(0, 5);
    const medals = hasAnyLikes ? ['🥇', '🥈', '🥉', '4', '5'] : ['1', '2', '3', '4', '5'];

    const rankingTitleEl = document.getElementById('insightsRankingTitle');
    if (rankingTitleEl) {
        rankingTitleEl.innerHTML = hasAnyLikes
            ? `<svg class="ico" aria-hidden="true"><use href="#i-heart"/></svg><span>最受歡迎文章排行榜（讀者點讚熱門）</span>`
            : `<svg class="ico" aria-hidden="true"><use href="#i-sparkles"/></svg><span>精選推薦文章排序（依編輯精選與發布）</span>`;
    }

    const hintBanner = !hasAnyLikes ? `
        <div class="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2 mb-2">
            <span>💡 目前尚無讀者按讚互動記錄，榜單依「編輯精選」與「最新發布時間」推薦展示</span>
        </div>
    ` : '';

    rankingListEl.innerHTML = hintBanner + top5.map((p, idx) => {
        const likes = (p.likes || 0) + (userLikes[p.id] ? 1 : 0);
        const isBookmarked = userBookmarks[p.id] === true;
        const safeCat = normalizeCategorySlug(p.category);
        const badgeClass = idx === 0 ? 'insights-rank-badge--1' : (idx === 1 ? 'insights-rank-badge--2' : (idx === 2 ? 'insights-rank-badge--3' : 'insights-rank-badge--sub'));
        return `
            <div class="insights-rank-item cursor-pointer" onclick="closeCreatorStudio(); openPostModal('${sanitizePostId(p.id)}');">
                <div class="insights-rank-main">
                    <div class="insights-rank-head">
                        <span class="insights-rank-badge ${badgeClass}">${medals[idx]}</span>
                        <span class="insights-rank-title">${escapeHtml(p.title)}</span>
                    </div>
                    <div class="insights-rank-meta">
                        <span class="font-semibold text-slate-600">${escapeHtml(categoryLabels[safeCat] || safeCat)}</span>
                        <span class="text-slate-300">•</span>
                        <span>${escapeHtml(p.date || '')}</span>
                        <span class="text-slate-300">•</span>
                        <span>${escapeHtml(p.readTime || '')}</span>
                    </div>
                </div>
                <div class="insights-rank-actions">
                    <span class="inline-flex items-center gap-1 font-bold text-rose-500 text-xs">
                        <svg class="ico" style="width:12px;height:12px;"><use href="#i-heart"/></svg>
                        <span class="num">${likes}</span>
                    </span>
                    ${isBookmarked ? `<span class="text-blue-600" title="本裝置已收藏"><svg class="ico" style="width:12px;height:12px;"><use href="#i-bookmark"/></svg></span>` : ''}
                    <button type="button" class="reader-back-btn py-1 px-2.5 text-xs">查看</button>
                </div>
            </div>
        `;
    }).join('');

    const catStats = {
        nursing: { count: 0, likes: 0, name: '臨床護理' },
        finance: { count: 0, likes: 0, name: '理財薪資' },
        invest: { count: 0, likes: 0, name: '存股投資' }
    };
    postsData.forEach(p => {
        const cat = catStats[p.category];
        if (cat) {
            cat.count++;
            cat.likes += (p.likes || 0) + (userLikes[p.id] ? 1 : 0);
        }
    });

    if (categoryListEl) {
        categoryListEl.innerHTML = Object.entries(catStats).map(([, data]) => `
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                <span class="font-bold text-xs text-slate-700">${data.name} 專欄</span>
                <div class="flex items-baseline justify-between mt-1">
                    <span class="text-lg font-bold text-slate-900 num">${data.count} <span class="text-xs font-normal text-slate-400">篇</span></span>
                    <span class="text-xs text-rose-500 font-semibold num">❤️ ${data.likes} 讚</span>
                </div>
            </div>
        `).join('');
    }
}

// 集中掛載至 window.KaiCMS 命名空間，並保留 window 頂層別名以維持 HTML inline 事件相容性
const KaiCMS = Object.freeze({
    ensureAdminDomMounted,
    openLoginModal,
    closeLoginModal,
    handleAdminLogin,
    handleAdminLogout,
    openCreatorStudio,
    closeCreatorStudio,
    switchCreatorTab,
    renderStudioPostList,
    togglePostFeatured,
    duplicateStaticPostToEditor,
    openAddPostModal,
    openEditPostModal,
    closeAddPostModal,
    syncEditorImagePreviews,
    setCoverImage,
    removeEditorImage,
    deleteCloudinaryImage,
    handleImageFileUpload,
    handleDeletePost,
    insertEditorSnippet,
    extractCleanSummary,
    buildCustomArticleContent,
    handleSaveCustomPost,
    handleUpdatePassword,
    handleUpdateEmail,
    openAdminInsightsModal,
    closeAdminInsightsModal,
    renderAdminInsights
});

window.KaiCMS = KaiCMS;
Object.assign(window, KaiCMS);
