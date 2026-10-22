# Kai Personal Website V1.1 — Phase 5 Final Gate
審查日期：2026-10-03（Asia/Taipei）
審查來源：GitHub main f0f55395d286c99136386d63d08836826fe53800。
結論：BLOCKED。不可標記 final-production-ready。
所有 GitHub 操作唯讀；未修改 main、Firebase config、ADMIN_UID、Firestore Rules、Authentication 或正式資料。sources/ 未變更。review/snapshot 是讀取版本的本地快照。

## Phase 5-2 safety review
- Firebase SDK 10.12.2 初始化一次，window.fb 暴露依賴；DOMContentLoaded 檢查 window.fb 或等待 fb-ready。
- onAuthStateChanged 依 UID 發送 isAdmin；新增/登出/編輯/刪除 UI 跟隨狀態。登入錯誤使用一般訊息。
- 寫入僅指向 posts collection。Create 使用 serverTimestamp；Update 保留 date/likes、不覆寫 createdAt；Delete 有確認與錯誤提示。staticPostsData 不被 Firestore CRUD 修改。
- 寫入函式無獨立 admin guard；安全必須由 deployed Rules 強制。這不是已證明可越權，亦不能當作安全 PASS。repository 無 Rules，無法確認已部署限制。
- Read 使用 createdAt desc 的 onSnapshot；缺少 createdAt 的文件可能不在結果中。firestoreReady 表示 listener 已建立，不代表資料已收到。
- 新增 summary 經 escapeHtml 生成 content，但讀取既有文件 content 後直接放入 innerHTML，未做 sanitizer。若文件可含不可信 HTML，存在 stored XSS 風險；本次未注入正式資料或證明可利用。
- doc.data() 展開在 doc.id 後，文件內 id 欄位可覆盖實際 document ID。既有表單不寫入 id，但需檢查歷史資料。
- Cloudinary unsigned preset 在前端公開，檔案大小/類型只做前端檢查；正式 preset 的伺服器限制未取得。

## 已完成離線驗證
node review/check.cjs 成功。
2 個 inline scripts、4 個 classic scripts 語法解析通過。Edge 模組匯入成功。
5 篇靜態文章：canonical 替換、Person + BlogPosting JSON 解析及 body 不變通過。
正常路由 post-9years 解析通過。
前端及 Edge 的 /post/% 都確認拋出 URIError。
sanitizeUrl('1.jpg') 在文章路由下解析成 https://kainursinglife.com/post/1.jpg。
檔案樹完整、未截斷；不存在 1.jpg 至 16.jpg。

## 正式站驗證
網頁讀取工具無法存取首頁及 /post/post-9years。
另以瀏覽器開首頁，回報 net::ERR_NAME_NOT_RESOLVED。
這是本次工具觀察，不能據此判定使用者端或全球 DNS 故障。
未取得正式 HTTP response、metadata、asset、TLS、UI 或 runtime 證據；亦未取得 Netlify dashboard 設定及部署 SHA。
此前對話中使用者確認首頁/直連可開屬歷史證據，不能取代本次驗證。
GitHub combined status 無 statuses；沒有 CI PASS 證據，不表示 CI 已失敗。

## Phase 5 Final Gate（10 項）
|項目|結果|依據與限制|
|---|---|---|
|1 File Structure|PASS|index.html、css/style.css、5 個 js 模組、Netlify Edge/config、robots/sitemap 存在。文章圖片缺漏列入功能 blocker。|
|2 Code Integrity|PASS（靜態範圍）|腳本語法與5篇metadata离線測試通過；不能推論所有runtime正常。|
|3 Existing Functionality|BLOCKED|30歲文章16張圖片未在main，直連相對路徑另有錯誤；搜尋/排序/收藏等尚未runtime驗證。|
|4 Firebase|BLOCKED|初始化與gating靜態檢查完成，正式連線未驗證。|
|5 Firestore|BLOCKED|CRUD/read層靜態審查完成，Rules、既有資料、CRUD/realtime未驗證。|
|6 Authentication|BLOCKED|UID UI gating存在，正式admin/non-admin/refresh/logout未驗證。|
|7 UI / Responsive|BLOCKED|viewport、響應式class、mobile CSS、focus/Escape存在，實際桌機/手機呈現未驗證。|
|8 Regression / Routing|BLOCKED|正常解析存在；malformed encoding已確認拋例外；production back/forward/direct URL未驗證。|
|9 Performance / SEO / Netlify|BLOCKED|5篇metadata離線PASS，robots/sitemap存在；正式Edge輸出、部署SHA、設定、載入效能未驗證。|
|10 Security|BLOCKED|deployed Rules與Cloudinary preset未確認；content HTML信任邊界待處理。|

## Bug 與最小修改範圍（未修改）
1. P2：post-30years 缺少16張資產及使用相對網址。影響首頁/直連輪播完整性。只恢復明確原始資產或確認正確Cloudinary URL，再調整該文章圖片欄位；必要時同步該文章Edge image。不得猜測圖片網址。
2. P2：index.html parseRoute 與 Edge decodeURIComponent 無例外處理。/post/% 導致前端初始化中斷；Edge exception，平台回應尚未驗證。最小範圍僅兩處解碼防護與既有無效路由處理。
3. 安全審查待決：Firestore content raw HTML。保留static文章HTML；custom文章在渲染邊界使用符合既有內容需求的sanitize/安全文字生成。需先確認已有custom文件格式；不得直接把所有文章改成純文字。
4. P3：未知文章6秒後回首頁無提示；慢速Firestore亦可能錯過深連結。暫不必擴大路由重構。
5. P3：編輯會再套Cloudinary watermark、重設featured=false；可能使既有水印重複或失去精選標记。只處理該欄位及水印冪等性，需範圍授權。
6. P3：localStorage JSON.parse 無壞資料防護、modal 無完整focus trap、custom文章未具server metadata/sitemap。屬已知限制，不能默認已修復。

## 僅需使用者帳號／實機完成的項目
1. Netlify：確認production deploy對應審查SHA、main/publish directory、Edge article-metadata已部署、自訂網域/DNS/TLS、無失敗logs。分享設定與部署證據即可由GPT續審，無需修改。
2. Firebase console：提供已部署Rules供唯讀Review；驗證未登入/非admin write被拒、admin write允許。確認Email/Password與正式authorized domains。
3. 管理員正式測試：建立唯一[TEST]文章→第二無痕視窗看到→編輯→兩端同步→直接URL/刷新→刪除該測試文章→兩端消失；前後5篇static文章保持完整。避免使用真實既有文章測Delete。
4. 登入/登出/刷新：admin管理UI、非admin無管理UI，登出後權限收回，刷新狀態正確。
5. 桌機及360/390/414px手機：首頁/5個直連/返回前進、搜尋/分類/排序/暗色、輪播/圖片失敗fallback、calculator、modal Escape與焦點/scroll。
6. 正式原始HTML：首頁及5篇article的title/description/canonical/OG/Twitter/JSON-LD；robots/sitemap與JS/CSS/image response正常。custom文章SEO屬目前不涵蓋範圍。
7. Cloudinary console：確認unsigned preset的格式、大小、來源/配額等實際限制。
這些手動項目不包含已發現bug的程式修正；修正仍需界定與授權後由工程端處理及GPT回歸審查。

