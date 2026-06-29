import React, { useState } from "react";
import { useConfirm } from "../common/ConfirmProvider";

function EditablePRD({ prd: initialPrd, projectName, onSave, onExport, onRegenerate }) {
  const [prd, setPrd] = useState(initialPrd);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const confirm = useConfirm();

  const updateSection = (section, value) => {
    setPrd((prev) => ({
      ...prev,
      [section]: value,
    }));
  };

  const updateNestedSection = (parent, child, value) => {
    setPrd((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value,
      },
    }));
  };

  const SectionHint = ({ children }) => (
    <p className="prd-doc-hint">{children}</p>
  );

  const PersonaList = ({ label, items, onChange }) => {
    const text = (items || []).join("\n");

    if (!isEditing) {
      if (!items || items.length === 0) return null;
      return (
        <div style={{ marginBottom: "1rem" }}>
          <strong style={{ color: "#334155", display: "block", marginBottom: "0.25rem" }}>{label}:</strong>
          <ul style={{ color: "#0f172a", margin: 0, paddingLeft: "1.25rem" }}>
            {items.map((item, i) => (
              <li key={i} style={{ marginBottom: "0.25rem" }}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ color: "#334155", display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          {label} (one per line):
        </label>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            fontSize: "0.9rem",
            fontFamily: "inherit",
            minHeight: "80px",
            resize: "vertical",
          }}
          rows={3}
        />
      </div>
    );
  };

  const removeSection = async (section) => {
    const confirmed = await confirm({
      title: `Remove ${section}?`,
      message: `This will remove the ${section} section from the PRD. You can still save other changes.`,
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      variant: "danger",
    });

    if (confirmed) {
      setPrd((prev) => {
        const updated = { ...prev };
        delete updated[section];
        return updated;
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(prd);
    }
  };

  const EditableField = ({ label, value, onChange, multiline = false, titleField = false }) => {
    const [isEditingField, setIsEditingField] = useState(false);
    const [tempValue, setTempValue] = useState(value || "");

    const handleSave = () => {
      onChange(tempValue);
      setIsEditingField(false);
    };

    const handleCancel = () => {
      setTempValue(value || "");
      setIsEditingField(false);
    };

    if (!isEditingField && !isEditing) {
      if (titleField) {
        return <h1 className="prd-doc-title">{value || "Untitled PRD"}</h1>;
      }
      if (!label) {
        return (
          <p style={{ color: "#0f172a", whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
            {value || "Not set"}
          </p>
        );
      }
      return (
        <div style={{ marginBottom: "1rem" }}>
          <strong style={{ color: "#334155", display: "block", marginBottom: "0.25rem" }}>{label}:</strong>
          <p style={{ color: "#0f172a", whiteSpace: "pre-wrap" }}>{value || "Not set"}</p>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ color: "#334155", display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          {label}:
        </label>
        {multiline ? (
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              minHeight: "100px",
              resize: "vertical",
            }}
            rows={multiline === true ? 3 : multiline}
          />
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              fontSize: "0.9rem",
            }}
          />
        )}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "#10b981",
              color: "#fff",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "transparent",
              color: "#0f172a",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="prd-toolbar">
        <h3 className="prd-toolbar-title">PRD Document</h3>
        <div className="prd-toolbar-actions">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
          >
            {isEditing ? "Done Editing" : "Edit PRD"}
          </button>
          {onExport && (
            <>
              <button type="button" onClick={() => onExport("markdown", prd)} className="btn btn-secondary btn-sm">
                Export MD
              </button>
              <button type="button" onClick={() => onExport("pdf", prd)} className="btn btn-secondary btn-sm">
                Export PDF
              </button>
            </>
          )}
          {onSave && (
            <button type="button" onClick={handleSave} className="btn btn-primary btn-sm">
              Save to Project
            </button>
          )}
          {onRegenerate && (
            <button type="button" onClick={onRegenerate} className="btn btn-ghost btn-sm">
              Regenerate
            </button>
          )}
        </div>
      </div>

      <div className="prd-document-shell">
        <div className="prd-document prd-print-content">
          <header className="prd-doc-header">
            <p className="prd-doc-eyebrow">Product Requirements Document</p>
            <EditableField
              label=""
              titleField
              value={prd.title || projectName}
              onChange={(value) => updateSection("title", value)}
            />
            <div className="prd-doc-meta-fields">
              <EditableField
                label="Version"
                value={prd.version || "1.0"}
                onChange={(value) => updateSection("version", value)}
              />
              <EditableField
                label="Date"
                value={prd.date || new Date().toISOString().split("T")[0]}
                onChange={(value) => updateSection("date", value)}
              />
            </div>
          </header>

        {/* Executive Summary */}
        {prd.executiveSummary !== undefined && (
          <section className="prd-doc-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2>Executive Summary</h2>
              {isEditing && (
                <button
                  onClick={() => removeSection("executiveSummary")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: "1px solid #fecaca",
                    backgroundColor: "transparent",
                    color: "#dc2626",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <EditableField
              label=""
              value={prd.executiveSummary}
              onChange={(value) => updateSection("executiveSummary", value)}
              multiline={true}
            />
          </section>
        )}

        {/* Problem Statement */}
        {prd.problemStatement && (
          <section className="prd-doc-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2>Problem Statement</h2>
              {isEditing && (
                <button
                  onClick={() => removeSection("problemStatement")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: "1px solid #fecaca",
                    backgroundColor: "transparent",
                    color: "#dc2626",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <SectionHint>
              Defines what is broken and why it matters — before jumping to features. Each field should say something different.
            </SectionHint>
            <EditableField
              label="Problem — the one core issue"
              value={prd.problemStatement.problem}
              onChange={(value) => updateNestedSection("problemStatement", "problem", value)}
              multiline={true}
            />
            <EditableField
              label="Impact — who is affected and what it costs them"
              value={prd.problemStatement.impact}
              onChange={(value) => updateNestedSection("problemStatement", "impact", value)}
              multiline={true}
            />
            <EditableField
              label="Current State — what users experience today"
              value={prd.problemStatement.currentState}
              onChange={(value) => updateNestedSection("problemStatement", "currentState", value)}
              multiline={true}
            />
            <EditableField
              label="Desired State — what success looks like after we ship"
              value={prd.problemStatement.desiredState}
              onChange={(value) => updateNestedSection("problemStatement", "desiredState", value)}
              multiline={true}
            />
          </section>
        )}

        {/* User Personas */}
        {prd.userPersonas && prd.userPersonas.length > 0 && (
          <section className="prd-doc-section">
            <h2>User Personas</h2>
            <SectionHint>
              Real people from your interviews — who they are, what they need, and what frustrates them. Used to write user stories and prioritize features.
            </SectionHint>
            {prd.userPersonas.map((persona, index) => (
              <div key={index} className="prd-doc-card">
                <EditableField
                  label="Name"
                  value={persona.name}
                  onChange={(value) => {
                    const updated = [...prd.userPersonas];
                    updated[index] = { ...updated[index], name: value };
                    setPrd((prev) => ({ ...prev, userPersonas: updated }));
                  }}
                />
                {(persona.basedOnInterview || isEditing) && (
                  <EditableField
                    label="Based on interview"
                    value={persona.basedOnInterview || ""}
                    onChange={(value) => {
                      const updated = [...prd.userPersonas];
                      updated[index] = { ...updated[index], basedOnInterview: value };
                      setPrd((prev) => ({ ...prev, userPersonas: updated }));
                    }}
                  />
                )}
                <EditableField
                  label="Description"
                  value={persona.description}
                  onChange={(value) => {
                    const updated = [...prd.userPersonas];
                    updated[index] = { ...updated[index], description: value };
                    setPrd((prev) => ({ ...prev, userPersonas: updated }));
                  }}
                  multiline={true}
                />
                <PersonaList
                  label="Needs"
                  items={persona.needs}
                  onChange={(value) => {
                    const updated = [...prd.userPersonas];
                    updated[index] = { ...updated[index], needs: value };
                    setPrd((prev) => ({ ...prev, userPersonas: updated }));
                  }}
                />
                <PersonaList
                  label="Pain Points"
                  items={persona.painPoints}
                  onChange={(value) => {
                    const updated = [...prd.userPersonas];
                    updated[index] = { ...updated[index], painPoints: value };
                    setPrd((prev) => ({ ...prev, userPersonas: updated }));
                  }}
                />
              </div>
            ))}
          </section>
        )}

        {/* Features - Show simplified for now */}
        {prd.features && prd.features.length > 0 && (
          <section className="prd-doc-section">
            <h2>Features & Requirements</h2>
            {prd.features.map((feature, index) => (
              <div key={index} className="prd-doc-card">
                <EditableField
                  label="Feature Name"
                  value={feature.name}
                  onChange={(value) => {
                    const updated = [...prd.features];
                    updated[index] = { ...updated[index], name: value };
                    setPrd((prev) => ({ ...prev, features: updated }));
                  }}
                />
                <EditableField
                  label="Description"
                  value={feature.description}
                  onChange={(value) => {
                    const updated = [...prd.features];
                    updated[index] = { ...updated[index], description: value };
                    setPrd((prev) => ({ ...prev, features: updated }));
                  }}
                  multiline={true}
                />
              </div>
            ))}
          </section>
        )}

        {isEditing && (
          <div className="prd-edit-banner">
            <strong>Editing mode:</strong> Click any field to edit. Changes are saved when you click Save to Project.
          </div>
        )}
        </div>

        <div className="prd-doc-watermark">
          <img src="/assets/parseai-wordmark-transparent.png" alt="ParseAi" draggable={false} />
        </div>
      </div>

      <div className="prd-print-page-logo" aria-hidden="true">
        <img src="/assets/parseai-wordmark-transparent.png" alt="ParseAi" draggable={false} />
      </div>
    </div>
  );
}

export default EditablePRD;
