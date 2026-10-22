# 手機閱讀、收藏與分享整合候選

更新：2026-10-17。依使用者要求，直接修訂集中完成，實際操作留待最後一次驗收。

- PR23：https://github.com/840401win-maker/kai-personal-website/pull/23
- 候選：12113a10cb7b2d340b627f16a8ced92060b4673d；分支ux/mobile-article-reading。e336717後僅補短橫向視窗CSS，JavaScript不變。
- 預覽：https://deploy-preview-23--kai-personal-website.netlify.app/
- Netlify部署6ad3174ec5203a77cf644a7d，commit為12113a1。GitHub該commit的deploy-preview狀態success；更新後CSS與候選比對一致。
- main仍fe8ba2828a00009833573db5c4b0f6d15ef758b0；草稿未合併，正式站未更新。

## 已完成的直接修訂

1. 承接先前手機閱讀、輪播防誤觸、圖片放大退出與焦點、字級保存、捲動位置與回頂。
2. 新增「只看收藏」、目前文章中的收藏數、無收藏引導，可組合分類／標籤／搜尋／排序。過期或非true的收藏不計入；只看收藏狀態不另存偏好。
3. 移除收藏卡片後，若原焦點在卡片區，移至仍可使用的收藏篩選；文章視窗內取消收藏不移焦至背景。卡片與文章收藏按鈕提供aria-pressed。
4. 搜尋加上明確名稱、鍵盤搜尋提示與44px清除按鈕。清除只清關鍵字，保留其餘篩選；「重設所有篩選條件」也關閉只看收藏，保留排序。手機搜尋字級1rem。
5. 系統分享以使用者點擊觸發，傳入當前文章標題與目前網址，保留LINE與IG入口。未支援或非取消錯誤時改複製；AbortError安靜結束，不自動複製或宣稱已送達。
6. 剪貼簿失敗後嘗試選取式備援；只在回傳true時提示複製成功。失敗顯示從網址列手動複製提示；暫存textarea放在開啟中的文章視窗內，結束後刪除並還原焦點。
7. 手機底部分享／連結改兩欄換列，容納四個入口；480–639px且高度不超過480px的橫向小視窗，把六個底部操作合併為三欄兩列，避免工具列占滿閱讀區。實際高度仍待版面驗收。
8. 搜尋或收藏結果為空，仍呼叫既有pending route解析，避免延後到達的Firestore文章被空結果阻擋。parseRoute、initRouting及路由計時器不變。

僅index.html與css/style.css變更；GitHub變更檔案清單再次確認。靜態文章資料與LINE分享函式比對一致。Firebase設定、ADMIN_UID、Rules、Authentication、Firestore讀寫、上傳、Edge SEO、Netlify設定及Cloudinary素材均未修改。未帶入PR22效能候選。

## 驗證及限制

- check-browse-share.cjs：22項，涵蓋組合篩選、過期收藏、空狀態、pending路由、清除／重設、移除焦點、分享成功／取消／不支援／拒絕、複製成功／false／例外、暫存控制清理與焦點。
- check-reader.cjs：16項閱讀工具行為及完整內嵌語法。
- check-regression.cjs：18項輪播手勢、鍵盤與圖片控制。
- 合計56項本地模擬行為檢查通過，並非56項實機測試。
- HTTP首頁200（122826 bytes）；CSS補短橫向排列後再次取得200且內容比對一致。check-delivery.cjs確認候選所有內嵌程式與送出版本一致、CSS一致，新增控制存在且ID唯一。此項是額外部署內容檢查，不計入56項。
- 工具不能啟動瀏覽器，未取得此次版面截圖、原生分享／剪貼簿、真實手勢、讀屏證據。依使用者指示集中至最後操作，不以靜態與mock測試推定runtime PASS。
- API限制參考：[MDN分享](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)、[MDN剪貼簿](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)。系統分享的可用性及回傳時間因平台而異，所以不顯示「已送達」。

這批已界定的直接實作完成，後續依集中驗收結果修缺陷，不先擴增更多功能。集中清單見../final-validation-checklist.md。原V1.1仍為Authentication／Performance兩項缺證據；此UX候選尚未通過實際UI／Regression驗收，不能標記final-production-ready。
