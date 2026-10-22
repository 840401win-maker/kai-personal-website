# Favicon 尺寸改善

2026-10-07。PR #16 已通過預覽、合併，main 6e17f3669d76db6f4858b5b47e53d935185cf51a。只有 index.html 的 rel=icon href 一行修改。

同一肖像來源改為 Cloudinary c_limit,w_64,h_64/f_png,q_auto，保持長寬比與 image/png。公開回應 HTTP 200 image/png，51×64，body 3,629 bytes。原始冷 trace 完整 favicon 請求計數為 252,146 bytes；兩者的 body 與 trace transfer 計數語意不同，不宣稱精準百分比或 LCP／Lighthouse 分數改善。

實際預覽 c04addd 有新 href，原頭像仍 w_256，首頁標題及抽樣文章圖片正常。正式站 post-30years reload 確認新 favicon href、文章標題、16 個縮圖與已載入主圖。新圖示視覺仍是原肖像。證據：headers.txt、favicon.png、preview.png、production.png。

未修改 Firebase config、ADMIN_UID、Authentication、Firestore Rules、SEO、文章資料或其他圖片。無需為一行網址變更新增實作鏡像測試。
