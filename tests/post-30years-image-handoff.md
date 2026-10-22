# post-30years 圖片修正交接
Cloudinary 環境：p6esflub。UI 顯示 16 uploaded，16 個頁碼齊全。
首圖預覽確認「我30歲了（回顧及下一段旅程）」。
首圖 Delivery URL 由 Cloudinary Embed 視窗直接確認。其餘 URL 依各資產已顯示的版本、名稱及同批 PNG 匯出組成，尚未逐張直接載入驗證；實作前需逐張確認可用及內容順序。
未修改 repository、Firestore 或 Cloudinary 資產。

|頁碼|圖片 URL|
|---|---|
|1|https://res.cloudinary.com/p6esflub/image/upload/v1790988449/1_ykf8js.png|
|2|https://res.cloudinary.com/p6esflub/image/upload/v1790988449/2_ruymde.png|
|3|https://res.cloudinary.com/p6esflub/image/upload/v1790988448/3_hz5gne.png|
|4|https://res.cloudinary.com/p6esflub/image/upload/v1790988448/4_w4o4si.png|
|5|https://res.cloudinary.com/p6esflub/image/upload/v1790988448/5_wldlt9.png|
|6|https://res.cloudinary.com/p6esflub/image/upload/v1790988450/6_sfxbx3.png|
|7|https://res.cloudinary.com/p6esflub/image/upload/v1790988450/7_frqafy.png|
|8|https://res.cloudinary.com/p6esflub/image/upload/v1790988450/8_veonyo.png|
|9|https://res.cloudinary.com/p6esflub/image/upload/v1790988452/9_zkxlg0.png|
|10|https://res.cloudinary.com/p6esflub/image/upload/v1790988449/10_eab3ie.png|
|11|https://res.cloudinary.com/p6esflub/image/upload/v1790988453/11_rhxvac.png|
|12|https://res.cloudinary.com/p6esflub/image/upload/v1790988453/12_qkusll.png|
|13|https://res.cloudinary.com/p6esflub/image/upload/v1790988455/13_ylkahv.png|
|14|https://res.cloudinary.com/p6esflub/image/upload/v1790988452/14_zlx9xm.png|
|15|https://res.cloudinary.com/p6esflub/image/upload/v1790988452/15_wgybsj.png|
|16|https://res.cloudinary.com/p6esflub/image/upload/v1790988454/16_rtvhi0.png|

## 給 Claude 的修正範圍
以最新 GitHub main 為來源，先核對 post-30years 現況。
只更新 index.html 中該 static post 的 image 與 images：image 使用第1張，images依上述1至16排序。
同步 netlify/edge-functions/article-metadata.js 中 post-30years 的 image 為同一首圖，維持現有f_auto/q_auto渲染策略。
不要新增同名Firestore文章，不更動其他文章、Firebase config、ADMIN_UID、Rules或Authentication。
先逐張確認公開圖片URL與頁序，缺圖或內容不符就回報，不猜測。
驗證首頁首圖、/post/post-30years直接開啟、16張輪播、mobile顯示、fallback及article OG/Twitter/JSON-LD image。
圖片內容目前僅首圖已由GPT視覺確認，不能聲稱其餘15張已逐頁審查。
此次交接僅圖片問題；malformed-route問題另立修正範圍。

