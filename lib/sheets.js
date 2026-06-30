import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "引薦需求";

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function getSheets() {
  const auth = await getAuth();
  return google.sheets({ version: "v4", auth });
}

// Ensure header row exists
export async function ensureHeaders(sheets) {
  const headers = [
    "ID", "編號", "姓名", "職業", "公司", "行業類別",
    "引薦類型", "目標行業", "詳細說明", "截止日期", "登記日期", "時間戳"
  ];
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:L1`,
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}

export async function getAllReferrals() {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:L`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      id:             r[0]  || "",
      memberId:       r[1]  || "",
      memberName:     r[2]  || "",
      role:           r[3]  || "",
      company:        r[4]  || "",
      category:       r[5]  || "",
      referralType:   r[6]  || "",
      targetCategory: r[7]  || "",
      description:    r[8]  || "",
      deadline:       r[9]  || "",
      date:           r[10] || "",
      timestamp:      parseInt(r[11] || "0", 10),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function addReferral(entry) {
  const sheets = await getSheets();
  await ensureHeaders(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        entry.id,
        entry.memberId,
        entry.memberName,
        entry.role,
        entry.company,
        entry.category,
        entry.referralType,
        entry.targetCategory || "",
        entry.description,
        entry.deadline || "",
        entry.date,
        entry.timestamp,
      ]],
    },
  });
}
