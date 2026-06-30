import { getAllReferrals } from "../../lib/sheets";
import { MEMBERS, CATEGORY_LABELS, REFERRAL_TYPES } from "../../lib/data";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const referrals = await getAllReferrals();
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toLocaleDateString("zh-HK").replace(/\//g, "-");

    // Sheet 1: 所有引薦需求
    const s1Headers = ["編號","姓名","職業","公司","行業類別","引薦類型","目標行業","詳細說明","登記日期"];
    const s1Rows = referrals.map(r => [
      r.memberId, r.memberName, r.role, r.company,
      r.category ? `${r.category}. ${CATEGORY_LABELS[r.category]||""}` : "-",
      r.referralType,
      r.targetCategory ? `${r.targetCategory}. ${CATEGORY_LABELS[r.targetCategory]||""}` : "-",
      r.description, r.date,
    ]);
    const ws1 = XLSX.utils.aoa_to_sheet([s1Headers, ...s1Rows]);
    ws1["!cols"] = [8,14,14,22,16,20,16,42,12].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws1, "所有引薦需求");

    // Sheet 2: 按行業分類
    const s2Headers = ["行業類別","編號","姓名","職業","公司","引薦類型","目標行業","詳細說明","登記日期"];
    const s2Rows = [];
    Object.entries(CATEGORY_LABELS).forEach(([cat, label]) => {
      const items = referrals.filter(r => r.category === cat);
      if (!items.length) return;
      s2Rows.push([`${cat}. ${label}`,"","","","","","","",""]);
      items.forEach(r => s2Rows.push([
        "", r.memberId, r.memberName, r.role, r.company, r.referralType,
        r.targetCategory ? `${r.targetCategory}. ${CATEGORY_LABELS[r.targetCategory]||""}` : "-",
        r.description, r.date,
      ]));
      s2Rows.push(Array(9).fill(""));
    });
    const ws2 = XLSX.utils.aoa_to_sheet([s2Headers, ...s2Rows]);
    ws2["!cols"] = [16,8,14,14,22,20,16,42,12].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws2, "按行業分類");

    // Sheet 3: 按引薦類型
    const s3Headers = ["引薦類型","編號","姓名","職業","公司","行業","目標行業","詳細說明","登記日期"];
    const s3Rows = [];
    REFERRAL_TYPES.forEach(type => {
      const items = referrals.filter(r => r.referralType === type);
      if (!items.length) return;
      s3Rows.push([type,"","","","","","","",""]);
      items.forEach(r => s3Rows.push([
        "", r.memberId, r.memberName, r.role, r.company,
        r.category ? `${r.category}. ${CATEGORY_LABELS[r.category]||""}` : "-",
        r.targetCategory ? `${r.targetCategory}. ${CATEGORY_LABELS[r.targetCategory]||""}` : "-",
        r.description, r.date,
      ]));
      s3Rows.push(Array(9).fill(""));
    });
    const ws3 = XLSX.utils.aoa_to_sheet([s3Headers, ...s3Rows]);
    ws3["!cols"] = [22,8,14,14,22,16,16,42,12].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws3, "按引薦類型");

    // Sheet 4: 會友名冊
    const s4Headers = ["編號","類別","行業","姓名","職業","公司","已登記需求數"];
    const s4Rows = MEMBERS.map(m => [
      m.id, m.category, CATEGORY_LABELS[m.category]||"",
      m.name, m.role, m.company,
      referrals.filter(r => r.memberName === m.name).length,
    ]);
    const ws4 = XLSX.utils.aoa_to_sheet([s4Headers, ...s4Rows]);
    ws4["!cols"] = [8,8,14,14,20,28,14].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws4, "會友名冊");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''BNI_Nexus%E5%BC%95%E8%96%A6%E9%9C%80%E6%B1%82_${dateStr}.xlsx`);
    return res.status(200).send(buf);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "匯出失敗" });
  }
}
