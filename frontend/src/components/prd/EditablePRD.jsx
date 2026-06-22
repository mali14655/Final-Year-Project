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
    <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.5 }}>{children}</p>
  );

  const PersonaList = ({ label, items, onChange }) => {
    const text = (items || []).join("\n");

    if (!isEditing) {
      if (!items || items.length === 0) return null;
      return (
        <div style={{ marginBottom: "1rem" }}>
          <strong style={{ color: "#d1d5db", display: "block", marginBottom: "0.25rem" }}>{label}:</strong>
          <ul style={{ color: "#e5e7eb", margin: 0, paddingLeft: "1.25rem" }}>
            {items.map((item, i) => (
              <li key={i} style={{ marginBottom: "0.25rem" }}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ color: "#d1d5db", display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
          {label} (one per line):
        </label>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid #374151",
            backgroundColor: "#030712",
            color: "#e5e7eb",
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

  const EditableField = ({ label, value, onChange, multiline = false, section = null }) => {
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
      return (
        <div style={{ marginBottom: "1rem" }}>
          <strong style={{ color: "#d1d5db", display: "block", marginBottom: "0.25rem" }}>{label}:</strong>
          <p style={{ color: "#e5e7eb", whiteSpace: "pre-wrap" }}>{value || "Not set"}</p>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ color: "#d1d5db", display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
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
              border: "1px solid #374151",
              backgroundColor: "#030712",
              color: "#e5e7eb",
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
              border: "1px solid #374151",
              backgroundColor: "#030712",
              color: "#e5e7eb",
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
              border: "1px solid #374151",
              backgroundColor: "transparent",
              color: "#e5e7eb",
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#e5e7eb",
          }}
        >
          PRD Document
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              backgroundColor: isEditing ? "#3b82f6" : "#030712",
              color: "#e5e7eb",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isEditing ? "Done Editing" : "Edit PRD"}
          </button>
          {onExport && (
            <>
              <button
                onClick={() => onExport("markdown", prd)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  backgroundColor: "#030712",
                  color: "#e5e7eb",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Export MD
              </button>
              <button
                onClick={() => onExport("pdf", prd)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  backgroundColor: "#030712",
                  color: "#e5e7eb",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Export PDF
              </button>
            </>
          )}
          {onSave && (
            <button
              onClick={handleSave}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Save to Project
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#030712",
                color: "#e5e7eb",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          maxHeight: "600px",
          overflowY: "auto",
          padding: "1rem",
          backgroundColor: "#030712",
          borderRadius: "0.5rem",
          border: "1px solid #1f2937",
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: "2rem" }}>
          <EditableField
            label="Title"
            value={prd.title || projectName}
            onChange={(value) => updateSection("title", value)}
          />
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
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
        </div>

        {/* Executive Summary */}
        {prd.executiveSummary !== undefined && (
          <section style={{ marginBottom: "2rem", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2 style={{ color: "#e5e7eb" }}>Executive Summary</h2>
              {isEditing && (
                <button
                  onClick={() => removeSection("executiveSummary")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: "1px solid #7f1d1d",
                    backgroundColor: "transparent",
                    color: "#fca5a5",
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
          <section style={{ marginBottom: "2rem", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h2 style={{ color: "#e5e7eb" }}>Problem Statement</h2>
              {isEditing && (
                <button
                  onClick={() => removeSection("problemStatement")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: "1px solid #7f1d1d",
                    backgroundColor: "transparent",
                    color: "#fca5a5",
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
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "#e5e7eb", marginBottom: "0.75rem" }}>User Personas</h2>
            <SectionHint>
              Real people from your interviews — who they are, what they need, and what frustrates them. Used to write user stories and prioritize features.
            </SectionHint>
            {prd.userPersonas.map((persona, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#0f172a",
                  borderRadius: "0.5rem",
                  border: "1px solid #1f2937",
                }}
              >
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
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "#e5e7eb", marginBottom: "0.75rem" }}>Features & Requirements</h2>
            {prd.features.map((feature, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  backgroundColor: "#0f172a",
                  borderRadius: "0.5rem",
                  border: "1px solid #1f2937",
                }}
              >
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
          <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#1e3a8a", borderRadius: "0.5rem" }}>
            <p style={{ color: "#93c5fd", fontSize: "0.85rem" }}>
              💡 <strong>Editing Mode:</strong> Click on any field to edit. Changes are saved when you click "Save to Project".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditablePRD;
