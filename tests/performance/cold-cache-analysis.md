# 冷快取對照診斷

後續結果：PR16 favicon 修訂已部署；PR17 圖片優先度實驗功能正常但沒有足夠效能效益，已關閉而未合併。下方最小改善範圍為當時的診斷提案，最新決策見 ../release-status-current.md、../image-priority/result.md。

分析日期：2026-10-07。來源：C:/Users/88697/Downloads/cold-cache-no-throttling.json.gz，僅本機讀取。44,657 個事件，有效錄製視窗 17.79 秒，正式首頁主框架導航。

| 指標 | 上一份有快取基準 | 這份冷快取紀錄 |
|---|---:|---:|
| FCP | 879.68ms | 830.84ms |
| 最後 LCP 候選 | 1,713.07ms | 2,147.72ms |
| 至少 50ms 的主框架 RunTask | 9 | 11 |
| 最長上述工作 | 297.03ms | 335.15ms |

主文件、CSS、應用 JS、Firebase SDK、字型與首屏圖片均 fromCache=false 且有實際傳輸位元組，支持停用主頁快取。獨立 Auth 子框架的 iframe.js 仍 fromCache=true；不能宣稱所有框架的每一個資源都冷快取。metadata 未記錄節流參數；No throttling 依使用者操作條件，非從檔名獨立證明。

兩份 Responsive 紀錄的文字 LCP 面積不同（42,718 vs 46,308），圖片候選 nodeId 也不同；不應聲稱視窗條件完全一致，不以單次差異證明修訂效果。無需因此再錄相同基準；若之後驗證修正效果，要固定尺寸。

## 已確認的觀察

1. 首屏文字 830.84ms 已顯示，早於 Firebase SDK 完成（約 1,380–1,383ms）。Firestore Listen 第一個請求開始於 2,121.09ms，略早於最後圖片 LCP 2,147.72ms，第一個回應完成 2,185.23ms，晚於該 LCP。Auth iframe 文件 3,217.17ms 才開始。本次主內容不需等待 Listen 回應或 Auth iframe 完成，不能據此要求改 Rules/Auth，也不能宣稱 SDK 毫無成本。
2. 最後 LCP nodeId=263。PaintImage 同 nodeId 的 URL 明確對應 https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80，即 post-9years 的 featured 卡片圖片。候選記錄 loadingAttr=lazy，discovery 1,688.20ms、loadStart 1,759.10ms、loadEnd 1,875.40ms、paint 2,147.72ms。主分支 renderPosts 對所有文章卡片同樣設定 loading=lazy。需區分晚發現、開始延遲及載入後繪製時間；單改 loading 不會消除所有成本。
3. favicon 與首頁頭像同源，但 href 沒有尺寸上限。完整 11_skvgrb.png 請求約 1,723.57ms 開始，encodedDataLength=252,146 bytes。頭像 w_256 僅 19,027 bytes。HTML rel=icon 指向完整 URL，支持 favicon 作為該額外請求的來源；不應將縮小 favicon 宣稱為已證明的 LCP 改善。
4. 冷快取下載 Noto Sans TC 25 個 woff2 資源，encodedDataLength 合計 1,357,534 bytes；Font Awesome 三個字型合計 285,077 bytes。數字為本次 trace 的資源傳輸計數，包含相關網路計數語意，不等同檔案原始大小或所有訪客的必然成本。字型傳輸可再優化，但涉及中文覆蓋、字重、圖示與視覺回歸，不適合一次替換整套字型。
5. 長工作主要包括 Layout／UpdateLayoutTree、多個 rAF／postMessage 工作，以及 Decode Image（約 73.63ms）。例如 335.15ms 工作含 Layout 265.67ms；238.98ms postMessage 工作含 Layout 237.83ms。仍有 Netlify HUD 和記錄工具成本，不能把所有工作歸為應用 JS 或 Firebase。

## 最小改善範圍

第一個可獨立落地的低風險修改：只限制 favicon Cloudinary 尺寸，保持同一圖片來源與其餘 meta／頭像／文章圖不變。先製作預覽並確認小圖示格式、顯示、請求大小；不得承諾分數提升。

第二個獨立候選：僅為首屏 featured 卡片評估 eager／fetchpriority，其他卡片維持 lazy。須先確定手機首屏是否包含該卡片，並比較固定 viewport 的冷載入及圖片競爭；不把所有圖片設為 high，不動 Firestore 回讀／初始化時序。

字型與 Layout 作為後續分析項目，不在上述兩項中混改。Firebase config、ADMIN_UID、Authentication、Firestore Rules 不屬本次修正範圍。

## Gate 判定

本機冷載入最後 LCP 候選約 2.15 秒，沒有重現 PSI 模擬 10.1 秒。但只有單次未節流實驗，沒有慢速行動測試的改善前後結果或 field data，Performance gate 不直接改 PASS。現在已有具體圖片傳輸／優先度診斷線索，不再要求使用者重複錄製同一基準。原圖與手機實機仍依使用者要求暫緩；非管理員身分證據與四張測試圖清理另外待辦。

摘要：cold-cache-summary.json。未將原始 trace、登入資料或 URL query 傳至外部模型。
