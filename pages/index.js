import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import {
  MEMBERS, CATEGORY_LABELS, CATEGORY_COLORS, REFERRAL_TYPES, TYPE_COLORS,
} from "../lib/data";

export default function Home() {
  const [view, setView] = useState("home");
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    memberName: "", referralType: "", targetCategory: "", description: "",
  });
  const [errors, setErrors] = useState({});

  const [filterCat, setFilterCat]   = useState("全部");
  const [filterType, setFilterType] = useState("全部");
  const [hotOnly, setHotOnly]       = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField]   = useState("date");

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/referrals");
      const data = await res.json();
      setReferrals(data.referrals || []);
    } catch {
      setError("載入資料失敗，請重試。");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (view === "board") fetchReferrals();
  }, [view, fetchReferrals]);

  function getMember(name) {
    return MEMBERS.find((m) => m.name === name) || {};
  }

  function validate() {
    const e = {};
    if (!form.memberName)        e.memberName    = "請選擇您的姓名";
    if (!form.referralType)      e.referralType  = "請選擇引薦類型";
    if (!form.description.trim()) e.description  = "請填寫詳細說明";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setForm({ memberName: "", referralType: "", targetCategory: "", description: "" });
      setErrors({});
    } catch {
      setError("提交失敗，請稍後再試。");
    }
    setSubmitting(false);
  }

  function handleExport() {
    window.open("/api/export", "_blank");
  }

  // Count how many distinct members are targeting each industry category
  const targetCategoryCounts = referrals.reduce((acc, r) => {
    if (!r.targetCategory) return acc;
    if (!acc[r.targetCategory]) acc[r.targetCategory] = new Set();
    acc[r.targetCategory].add(r.memberName);
    return acc;
  }, {});
  const hotCategories = Object.entries(targetCategoryCounts)
    .filter(([, members]) => members.size >= 2)
    .map(([cat]) => cat);

  const filtered = referrals
    .filter((r) => {
      const matchCat  = filterCat  === "全部" || r.category    === filterCat;
      const matchType = filterType === "全部" || r.referralType === filterType;
      const matchHot  = !hotOnly || hotCategories.includes(r.targetCategory);
      const matchSearch = !searchText ||
        [r.memberName, r.role, r.company, r.description].some((f) => f && f.includes(searchText));
      return matchCat && matchType && matchHot && matchSearch;
    })
    .sort((a, b) =>
      sortField === "date"
        ? b.timestamp - a.timestamp
        : a.memberName.localeCompare(b.memberName, "zh-HK")
    );

  const selStyle = (err) => ({
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${err ? "#c8102e" : "#dde3ee"}`,
    borderRadius: 9, fontSize: 14, background: "#f8fafd", color: err ? undefined : undefined,
  });

  // Fun stat for homepage — find the busiest category by referral count (loaded lazily)
  const [homeStats, setHomeStats] = useState({ total: 0, hotCategory: "" });
  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then((d) => {
        const refs = d.referrals || [];
        const counts = {};
        refs.forEach((r) => { if (r.category) counts[r.category] = (counts[r.category] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        setHomeStats({
          total: refs.length,
          hotCategory: top ? `${top[0]}. ${CATEGORY_LABELS[top[0]]}` : "",
        });
      })
      .catch(() => {});
  }, []);

  // ── HOME ──
  if (view === "home") return (
    <>
      <Head>
        <title>BNI Nexus 引薦平台</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#0a0a0a", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "100%", background: "linear-gradient(135deg, transparent 30%, #c8102e 30%)", zIndex: 0 }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: "43%", height: "100%", background: "linear-gradient(135deg, transparent 30%, #a00c24 30%)", zIndex: 0, opacity: 0.5 }} />
        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, background: "#c8102e", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16, border: "2px solid rgba(255,255,255,0.2)" }}>BNI</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: 3 }}>NEXUS CHAPTER</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: 2 }}>十大行業聯盟</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 40px 60px" }}>
            <div style={{ color: "#c8102e", fontWeight: 900, fontSize: 13, letterSpacing: 4, marginBottom: 16, textTransform: "uppercase" }}>Member Referral Platform</div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(40px, 8vw, 80px)", lineHeight: 1, letterSpacing: -1, marginBottom: 8 }}>NEXUS</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontWeight: 300, fontSize: "clamp(18px, 3vw, 28px)", letterSpacing: 8, marginBottom: 12 }}>引薦平台</div>
            <div style={{ width: 60, height: 3, background: "#c8102e", marginBottom: 28, borderRadius: 2 }} />
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.9, marginBottom: 10, maxWidth: 440, fontWeight: 600 }}>
              全城最靠譜的「欠人情」登記處 🤝
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 2, marginBottom: 40, maxWidth: 420 }}>
              你缺客戶、缺供應商、缺一個懂你的會計師——<br />
              在這裡講一聲，總有人「啱啱識條女」。<br />
              BNI Nexus 會友專用引薦登記及查閱系統。
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => { setSubmitted(false); setView("form"); }}
                style={{ background: "#c8102e", border: "none", borderRadius: 12, padding: "20px 32px", textAlign: "left", minWidth: 220, transition: "transform 0.18s ease, box-shadow 0.18s ease", boxShadow: "0 4px 14px rgba(200,16,46,0.25)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) rotate(-0.5deg)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(200,16,46,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(200,16,46,0.25)"; }}>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, marginBottom: 6 }}>登記引薦需求</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>講出你的「想搵邊個」→</div>
              </button>
              <button onClick={() => setView("board")}
                style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "20px 32px", textAlign: "left", minWidth: 220, transition: "transform 0.18s ease, background 0.18s ease" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) rotate(0.5deg)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, marginBottom: 6 }}>瀏覽公告欄</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>睇下邊行邊業最渴市 →</div>
              </button>
            </div>

            {homeStats.total > 0 && (
              <div style={{ marginTop: 36, display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 30, padding: "8px 18px", maxWidth: "fit-content" }}>
                <span style={{ fontSize: 16 }}>🔥</span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5 }}>
                  全場已有 <b style={{ color: "#fff" }}>{homeStats.total}</b> 則需求在等緣分
                  {homeStats.hotCategory && <> · 最缺人脈的行業：<b style={{ color: "#e8c547" }}>{homeStats.hotCategory}</b></>}
                </span>
              </div>
            )}
          </div>
          <div style={{ padding: "0 40px 8px" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 1 }}>十個行業，一條心 ——</span>
          </div>
          <div style={{ padding: "0 40px 32px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[k] }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{k}. {v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // ── FORM ──
  if (view === "form") {
    const sel = getMember(form.memberName);
    return (
      <>
        <Head><title>登記引薦需求 | BNI Nexus</title></Head>
        <div style={{ minHeight: "100vh", background: "#f4f6fa" }}>
          <div style={{ background: "#0a0a0a", padding: "0 24px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", height: 60, gap: 12 }}>
              <button onClick={() => setView("home")} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 7, padding: "6px 14px", fontSize: 13 }}>← 返回</button>
              <div style={{ background: "#c8102e", borderRadius: 5, padding: "2px 8px", color: "#fff", fontWeight: 900, fontSize: 12, letterSpacing: 1 }}>BNI</div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>NEXUS · 登記引薦需求</span>
            </div>
          </div>
          <div style={{ maxWidth: 700, margin: "32px auto", padding: "0 16px 48px" }}>
            {submitted ? (
              <div style={{ background: "#fff", borderRadius: 18, padding: "56px 32px", textAlign: "center", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "#0a0a0a", fontWeight: 900, marginBottom: 10, fontSize: 22 }}>引薦需求已成功登記！</h2>
                <p style={{ color: "#666", marginBottom: 32, lineHeight: 1.8, fontSize: 14 }}>您的需求已即時發佈至公告欄<br />所有 Nexus 會友均可查閱。</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setSubmitted(false)} style={{ background: "#c8102e", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, color: "#fff", fontSize: 15 }}>再登記一則</button>
                  <button onClick={() => setView("board")} style={{ background: "#0a0a0a", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, color: "#fff", fontSize: 15 }}>查看公告欄</button>
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ background: "#fff8f8", borderRadius: 10, padding: "14px 18px", marginBottom: 28, borderLeft: "4px solid #c8102e" }}>
                  <div style={{ fontWeight: 700, color: "#c8102e", marginBottom: 4, fontSize: 13 }}>📌 填寫須知</div>
                  <div style={{ color: "#666", fontSize: 13, lineHeight: 1.8 }}>此表格供 BNI Nexus 會友登記引薦需求，提交後即時顯示於公告欄供所有會友查閱。</div>
                </div>

                {error && <div style={{ background: "#fff0f2", color: "#c8102e", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 14 }}>{error}</div>}

                <h3 style={{ color: "#0a0a0a", fontWeight: 900, marginBottom: 18, fontSize: 15, paddingBottom: 10, borderBottom: "2px solid #f4f6fa" }}>👤 會友身份</h3>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 700, color: "#222", marginBottom: 7, fontSize: 14 }}>請選擇您的姓名 <span style={{ color: "#c8102e" }}>*</span></label>
                  <select value={form.memberName} style={selStyle(errors.memberName)}
                    onChange={e => { setForm(p => ({ ...p, memberName: e.target.value })); setErrors(p => ({ ...p, memberName: "" })); }}>
                    <option value="">— 請選擇您的姓名 —</option>
                    {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                      const ms = MEMBERS.filter(m => m.category === cat);
                      if (!ms.length) return null;
                      return (
                        <optgroup key={cat} label={`${cat}. ${label}`}>
                          {ms.map(m => <option key={m.name} value={m.name}>{m.id}. {m.name} — {m.role}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                  {errors.memberName && <div style={{ color: "#c8102e", fontSize: 12, marginTop: 5 }}>{errors.memberName}</div>}
                </div>

                {sel.name && (
                  <div style={{ background: "#f4f6fa", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: CATEGORY_COLORS[sel.category] || "#c8102e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 13, flexShrink: 0 }}>{sel.id}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0a0a0a", fontSize: 15 }}>{sel.name}</div>
                      <div style={{ color: "#666", fontSize: 13 }}>{sel.role} · {sel.company}</div>
                      <div style={{ color: CATEGORY_COLORS[sel.category], fontSize: 12, fontWeight: 600, marginTop: 2 }}>{sel.category}. {CATEGORY_LABELS[sel.category]}</div>
                    </div>
                  </div>
                )}

                <h3 style={{ color: "#0a0a0a", fontWeight: 900, margin: "28px 0 18px", fontSize: 15, paddingBottom: 10, borderBottom: "2px solid #f4f6fa" }}>🎯 引薦需求詳情</h3>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 700, color: "#222", marginBottom: 7, fontSize: 14 }}>引薦類型 <span style={{ color: "#c8102e" }}>*</span></label>
                  <select value={form.referralType} style={selStyle(errors.referralType)}
                    onChange={e => { setForm(p => ({ ...p, referralType: e.target.value })); setErrors(p => ({ ...p, referralType: "" })); }}>
                    <option value="">— 請選擇引薦類型 —</option>
                    {REFERRAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.referralType && <div style={{ color: "#c8102e", fontSize: 12, marginTop: 5 }}>{errors.referralType}</div>}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 700, color: "#222", marginBottom: 7, fontSize: 14 }}>目標行業類別（如適用）</label>
                  <select value={form.targetCategory} style={selStyle(false)}
                    onChange={e => setForm(p => ({ ...p, targetCategory: e.target.value }))}>
                    <option value="">— 不限 —</option>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{k}. {v}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 700, color: "#222", marginBottom: 7, fontSize: 14 }}>詳細說明 <span style={{ color: "#c8102e" }}>*</span></label>
                  <textarea value={form.description} rows={4}
                    placeholder="請詳細描述您的引薦需求，包括理想合作對象的規模、特質等..."
                    style={{ ...selStyle(errors.description), resize: "vertical" }}
                    onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErrors(p => ({ ...p, description: "" })); }} />
                  {errors.description && <div style={{ color: "#c8102e", fontSize: 12, marginTop: 5 }}>{errors.description}</div>}
                </div>

                <button onClick={handleSubmit} disabled={submitting}
                  style={{ width: "100%", padding: "15px", background: submitting ? "#999" : "#c8102e", border: "none", borderRadius: 11, color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: 1.5, boxShadow: "0 4px 20px rgba(200,16,46,0.35)" }}>
                  {submitting ? "提交中..." : "提交引薦需求 →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── BOARD ──
  return (
    <>
      <Head><title>引薦公告欄 | BNI Nexus</title></Head>
      <div style={{ minHeight: "100vh", background: "#f4f6fa" }}>
        <div style={{ background: "#0a0a0a", padding: "0 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setView("home")} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 7, padding: "6px 14px", fontSize: 13 }}>← 返回</button>
              <div style={{ background: "#c8102e", borderRadius: 5, padding: "2px 8px", color: "#fff", fontWeight: 900, fontSize: 12, letterSpacing: 1 }}>BNI</div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>NEXUS · 引薦需求公告欄</span>
              <span style={{ background: "rgba(200,16,46,0.25)", color: "#ff6b7a", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>{filtered.length} 則</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => fetchReferrals()} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 13 }}>↺ 刷新</button>
              <button onClick={() => { setSubmitted(false); setView("form"); }} style={{ background: "#c8102e", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, color: "#fff", fontSize: 13 }}>+ 登記需求</button>
              <button onClick={handleExport} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, fontWeight: 600 }}>⬇ 匯出 Excel</button>
            </div>
          </div>
        </div>

        <div style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 28, overflowX: "auto" }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ color: "#c8102e", fontWeight: 900, fontSize: 22 }}>{referrals.length}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>總需求</div>
            </div>
            {hotCategories.length > 0 && (
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ color: "#ffb454", fontWeight: 900, fontSize: 22 }}>🔥 {hotCategories.length}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2, whiteSpace: "nowrap" }}>熱門共同目標</div>
              </div>
            )}
            {REFERRAL_TYPES.slice(0, 5).map(t => (
              <div key={t} style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{referrals.filter(r => r.referralType === t).length}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2, whiteSpace: "nowrap" }}>{t.replace("尋找", "")}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "20px auto 0", padding: "0 16px" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="🔍 搜尋姓名、職業、說明..."
              value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ flex: "1 1 180px", padding: "8px 14px", border: "1.5px solid #dde3ee", borderRadius: 8, fontSize: 13, outline: "none", minWidth: 0, color: "#222" }} />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ padding: "8px 12px", border: "1.5px solid #dde3ee", borderRadius: 8, fontSize: 13, color: "#222", background: "#f8fafd" }}>
              <option value="全部">全部行業</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{k}. {v}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding: "8px 12px", border: "1.5px solid #dde3ee", borderRadius: 8, fontSize: 13, color: "#222", background: "#f8fafd" }}>
              <option value="全部">全部類型</option>
              {REFERRAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={sortField} onChange={e => setSortField(e.target.value)}
              style={{ padding: "8px 12px", border: "1.5px solid #dde3ee", borderRadius: 8, fontSize: 13, color: "#222", background: "#f8fafd" }}>
              <option value="date">最新優先</option>
              <option value="name">姓名排序</option>
            </select>
            {hotCategories.length > 0 && (
              <button onClick={() => setHotOnly(h => !h)}
                style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: hotOnly ? "1.5px solid #c8102e" : "1.5px solid #ffd9a0",
                  background: hotOnly ? "#c8102e" : "#fff7eb",
                  color: hotOnly ? "#fff" : "#b9690a",
                  whiteSpace: "nowrap",
                }}>
                🔥 只看熱門共同目標{hotOnly ? "（已開啟）" : ""}
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>載入中...</div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 80, color: "#c8102e" }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80 }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
              <div style={{ fontSize: 16, color: "#888" }}>
                {referrals.length === 0 ? "尚未有引薦需求，成為第一位登記的會友！" : "沒有符合篩選條件的結果"}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, paddingBottom: 32 }}>
              {filtered.map(r => {
                const catColor  = CATEGORY_COLORS[r.category]    || "#555";
                const typeColor = TYPE_COLORS[r.referralType]     || "#333";
                const isHot = r.targetCategory && hotCategories.includes(r.targetCategory);
                const hotCount = isHot ? targetCategoryCounts[r.targetCategory].size : 0;
                return (
                  <div key={r.id} style={{ background: "#fff", borderRadius: 14, boxShadow: isHot ? "0 2px 14px rgba(255,140,0,0.18)" : "0 2px 12px rgba(0,0,0,0.06)", border: isHot ? "1.5px solid #ffd9a0" : "1px solid #eaeef4", transition: "transform 0.15s, box-shadow 0.15s", position: "relative" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = isHot ? "0 10px 28px rgba(255,140,0,0.28)" : "0 8px 28px rgba(0,0,0,0.11)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = isHot ? "0 2px 14px rgba(255,140,0,0.18)" : "0 2px 12px rgba(0,0,0,0.06)"; }}>
                    {isHot && (
                      <div style={{ position: "absolute", top: 10, right: -32, background: "linear-gradient(135deg, #ff9a3c, #ff6b35)", color: "#fff", fontSize: 10.5, fontWeight: 900, padding: "3px 36px", transform: "rotate(40deg)", boxShadow: "0 2px 6px rgba(255,107,53,0.4)", letterSpacing: 0.5, zIndex: 2 }}>
                        🔥 熱門
                      </div>
                    )}
                    <div style={{ borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ background: catColor, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 13, flexShrink: 0 }}>
                        {r.memberId || r.category}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{r.memberName}</div>
                        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.role}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 6, padding: "3px 8px", color: "#fff", fontSize: 10, whiteSpace: "nowrap", fontWeight: 700 }}>
                        {CATEGORY_LABELS[r.category] || ""}
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ display: "inline-block", background: `${typeColor}14`, color: typeColor, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, marginBottom: 10, border: `1px solid ${typeColor}30` }}>
                        {r.referralType}
                      </div>
                      {r.targetCategory && (
                        <div style={{ fontSize: 12, color: isHot ? "#b9690a" : "#666", marginBottom: 8, display: "flex", alignItems: "center", gap: 5, fontWeight: isHot ? 700 : 400 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 2, background: CATEGORY_COLORS[r.targetCategory], display: "inline-block", flexShrink: 0 }} />
                          <span><b style={{ color: isHot ? "#b9690a" : "#444" }}>目標：</b>{r.targetCategory}. {CATEGORY_LABELS[r.targetCategory]}</span>
                          {isHot && <span style={{ background: "#fff0db", borderRadius: 10, padding: "1px 8px", fontSize: 10.5, marginLeft: 2 }}>👥 {hotCount} 位會友也在找</span>}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: "#333", lineHeight: 1.75, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {r.description}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f0f4f8", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 11, color: "#bbb" }}>{r.date}</div>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
