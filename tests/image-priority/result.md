# 可見文章圖優先度實驗

最終結論：PR #17 已關閉、未合併。正式站沒有這個 helper 或 observer。實驗有功能證據，但沒有足夠的效能效益支持新增程式複雜度；不是等待使用者一般授權。

PR #17，head 3cdd95ce32d0583eb330a5607b162ea618dca70e，Netlify preview deploy 6ac5325763866000084a0e8f。只修改 index.html 的渲染 helper 與一個呼叫。

最終候選策略：使用一次性 IntersectionObserver 提供的交集，只把可見面積最大的一張改為 eager/high，隨即 disconnect；畫面外保留 lazy，文章直連與不支援 observer 的瀏覽器維持既有策略。實際 Firestore 文章數／排序會改變首屏，因此不寫死 post-9years 或 featured 索引。最終候選 head 7d07d42d4b4f7a19d9890e9896510f1363e71d43，避免同步 geometry reads。

本地五個政策情境與 inline JS 語法 PASS。預覽桌機 content viewport 1425×900：恰一張 eager/high，其餘 lazy；抽樣圖片載入正常。375×812 override 的實際 content viewport 為 360×812：文章圖在首屏下方，high/eager 皆 0，clientWidth=scrollWidth=360。搜尋單篇、空結果與 popular/newest 排序 PASS。選項恢復時曾誤用不存在的 date 值，讀取真實 options 後改用 newest 成功。

文章直連 post-30years：首頁 highCount=0，正確標題、16 縮圖、主圖載入。截圖 desktop-preview.png、mobile-preview.png。

第一版未合併：PSI 桌機基準 PR16 63 分，LCP 2.5s、TBT 10ms、CLS .234；同步 geometry 候選 PR17 62 分，LCP 2.7s、TBT 0ms、CLS .234。單次差異不證明因果，但報告明確把 61ms 強制排版歸到新增 helper。已用原生 intersection 資料重寫，沒有保留同步 geometry 查詢。最終本地政策檢查另含 observer disconnect、無同步 geometry read 及不支援瀏覽器回退，皆 PASS。新版 PSI 重測中，未合併。

比較 URL：基準 https://pagespeed.web.dev/analysis/https-deploy-preview-16--kai-personal-website-netlify-app/grrxt3aokm?form_factor=desktop ；第一版 https://pagespeed.web.dev/analysis/https-deploy-preview-17--kai-personal-website-netlify-app/792317rj8p?form_factor=desktop 。預覽 SEO 69 是索引封鎖稽核，不能當成正式站 SEO 退步；兩份同樣 69。本輪未修改 robots／canonical 或索引設定。

最終 observer 版本報告：https://pagespeed.web.dev/analysis/https-deploy-preview-17--kai-personal-website-netlify-app/2vxzihw5k8?form_factor=desktop 。桌機 62，FCP 1.892s、LCP 2.452s、TBT 24ms、SI 2.762s、CLS .234；手機 54，FCP 9.9s、LCP 10.1s、TBT 7ms、CLS .089。LCP 單次小幅差異不證明改善，SI 較基準更慢。新版強制排版報告僅列未知來源 237ms 和 Netlify HUD 0ms，不再列本 helper。

最終 head 桌機 DOM 確認 usesObserver=true、readsGeometry=false、disconnects=true，恰一張 eager/high。文章直連仍有16thumbs、loaded main、首頁high=0。最終 mobile override 雖呼叫成功，實際 DOM viewport 仍1265×720（新 tab 也如此）；不把這次當手機實測 PASS。第一版真正360×812測試與本地 mobile contract 有效，但不能替代最終 head 手機 runtime 證據。所有 temporary viewport override 已 reset。

實驗結束，不再要求使用者重錄基準來支持無明確效益的改動。下一個可評估範圍為字型傳輸與穩定首屏排版，需另立小範圍方案，不能重構 Firebase 或混改功能。
