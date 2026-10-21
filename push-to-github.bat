@echo off
chcp 65001 >nul
echo ===================================================
echo 正在推送 Kai Personal Website 最新整合版本至 GitHub...
echo ===================================================
"C:\Users\88697\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" -C "C:\Users\88697\.gemini\antigravity\scratch\kai-personal-website" push origin test-merge:ux/mobile-article-reading
"C:\Users\88697\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" -C "C:\Users\88697\.gemini\antigravity\scratch\kai-personal-website" push origin test-merge:main
echo.
echo ✅ 推送完成！Netlify 將自動開始部署正式站。
pause
