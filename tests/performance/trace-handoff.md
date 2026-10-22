# Remaining performance evidence

更新：兩份要求的紀錄已收到並分析（no-throttling-analysis.md、cold-cache-analysis.md）。下列操作保留供未來對照使用，現在不要求使用者重錄基準。favicon 已由 PR16 修訂至 main6e17f36，PR17 圖片優先度實驗不合併；最新狀態以 ../release-status-current.md 為準。

Latest measured mobile Lighthouse score is 54, FCP 9.9s, LCP 10.1s, TBT 0ms, CLS 0.092. Fresh current-main production measurement of 219b3cf on 2026-10-07: https://pagespeed.web.dev/analysis/https-kai-personal-website-netlify-app/rqlqzwijhe?form_factor=mobile . No field data. Current LCP breakdown is 190ms TTFB + 1,420ms rendering delay; dependency chain includes Listen retries up to 22,065ms. These differences are diagnostic leads, not proof of causality.
Current browser automation does not expose Chrome DevTools trace capture or network/CPU throttling. A viewport-only check cannot diagnose the simulated delay.

## 使用者操作

1. 在 Chrome 無痕視窗開啟 https://kai-personal-website.netlify.app/，保持未登入，避免錄入管理員操作。
2. 按 F12，選 Performance。記錄瀏覽器版本、測試視窗大小與網路條件。
3. 第一份 trace 使用 Network/CPU「No throttling」，按 Record and reload。頁面載入後停止錄製。
4. 在下載選單選 Save trace，保存 JSON 或 JSON.gz；名稱註明 no-throttling。不要附加使用者資料或管理員登入紀錄。
5. 若能再提供一份使用明確 Network/CPU 節流設定的 trace，請寫下所用設定，使用相同視窗、快取條件及未登入狀態，以便比較。

取得 trace 後可分析 LCP 的元素、網路依賴與主執行緒工作，再界定最小修改範圍。不因看到 Firestore Listen 重試就假定 Firebase 是原因，也不先改 Authentication 或 Rules。

Official documentation:
- https://developer.chrome.com/docs/devtools/performance/reference
- https://developer.chrome.com/docs/devtools/performance/save-trace

本項不是手機實機測試；使用者暫緩手機測試不會自動把這份效能證據標為通過。
