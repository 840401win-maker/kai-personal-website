# Kai Personal Website V1.1 目前進度

更新：2026-10-17。正式程式碼：GitHub main `fe8ba2828a00009833573db5c4b0f6d15ef758b0`。
正式站：https://kai-personal-website.netlify.app/

新UX擴充（2026-10-17）：使用者優先「手機瀏覽與文章閱讀更順手」，並要求直接修訂先集中完成、實際測試最後一起處理。同一PR23草稿整合防誤觸、手機版面、圖片放大退出與焦點、可保存字級、捲動進度／回頂、只看收藏與計數、搜尋清除、系統分享及複製失敗回饋。最新候選12113a1，56項本地模擬行為檢查通過；本commit部署Ready，首頁／CSS HTTP200且程式內容比對通過。畫面與真實操作仍待驗證；正式main確認仍fe8ba28。這批已界定的直接實作完成，按final-validation-checklist.md集中驗收；最新UX證據見browse-share/result.md，舊批記錄僅作歷史。PR22效能候選維持獨立，先前預覽已Ready但未證明提速。瀏覽器工具仍無法啟動，不因此推定UI或runtime PASS。

PR21已完成：14項本地檢查通過，使用者於2026-10-17確認收藏、按讚、主題重新載入後都保留。合併fe8ba28，正式首頁與工具程式HTTP200；部署內容與測試版本比對通過（首頁排除兩個已觀察到的Netlify自動注入）。測試狀態是否復原未另行確認，不推定已復原。詳見preferences-storage/result.md。下列效能分數為2026-10-07量測，今日未重測。

網站已部署並可使用。Phase 5 Final Gate 為 **BLOCKED**；10 項中 8 項於已測範圍 PASS、2 項待補證據。這是檢查項目數，並非專案工時完成率。目前不能標記 `V1.1 final-production-ready`。

| 項目 | 狀態 | 已完成／剩餘內容 |
|---|---|---|
| 1. 檔案結構 | PASS | main 的 CSS、JS 模組與 sanitizer 結構已檢查 |
| 2. 程式完整性 | PASS | 修訂範圍及必要語法、功能檢查完成 |
| 3. 既有功能 | PASS（已測範圍） | 路由、搜尋／分類、計算器、主題、輪播 |
| 4. Firebase | PASS（已測範圍） | 初始化與正式站讀取；設定未改動 |
| 5. Firestore | PASS（已測範圍） | 先前 CRUD、同步與匿名寫入拒絕已驗證 |
| 6. Authentication | BLOCKED | 管理員流程通過；使用者清單只有管理員，缺有效非管理員登入驗證 |
| 7. UI | PASS（已測範圍） | 桌機與手機尺寸檢查；手機實機依使用者要求暫緩 |
| 8. Regression | PASS（已測範圍） | 圖片 fallback、文章標題與返回／前進；失效原圖依使用者要求暫緩 |
| 9. Performance | BLOCKED | PR18、PR20已上線；最新正式桌機81、LCP2.108s、CLS.004；手機55、LCP8.563s仍偏慢，需要慢速網路診斷 |
| 10. Security | PASS（已測範圍） | 簽名上傳已部署，舊 unsigned 管道拒絕上傳；非管理員實際帳號驗證另列第 6 項 |

## 已完成的收尾修訂

- PR #12：圖片無效網址直接選擇分類 fallback。
- PR #13：文章開關、返回與前進正確更新瀏覽器標題。
- PR #14：字型 CSS 重複傳輸減少；不推定等比例字型檔節省。
- PR #15：簽名上傳、既有管理員身分檢查，20 項本地測試通過；預覽單張／多張、封面、浮水印及正式站上傳通過。
- Netlify 三個 Cloudinary 環境變數完成；Secret 未揭露。
- 舊 blog_upload 已改為 Signed 且禁止覆寫；實際 unsigned 請求回 400。
- 正式文章直連、16 張縮圖、canonical／OG、robots／sitemap 完成驗證。

## 本輪新完成

- PR #16：小圖示限定64px PNG，實際51×64、3,629bytes，預覽通過、合併並確認正式站套用。只有一行 href 修改；不宣稱精準下載百分比或速度分數提升。
- PR #17：圖片優先度兩版實驗完成，第二版消除新增的同步排版讀取，但對照未顯示足夠效益，已關閉而未合併。正式站維持原卡片載入策略。

- 重新量測正式站目前 main：效能 54、無障礙 100、最佳實務 96、SEO 100。
- 只讀確認 Firebase 使用者清單恰有 1 個管理員帳號；未建立測試帳號。
- 記錄模擬 LCP 10.1 秒與分解時間差異，保留診斷線索，不推定 Firebase 為原因。
- 更新唯一現行狀態報告與效能操作說明。

目前 main 最新報告：https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/n4yt7foqin?form_factor=desktop

PR18已完成：使用者預覽登入後，新增／編輯表單焦點、Tab、Escape、取消、13張圖資料帶入與新增表單重設均正常；未儲存、發布或刪除文章。合併衝突已用完全相同的測試內容解決，最終僅8行CSS。合併eb531e2，Netlify正式部署6ac5c40fcddc8d00092fbdd1已Published；正式CSS、管理員表單開關、文章直連及16張縮圖均已確認。最新正式效能桌機81／手機55，無障礙100／最佳實務96／SEO100。詳見closed-modal-rendering/result.md。

## 剩餘工作

慢速基準已於2026-10-17取得並解析：新Trace確認Slow4G、CPU4x及約375×812。主頁FCP/LCP3.811秒（介紹文字），DOMContentLoaded12.729秒才開始、靜態文章圖片13.826秒才請求；不是新PSI分數，也不可和舊模擬數字直接當前後改善。PR22草稿只提早7個公開初始化呼叫，路由與Firebase同步時序保留；7項本地時序檢查通過。預覽當時仍部署中、瀏覽器工具無法啟動，實際效果待驗證。正式main仍fe8ba28。詳見performance/slow-mobile-analysis.md；不再要求重錄正式站慢速基準。

冷快取對照已取得並完成分析：FCP 約 0.83 秒、最後 LCP 候選約 2.15 秒。基準收集已完成，不需再重錄相同條件。由此界定的 favicon 修訂已部署；圖片優先度實驗已評估且不合併。Performance 仍非 PASS。詳見 performance/cold-cache-analysis.md 與 image-priority/result.md。

已取得並解析 no-throttling.json.gz：FCP 約 0.88 秒、最後 LCP 候選約 1.71 秒。多個資源使用快取，冷快取對照也已完成；原檔保留作再次造訪基準，不能把 Performance 標記 PASS。詳見 performance/no-throttling-analysis.md。

1. 效能：先前正式PSI桌機81／LCP2.108s、手機55／LCP8.563s仍保留為2026-10-07紀錄。新Slow4G實際追蹤已取得，基準收集完成；PR22公開首頁初始化候選待預覽功能與時序對照驗證，不能先宣稱提速或通過Gate。PR19因整體效益不足已關閉。Firebase設定、Auth與同步啟動點未改。
2. 權限：提供既有有效非管理員帳號的登入測試條件。帳號目前不存在，不能在禁止修改 Authentication 的範圍內建立帳號並宣稱完成。
3. 測試圖清理：四張專用 Cloudinary 測試圖未發布文章，等待永久刪除的即時確認；對話中的確認問題已提出，未重複要求一般授權。

失效原圖、手機實機測試為 DEFERRED，非 PASS，依使用者要求不列本輪阻擋。
無需增加其他 AI；剩餘限制為帳號與實際效能證據。沒有修改 Firebase config、ADMIN_UID、Firestore Rules 或 Authentication 設定。

完整證據：release-status-current.md、signed-upload/result.md。
