# 下一步：慢速網路載入紀錄

更新2026-10-17：Trace-20261017T082326.json.gz已收到並完成分析。Slow4G／CPU4x、約375×812條件已確認；本文件的正式站基準錄製已完成，不要再重錄。分析見slow-mobile-analysis.md。下一步先等PR22預覽部署完成，再驗證公開功能與候選版本的載入時序；只有需要前後對照時，才使用相同條件錄製預覽網址。

2026-10-17，已核對正式 main 為 fe8ba2828a00009833573db5c4b0f6d15ef758b0（PR21 已上線）。本次請使用正式站，而不是21預覽，避免把預覽工具列與測試狀態混入對照。

先前的兩份 No throttling 紀錄已收到、分析完成，不用重錄。現在缺的是有明確慢速網路設定的實際載入紀錄，用來找出手機模擬 LCP 偏慢的原因。這不是手機實機測試。

1. 用電腦 Chrome 無痕視窗開啟 https://kai-personal-website.netlify.app/，保持未登入。
2. 按 F12，按 Ctrl+Shift+M 開啟裝置模式，選 Responsive，設定375×812。這次記錄這個尺寸，以後對照使用同樣尺寸。
3. 選 Performance（效能）。在 Environment settings／Capture settings 設定 Network = Slow 4G，CPU = 4x slowdown，勾選 Disable network cache／Disable cache。若版本選單沒有這個 CPU 選項，記下實際選項名稱，不必猜測換算。
4. 按 Record and reload（錄製並重新載入）。保持首頁，不登入、不開其他頁面。讓首頁圖片和文章出現後再停止；若有持續背景連線，約30秒即可停止，不必等所有連線結束。
5. 點下載／Save trace，保留預設的去識別化設定，不選擇加入敏感資訊或完整資源內容。存成 slow-4g-cold-cache.json.gz（或.json）。
6. 將檔案附到對話，並寫下 Chrome 版本、Network 選項、CPU 選項、375×812及 Disable cache 已勾選。不要附管理員登入過程或密碼。

這組條件是為了可重現診斷，不宣稱與 PageSpeed 的 Lighthouse 模擬完全相同。收到紀錄後，再依 LCP 元素、字型、網路依賴及主執行緒的證據提出最小修改；不先改 Firebase、Rules 或 Authentication。

操作依據：[Chrome 效能面板](https://developer.chrome.com/docs/devtools/performance/overview)、[保存效能紀錄](https://developer.chrome.com/docs/devtools/performance/save-trace)。
