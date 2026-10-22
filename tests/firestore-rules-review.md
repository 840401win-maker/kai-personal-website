# Firestore Rules 唯讀審查

來源：使用者已登入的 Firebase Console，kainursinglife / (default) / 規則。
讀取帶星號版本：2026-08-09 00:18（控制台顯示）。未編輯、未發布、未寫入或刪除文件。

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null
                    && request.auth.uid == 'mYD4xk4Ii1aQI7DZSzC1kwllp5z1';
    }
  }
}
```

結論：posts 權限條件靜態審查 PASS。read 公開；create/update/delete 限指定登入 UID，與此前 main firebase.js 的 ADMIN_UID 一致。此規則沒有時間到期開放寫入條件，也沒有其餘 collection 的 allow。

限制：未執行 Rules 模擬或 production CRUD，所以 Firestore/Auth runtime Gate 仍待驗證。規則未限制文件欄位/型別或 content HTML，不能據此解除前端 raw HTML 信任邊界風險。管理員與 Admin SDK 等特權途徑仍需維持可信內容。

本紀錄補充 phase-5-final-gate.md：其中「正式 Rules 未取得」已被本次證據解決；其他 blockers 不变。V1.1 final-production-ready 仍為 BLOCKED。
