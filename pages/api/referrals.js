import { getAllReferrals, addReferral } from "../../lib/sheets";
import { MEMBERS } from "../../lib/data";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const referrals = await getAllReferrals();
      return res.status(200).json({ referrals });
    }

    if (req.method === "POST") {
      const { memberName, referralType, targetCategory, description, deadline } = req.body;

      if (!memberName || !referralType || !description) {
        return res.status(400).json({ error: "缺少必填欄位" });
      }

      const member = MEMBERS.find((m) => m.name === memberName) || {};
      const now = Date.now();
      const entry = {
        id:             now.toString(),
        memberId:       member.id       || "",
        memberName:     memberName,
        role:           member.role     || "",
        company:        member.company  || "",
        category:       member.category || "",
        referralType,
        targetCategory: targetCategory  || "",
        description,
        deadline:       deadline        || "",
        date: new Date().toLocaleDateString("zh-HK", {
          year: "numeric", month: "2-digit", day: "2-digit",
        }),
        timestamp: now,
      };

      await addReferral(entry);
      return res.status(200).json({ success: true, entry });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "伺服器錯誤，請稍後再試" });
  }
}
