# BNI Nexus 引薦平台 — 部署指南

## 整體架構
- **前端 + 後端**：Next.js，部署到 Vercel（免費）
- **資料庫**：Google Sheets（免費，資料自動儲存，可直接查閱及匯出）

---

## 第一步：準備 Google Sheets 資料庫

1. 前往 https://sheets.google.com，建立新試算表
2. 將第一個工作表（Sheet1）重新命名為 **引薦需求**
3. 記下網址中的 Spreadsheet ID，例如：
   `https://docs.google.com/spreadsheets/d/【這裡就是ID】/edit`

---

## 第二步：建立 Google Service Account

1. 前往 https://console.cloud.google.com
2. 建立新項目（或選擇現有項目）
3. 左側選單 → **API 和服務** → **已啟用的 API 和服務**
4. 點擊「+ 啟用 API 和服務」，搜尋並啟用 **Google Sheets API**
5. 左側選單 → **API 和服務** → **憑證**
6. 點擊「+ 建立憑證」→ 選擇「服務帳戶」
7. 填寫名稱（如 nexus-referral），點擊建立並繼續
8. 角色選擇「編輯者」，點擊完成
9. 點擊剛建立的服務帳戶 → 選擇「金鑰」標籤
10. 點擊「新增金鑰」→「建立新金鑰」→ 選擇 **JSON** → 下載

11. **重要**：回到 Google Sheets，點擊右上角「共用」，
    將服務帳戶的 email（格式：xxx@xxx.iam.gserviceaccount.com）
    加入為**編輯者**

---

## 第三步：部署到 Vercel

1. 在 GitHub 建立新 repository，上傳本專案所有檔案
2. 前往 https://vercel.com，用 GitHub 帳號登入
3. 點擊「Add New Project」，選擇剛建立的 repository
4. 點擊「Deploy」（Framework 會自動偵測為 Next.js）

### 設定環境變數（重要！）

在 Vercel 項目設定 → **Environment Variables**，新增以下兩個變數：

**變數 1**
- Name：`GOOGLE_SHEET_ID`
- Value：第一步記下的 Spreadsheet ID

**變數 2**
- Name：`GOOGLE_SERVICE_ACCOUNT_JSON`
- Value：第二步下載的 JSON 檔案**整個內容**（複製貼上）

5. 設定完成後，點擊「Redeploy」重新部署

---

## 完成！

部署成功後，Vercel 會提供一個網址（如 `nexus-referral.vercel.app`），
將此網址分享給所有 BNI Nexus 會友即可。

### 可選：設定自訂網域
在 Vercel 項目設定 → **Domains**，可綁定自己的網域（如 `referral.nexusbni.com`）

---

## 資料查閱

所有登記的引薦需求會即時儲存到 Google Sheets，
你可以直接在 Google Sheets 查閱，或在網站公告欄點擊「匯出 Excel」下載。

---

## 項目檔案結構

```
nexus-referral/
├── lib/
│   ├── data.js          # 會友名單及常數
│   └── sheets.js        # Google Sheets 讀寫工具
├── pages/
│   ├── api/
│   │   ├── referrals.js # API：讀取 / 新增引薦需求
│   │   └── export.js    # API：匯出 Excel
│   ├── _app.js
│   └── index.js         # 主頁面（首頁、表格、公告欄）
├── styles/
│   └── globals.css
├── next.config.js
├── package.json
└── README.md
```
