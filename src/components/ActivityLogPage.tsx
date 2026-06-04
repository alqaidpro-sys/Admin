import React, { useState } from "react";
import { ActivityLog, AdminUser } from "../types";
import { C, btn, inp, sel } from "../styles";

interface Props {
  logs: ActivityLog[];
  user: AdminUser;
  onClearLogs?: () => Promise<void>;
}

export default function ActivityLogPage({ logs, user, onClearLogs }: Props) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [isAdmin] = useState(user.role === "superadmin");
  const [isClearing, setIsClearing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getSectionName = (sec: string) => {
    switch (sec) {
      case "series":
        return "🎬 المسلسلات";
      case "channels":
        return "📺 القنوات وTV";
      case "matches":
        return "⚽ المباريات";
      case "banners":
        return "🎯 البانرات";
      case "settings":
        return "⚙️ الإعدادات";
      case "supervisors":
        return "👥 المشرفين";
      default:
        return sec;
    }
  };

  const getActionBadge = (act: "create" | "update" | "delete") => {
    switch (act) {
      case "create":
        return (
          <span style={{
            background: C.liveDim,
            color: C.live,
            border: `1px solid ${C.live}33`,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }}>
            ➕ إضافة
          </span>
        );
      case "update":
        return (
          <span style={{
            background: C.goldDim,
            color: C.gold,
            border: `1px solid ${C.gold}33`,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }}>
            ✏️ تعديل
          </span>
        );
      case "delete":
        return (
          <span style={{
            background: C.redDim,
            color: C.red,
            border: `1px solid ${C.red}33`,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }}>
            🗑️ حذف
          </span>
        );
      default:
        return <span>{act}</span>;
    }
  };

  const formatDate = (ts: string) => {
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts;
      return date.toLocaleString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    } catch {
      return ts;
    }
  };

  // Filter logs sorted from newest to oldest
  const filtered = [...logs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(log => {
      const matchesSearch =
        log.itemTitle?.toLowerCase().includes(search.toLowerCase()) ||
        log.adminName?.toLowerCase().includes(search.toLowerCase()) ||
        log.adminEmail?.toLowerCase().includes(search.toLowerCase()) ||
        log.itemId?.toLowerCase().includes(search.toLowerCase());

      const matchesSection = sectionFilter === "all" || log.section === sectionFilter;
      const matchesAction = actionFilter === "all" || log.action === actionFilter;

      return matchesSearch && matchesSection && matchesAction;
    });

  // Pagination logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleClear = async () => {
    if (!window.confirm("⚠️ هل أنت متأكد من رغبتك في مسح كافة سجلات النشاط؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    if (onClearLogs) {
      setIsClearing(true);
      try {
        await onClearLogs();
        setCurrentPage(1);
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div style={{ animation: "fadeIn .25s ease-out", direction: "rtl" }}>
      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: `1px solid ${C.border}`
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, display: "flex", alignItems: "center", gap: 10 }}>
            <span>📜</span> سجل نشاطات النظام
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textSec }}>
            مراقبة وتتبع وإدراج جميع عمليات التعديل والإضافة والحذف التي يجريها المشرفون في لوحة التحكم.
          </p>
        </div>

        {isAdmin && onClearLogs && (
          <button
            onClick={handleClear}
            disabled={isClearing || logs.length === 0}
            style={btn("danger")}
          >
            {isClearing ? "جاري المسح..." : "🗑️ تفريغ بالكامل"}
          </button>
        )}
      </div>

      {/* FILTER PANEL */}
      <div style={{
        background: C.bg2,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
        alignItems: "center"
      }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: "bold", color: C.textSec, marginBottom: 6 }}>البحث بالنص</label>
          <input
            style={inp()}
            type="text"
            placeholder="ابحث باسم المشرف، اسم العنصر أو الحساب..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: "bold", color: C.textSec, marginBottom: 6 }}>القسم المستهدف</label>
          <select
            style={sel()}
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">📁 جميع الأقسام والتبويبات</option>
            <option value="series">🎬 المسلسلات والأعمال</option>
            <option value="channels">📺 القنوات والبث المباشر</option>
            <option value="matches">⚽ المباريات الرياضية</option>
            <option value="banners">🎯 البانرات الإعلانية</option>
            <option value="settings">⚙️ إعدادات وهوية المنصة</option>
            <option value="supervisors">👥 تفويض المشرفين</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: "bold", color: C.textSec, marginBottom: 6 }}>نوع العملية</label>
          <select
            style={sel()}
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">⚡ جميع العمليات</option>
            <option value="create">➕ إضافة (Create)</option>
            <option value="update">✏️ تعديل (Update)</option>
            <option value="delete">🗑️ حذف (Delete)</option>
          </select>
        </div>
      </div>

      {/* TABLE / TIMELINE */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
      }}>
        {paginatedLogs.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>🔍</span>
            <p style={{ color: C.text, fontSize: 15, fontWeight: "bold", margin: "0 0 4px" }}>لا توجد سجلات مطابقة</p>
            <p style={{ color: C.textSec, fontSize: 12, margin: 0 }}>
              {logs.length === 0 ? "لم يتم تدوين أية تعديلات بعد على خادم البيانات." : "جرب تعديل خيارات التصفية لتجد ما تبحث عنه."}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textShadow: "none", fontSize: 13, textAlign: "right" }}>
                <thead>
                  <tr style={{ background: C.bg2, borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ padding: "14px 16px", color: C.text, fontWeight: 700 }}>التوقيت</th>
                    <th style={{ padding: "14px 16px", color: C.text, fontWeight: 700 }}>المسؤول</th>
                    <th style={{ padding: "14px 16px", color: C.text, fontWeight: 700 }}>نوع العملية</th>
                    <th style={{ padding: "14px 16px", color: C.text, fontWeight: 700 }}>القسم</th>
                    <th style={{ padding: "14px 16px", color: C.text, fontWeight: 700 }}>العنصر المعدل</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr key={log.id} style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      transition: "background 0.1s"
                    }}>
                      <td style={{ padding: "14px 16px", color: C.teal, fontWeight: "bold", fontSize: 12 }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "bold", color: C.textSec }}>{log.adminName || "مشرف غير محدد"}</p>
                          <p style={{ margin: 0, fontSize: 11, color: C.textDim }}>{log.adminEmail}</p>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {getActionBadge(log.action)}
                      </td>
                      <td style={{ padding: "14px 16px", color: C.textSec }}>
                        {getSectionName(log.section)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "bold", color: C.text }}>{log.itemTitle || "غير مسجل الاستراتيجية"}</p>
                          <p style={{ margin: 0, fontSize: 10, color: C.textDim, fontFamily: "monospace" }}>ID: {log.itemId}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              background: C.bg2,
              borderTop: `1px solid ${C.border}`,
              flexWrap: "wrap",
              gap: 12
            }}>
              <span style={{ fontSize: 12, color: C.textSec }}>
                عرض <strong>{startIndex + 1}</strong> إلى <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> من أصل <strong>{totalItems}</strong> سجل متوفر
              </span>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={{
                    background: currentPage === 1 ? "transparent" : C.border,
                    color: currentPage === 1 ? C.textDim : C.text,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: "bold"
                  }}
                >
                  ⏮️ السابق
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px", fontSize: 12, color: C.textSec }}>
                  صفحة {currentPage} من {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  style={{
                    background: currentPage === totalPages ? "transparent" : C.border,
                    color: currentPage === totalPages ? C.textDim : C.text,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: "bold"
                  }}
                >
                  التالي ⏭️
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
