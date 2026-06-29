/**
 * One-time migration: dark theme inline colors → premium white/sky blue
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "src");

const files = [
  "components/project/ProjectDetail.jsx",
  "components/project/ChatEditor.jsx",
  "components/project/ProjectSelector.jsx",
  "components/project/InterviewMediaViewer.jsx",
  "components/prd/EditablePRD.jsx",
  "components/prd/PRDGenerator.jsx",
  "components/prd/PRDPreview.jsx",
];

const replacements = [
  ["linear-gradient(135deg, #4f46e5, #6366f1, #0ea5e9)", "linear-gradient(135deg, #38bdf8, #0ea5e9, #0284c7)"],
  ["linear-gradient(135deg, #4f46e5, #6366f1)", "linear-gradient(135deg, #38bdf8, #0284c7)"],
  ["linear-gradient(135deg, #10b981, #059669)", "linear-gradient(135deg, #0ea5e9, #0284c7)"],
  ["linear-gradient(135deg, #3b82f6, #2563eb)", "linear-gradient(135deg, #38bdf8, #0284c7)"],
  ["rgba(0, 0, 0, 0.8)", "rgba(15, 23, 42, 0.4)"],
  ["rgba(0, 0, 0, 0.75)", "rgba(15, 23, 42, 0.4)"],
  ["0 4px 12px rgba(59, 130, 246, 0.2)", "0 8px 24px rgba(14, 165, 233, 0.15)"],
  ['backgroundColor: uploadMode === "audio" ? "#1e3a8a" : "#0f172a"', 'backgroundColor: uploadMode === "audio" ? "#e0f2fe" : "#ffffff"'],
  ['color: uploadMode === "audio" ? "#93c5fd" : "#9ca3af"', 'color: uploadMode === "audio" ? "#0369a1" : "#64748b"'],
  ['backgroundColor: uploadMode === "text" ? "#1e3a8a" : "#0f172a"', 'backgroundColor: uploadMode === "text" ? "#e0f2fe" : "#ffffff"'],
  ['color: uploadMode === "text" ? "#93c5fd" : "#9ca3af"', 'color: uploadMode === "text" ? "#0369a1" : "#64748b"'],
  ['backgroundColor: activeTab === "interviews" ? "#1e3a8a" : "transparent"', 'backgroundColor: activeTab === "interviews" ? "#e0f2fe" : "transparent"'],
  ['backgroundColor: activeTab === "patterns" ? "#1e3a8a" : "transparent"', 'backgroundColor: activeTab === "patterns" ? "#e0f2fe" : "transparent"'],
  ['backgroundColor: activeTab === "prd" ? "#1e3a8a" : "transparent"', 'backgroundColor: activeTab === "prd" ? "#e0f2fe" : "transparent"'],
  ['color: activeTab === "interviews" ? "#93c5fd" : "#9ca3af"', 'color: activeTab === "interviews" ? "#0369a1" : "#64748b"'],
  ['color: activeTab === "patterns" ? "#93c5fd" : "#9ca3af"', 'color: activeTab === "patterns" ? "#0369a1" : "#64748b"'],
  ['color: activeTab === "prd" ? "#93c5fd" : "#9ca3af"', 'color: activeTab === "prd" ? "#0369a1" : "#64748b"'],
  ['backgroundColor: showCreateForm ? "#3b82f6" : "#030712"', 'backgroundColor: showCreateForm ? "#0ea5e9" : "#f8fafc"'],
  ['backgroundColor: "#422006"', 'backgroundColor: "#fffbeb"'],
  ['border: "1px solid #92400e"', 'border: "1px solid #fcd34d"'],
  ['color: "#fcd34d"', 'color: "#b45309"'],
  ['backgroundColor: "#14532d"', 'backgroundColor: "#e0f2fe"'],
  ['border: "1px solid #7f1d1d"', 'border: "1px solid #fecaca"'],
  ['color: "#fca5a5"', 'color: "#dc2626"'],
  ['color: "#86efac"', 'color: "#0284c7"'],
  ['color: "#fbbf24"', 'color: "#0284c7"'],
  ['color: "#93c5fd"', 'color: "#0369a1"'],
  ['backgroundColor: "#1e3a8a"', 'backgroundColor: "#e0f2fe"'],
  ["#3b82f6", "#0ea5e9"],
  ["#2563eb", "#0284c7"],
  ['backgroundColor: "#030712"', 'backgroundColor: "#f8fafc"'],
  ['backgroundColor: "#020617"', 'backgroundColor: "#ffffff"'],
  ['background: "#020617"', 'background: "#ffffff"'],
  ['backgroundColor: "#0f172a"', 'backgroundColor: "#f8fafc"'],
  ['background: "#0f172a"', 'background: "#f0f9ff"'],
  ['border: "1px solid #1f2937"', 'border: "1px solid #e2e8f0"'],
  ['border: "1px dashed #374151"', 'border: "1px dashed #cbd5e1"'],
  ['border: "1px dashed #4b5563"', 'border: "1px dashed #cbd5e1"'],
  ['border: "1px solid #374151"', 'border: "1px solid #e2e8f0"'],
  ['borderBottom: "1px solid #1f2937"', 'borderBottom: "1px solid #e2e8f0"'],
  ['borderTop: "1px solid #1f2937"', 'borderTop: "1px solid #e2e8f0"'],
  ['color: "#e5e7eb"', 'color: "#0f172a"'],
  ['color: "#d1d5db"', 'color: "#334155"'],
  ['color: "#9ca3af"', 'color: "#64748b"'],
  ['color: "#6b7280"', 'color: "#94a3b8"'],
  ['isSubmitting ? "#374151"', 'isSubmitting ? "#cbd5e1"'],
  ['? "#374151"', '? "#cbd5e1"'],
  ['e.currentTarget.style.borderColor = "#1f2937"', 'e.currentTarget.style.borderColor = "#e2e8f0"'],
  ['e.currentTarget.style.borderColor = "#3b82f6"', 'e.currentTarget.style.borderColor = "#0ea5e9"'],
];

for (const rel of files) {
  const filePath = path.join(srcDir, rel);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf8");
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Updated:", rel);
}

console.log("Done.");
