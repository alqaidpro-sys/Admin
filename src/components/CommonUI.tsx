import React, { useEffect } from "react";
import { C, btn, inp, sel } from "../styles";

export const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ fontSize: 12, color: C.textSec, fontWeight: 700, display: "block", marginBottom: 4, textAlign: "right" }}>
    {children}
  </label>
);

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <Label>{label}</Label>
    {children}
  </div>
);

export const Row = ({ children, gap = 10 }: { children: React.ReactNode; gap?: number }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap }}>{children}</div>
);

export const Card = ({ children, style = {}, ...props }: { children: React.ReactNode; style?: React.CSSProperties; [key: string]: any }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, ...style }} {...props}>
    {children}
  </div>
);

export const Divider = () => <div style={{ height: 1, background: C.border, margin: "14px 0" }} />;

export const Badge = ({ label, color = C.teal }: { label: string; color?: string }) => (
  <span style={{
    background: `${color}18`, color, border: `1px solid ${color}44`,
    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20
  }}>{label}</span>
);

export const EmptyState = ({ icon = "📋", text = "لا توجد عناصر بعد", sub = "" }: { icon?: string; text: string; sub?: string }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: C.textSec }}>
    <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{text}</p>
    {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textDim }}>{sub}</p>}
  </div>
);

export const Tag = ({ label, onRemove, ...props }: { label: string; onRemove?: () => void; [key: string]: any }) => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: C.tealDim,
    color: C.teal,
    border: `1px solid ${C.teal}33`,
    fontSize: 12,
    padding: "3px 8px",
    borderRadius: 20,
    margin: "2px"
  }} {...props}>
    {label}
    {onRemove && <span onClick={onRemove} style={{ cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</span>}
  </span>
);

export function Toggle({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!val)} style={{
      width: 44, height: 24, borderRadius: 12, cursor: "pointer", flexShrink: 0,
      background: val ? C.teal : C.border, position: "relative", transition: "background .2s"
    }}>
      <div style={{
        position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left .2s", left: val ? 23 : 3,
        boxShadow: "0 1px 4px rgba(0,0,0,.4)"
      }} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.78)",
      zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 12, backdropFilter: "blur(6px)"
    }}>
      <div style={{
        background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16,
        width: "100%", maxWidth: wide ? 800 : 540,
        maxHeight: "93vh", display: "flex", flexDirection: "column",
        boxShadow: `0 24px 70px rgba(0,0,0,.75), 0 0 40px ${C.tealGlow}`
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ ...btn("ghost"), padding: "4px 10px", borderRadius: 8 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 20, scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Toast({ msg, type = "success", onDone }: { msg: string; type?: "success" | "warning" | "danger"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const color = type === "success" ? C.teal : type === "warning" ? C.gold : C.red;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: C.card, border: `1px solid ${color}`, color: C.text,
      padding: "10px 22px", borderRadius: 28, fontSize: 13, fontWeight: 700,
      zIndex: 3000, boxShadow: `0 4px 24px rgba(0,0,0,.7), 0 0 14px ${color}44`,
      display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
      fontFamily: C.font
    }}>
      <span style={{ color }}>{type === "success" ? "✓" : type === "warning" ? "⚠" : "✕"}</span>
      {msg}
    </div>
  );
}

export function Confirm({ msg, onYes, onNo }: { msg: string; onYes: () => void; onNo: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxWidth: 340, width: "100%", fontFamily: C.font }}>
        <p style={{ margin: "0 0 20px", fontSize: 15, color: C.text, textAlign: "center" }}>{msg}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onYes} style={btn("danger")}>نعم، احذف</button>
          <button onClick={onNo} style={btn("ghost")}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export const QUALITIES = ["4K", "1085p", "1080p", "720p", "480p", "360p", "240p"];

export function LinksEditor({ links, onChange }: { links: any[]; onChange: (links: any[]) => void }) {
  const add = () => onChange([...links, { quality: "1080p", server: "سيرفر B2", url: "" }]);
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const set = (i: number, key: string, val: string) => onChange(links.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Label>روابط البث</Label>
        <button onClick={add} style={btn("sm")}>+ رابط</button>
      </div>
      {links.length === 0 && <p style={{ color: C.textDim, fontSize: 12, textAlign: "center", padding: "8px 0" }}>لا توجد روابط — اضغط "+ رابط"</p>}
      {links.map((link, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "88px 1fr 1fr 32px", gap: 6,
          background: C.card2, borderRadius: 8, padding: 8, marginBottom: 6,
          border: `1px solid ${C.border}`
        }}>
          <select value={link.quality} onChange={e => set(i, "quality", e.target.value)} style={sel()}>
            {QUALITIES.map(q => <option key={q}>{q}</option>)}
          </select>
          <input value={link.server} onChange={e => set(i, "server", e.target.value)} placeholder="اسم السيرفر" style={inp()} />
          <input value={link.url} onChange={e => set(i, "url", e.target.value)} placeholder="رابط البث / M3U8" style={inp()} dir="ltr" />
          <button onClick={() => remove(i)} style={{ ...btn("danger-sm"), padding: "5px 8px", borderRadius: 6 }}>✕</button>
        </div>
      ))}
    </div>
  );
}
