# 使用者提供的載入紀錄：初步診斷

後續狀態：冷快取對照已收到並完成分析，下方當時的錄製步驟已完成，不需要重複提供。favicon 修訂已部署，圖片優先度實驗已結束且未合併；以 ../release-status-current.md 為目前狀態。

日期：2026-10-07。輸入：C:/Users/88697/Downloads/no-throttling.json.gz。僅在本機讀取，未傳送原始紀錄至外部服務。

紀錄可正常解壓、解析，來源 DevTools，共 44,435 個事件。metadata 的有效錄製視窗為 6.56 秒（不能以含 ts=0 的 metadata 事件計算錄製長度）。網站主框架導航為正式首頁；僅使用對應 navigationId 計算以下時間，排除子框架 paint。

| 事件 | 導航後時間 |
|---|---:|
| 首次內容顯示 FCP | 879.68 ms |
| 第一個 LCP 候選，首頁段落 | 879.68 ms |
| 最後 LCP 候選，文章卡片圖片 | 1,713.07 ms |
| Firestore Listen 第一個請求開始 | 1,985.55 ms |
| Firebase Auth iframe 文件開始 | 2,539.78 ms |

Firestore Listen 與 Auth iframe 請求開始均晚於最後 LCP 候選；在本次錄製條件下，主要顯示沒有等待這些請求完成。這不代表 SDK 對 CPU／網路完全沒有成本，也不能推論慢速冷快取情境相同。

最後 LCP 候選為 loading=lazy 的卡片圖片，discovery 1,475.30ms、loadStart 1,478.40ms、loadEnd 1,560.70ms，最後顯示 1,713.07ms。主分支 index.html 的 renderPosts 對所有卡片圖片設定 loading=lazy。可評估改善首屏卡片的載入優先度，但尚未以 requestId/nodeId 精確對應最後 LCP 圖片；不能宣稱某一 URL 就是 LCP，也不能把全部卡片改為 eager/high。

主框架主執行緒有 9 個至少 50ms 的 RunTask，最長 297.03ms。這些可能包含字型、解析、樣式、腳本與 DevTools 記錄負擔；尚未逐項歸因，不能稱為 0ms 阻塞，也不能直接與另一份 Lighthouse TBT 比較。

## 測試條件與限制

- metadata 標示 Responsive，但未明確記錄 Network／CPU 節流設定。檔名 no-throttling 不足以獨立證明兩者均關閉。
- 多個字型、Firebase SDK、Cloudinary 圖片 fromCache=true；CSS、部分 JS 的完成 transfer bytes 極小，須保留快取／再驗證影響，不能宣稱冷快取。
- 有 Netlify HUD 注入請求及 about:srcdoc 子框架；目前不歸因其影響。
- 主框架仍使用同一 navigationId；缺 viewport 的明確寬高與未登入狀態證據。沒有讀取或輸出 token、查詢參數。
- 本次 1.71 秒與 PSI 模擬 10.1 秒條件不同，不能以此次單次數據把 Performance gate 改為 PASS。

## 下一個最小步驟

保留原紀錄作為有快取基準；補一份未登入、DevTools Network Disable cache 勾選、Network/CPU No throttling 的 Record and reload 紀錄，保持 DevTools 開啟，固定與此份相同 viewport，註明寬高，命名 cold-cache-no-throttling.json.gz。若此份原本曾開 CPU 節流，需一併註明，不能與新紀錄直接做同條件比較。

得到冷快取紀錄後，比較首屏字型、主執行緒與圖片發現時間，再界定是否只需調整首屏卡片圖片 loading/fetchpriority。此候選範圍只涉及 index.html 圖片呈現；本輪未修改 main、Firebase config、UID、Rules 或 Authentication。

本地網路摘要：no-throttling-network-summary.json，已去掉 URL query／fragment，不保存原始事件或登入憑證。最終 gate 仍 BLOCKED；不需要多個 AI 重建網站。
