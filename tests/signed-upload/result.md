# Signed upload — validation and next action

Draft PR: https://github.com/840401win-maker/kai-personal-website/pull/15
Head: 8692c375ed0911317f8de91ff0751dcd2f534448
Main/base: e862164628db568360ff55d1da9e01f1d030a636
Preview: https://deploy-preview-15--kai-personal-website.netlify.app/

20 local tests PASS. Synthetic identities exercise RSA signature verification and claim checks; they are not real Firebase account tests.
Live preview endpoint checks PASS: GET 405, anonymous POST 401, forged-token POST 401, cross-origin POST 403. Responses are no-store. Saved headers and bodies are in this directory. No real image upload was made during these checks.

## 設定順序

1. Cloudinary → Settings → Upload → Upload presets，新增 `blog_signed_upload`，Signing mode 選 Signed。保持圖片格式限制及禁止覆寫。正式站尚在使用舊 `blog_upload`，切換前先保留它。
2. Netlify 專案 → Environment variables，新增 `CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET`、`CLOUDINARY_SIGNED_PRESET`。最後一項值為 `blog_signed_upload`。設定須適用於 Functions、Deploy Previews 及 Production。金鑰直接填入 Netlify，不要貼到對話或程式碼。
3. 重新部署 PR #15 預覽，使用既有管理員登入，測試單張／多張上傳、預覽、封面及浮水印；只使用可清除的測試資料。測試完成前 PR 保持 draft。
4. 通過後合併並部署，確認正式站上傳，再停用舊 unsigned `blog_upload`，才能關閉原本的繞過管道。清理測試資料。

Still pending: actual admin success, existing non-admin account denial, credential/preset configuration and unsigned cutover. Missing original and physical-phone testing are deferred by user, not PASS.
No Firebase config, existing ADMIN_UID, Authentication settings or Firestore Rules changed.

## 2026-10-05 設定進度

- 已在 Cloudinary 建立 `blog_signed_upload`：Signed、overwrite=false、自動產生 public ID；允許 jpg/jpeg/png/webp/gif/avif/heic/heif。舊 unsigned preset 保留至正式切換，沒有刪除圖片。
- Netlify 原本顯示沒有環境變數；已新增 `CLOUDINARY_SIGNED_PRESET=blog_signed_upload`，適用所有 scopes/contexts。免費方案的特定 scope 選項需要升級；本次未升級或付費。
- 使用者確認 API Key / API Secret 尚未設定。已開啟 Secret 表單、填入欄位名稱 `CLOUDINARY_API_SECRET` 並勾選 Contains secret values；沒有填入或儲存金鑰。
- 勾選 Secret 後，Netlify 改為各部署情境分別填值。使用者需把相同 Secret 填入 Production 與 Deploy Previews，其他情境可留空，再按 Create variable。Functions scope 已包含；方案不允許在 UI 單獨縮減 scopes。
- 另外新增 `CLOUDINARY_API_KEY`，填入 Cloudinary API Key，適用 Production 與 Deploy Previews。勿將金鑰貼到對話。
- PR #15 仍為 draft，未合併，主站上傳流程未切換。完成金鑰設定後才重新部署預覽、進行管理員實際上傳測試。

Evidence: preset-created.png and netlify-secret-handoff.png. Authentication non-admin live evidence and performance diagnosis remain pending. Missing original and physical-phone testing remain deferred.

## 2026-10-05 使用者填入金鑰後的確認

- Netlify 已列出三個正確變數。API Key 適用所有 contexts/scopes；API Secret 為 Secret，適用 Builds/Functions/Runtime，Production 與 Deploy Previews 各有值。
- `CLOUDINARY_SIGNED_PRESET` 的 Production、Deploy Previews 值皆確認為 `blog_signed_upload`。沒有揭露或複製金鑰內容；目前只確認存在與範圍，不推定金鑰有效。
- 已重新部署 PR #15，部署 ID `6ac3a42645317b9f85253bda`，head `8692c375ed0911317f8de91ff0751dcd2f534448`。Netlify 顯示 Deploy successful。Evidence: configured-preview-deploy.png。
- 新部署匿名 POST 仍回 401；回應檔 configured-anon.json。
- 正式站已登入管理員，但預覽域名尚未登入。已開啟預覽正常登入視窗，等待使用者輸入既有帳號；不複製正式站登入 token、不修改 Authentication。
- 下一個驗證：預覽管理員實際單張／多張上傳。通過前不合併、不停用舊 unsigned preset，不宣稱 runtime upload PASS。

## Signed cutover completed

Preview: real admin single upload plus subsequent two-file upload PASS. Three watermarked previews loaded; selecting third image put it first in newline-separated URLs. Screenshot admin-upload-pass.png. No article submitted.
PR #15 merged to main 219b3cfa6da4e8d5ba28b6ed40865e1b821ae25f. Production deploy 6ac3a8affc824200088358d4 published; signed client confirmed in served DOM. Real production admin single upload PASS, loaded watermark preview. Screenshot production-upload-pass.png.
Old blog_upload changed from Unsigned to Signed while keeping overwrite=false; blog_signed_upload unchanged. Screenshot unsigned-cutover.png. Actual unsigned upload using old preset returns HTTP 400: Upload preset must be whitelisted for unsigned uploads. Response old-unsigned-denied.json. No asset created by that rejection test.
An ambiguous toggle was rejected by approval review; read-only DOM showed overwrite=true, then explicit setChecked(false) succeeded and saved UI confirmed false. No blocked action bypassed and no overwrite weakening saved.

Four dedicated assets remain for cleanup, all selected and deletion dialog prepared; permanent deletion confirmation pending:
- kai-blog/ac6e06a7-c30d-4e57-96ea-e0674a7ea3dc (preview single)
- kai-blog/298b4e89-8313-4a0c-8402-4e7cd7bb6382 (preview multi)
- kai-blog/fdcabd4b-64bb-45b4-9ad3-c1dad22c4195 (preview multi / selected cover)
- kai-blog/f1595d02-f3f4-405c-8f7e-9196c3a3093a (production single)

No production article/Firestore data modified. Real non-admin identity evidence and performance diagnosis still pending. Existing Firebase config, ADMIN_UID, Authentication settings and Firestore Rules unchanged.

Final public regression: direct production post-30years opens, title/canonical/og:title/og:image match article; carousel contains 16 thumbnails and main image loaded. robots.txt and sitemap.xml HTTP 200, canonical Netlify origin correct. final-robots.txt and final-sitemap.txt preserve responses. Preview upload form cancelled without saving an article; Cloudinary deletion dialog for exactly four assets remains pending immediate confirmation.

## 2026-10-07 remaining evidence
Read-only Firebase Authentication Users inventory lists exactly one existing account, the administrator. Real signed-in non-admin evidence remains unavailable; no account created or Authentication settings changed. Four disposable Cloudinary assets still await specific permanent-deletion confirmation; none deleted. Current-main production performance was freshly measured; see ../release-status-current.md.
