import React from "react";

function ToggleSwitch({ checked, onChange, disabled, id, label }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle-switch ${checked ? "toggle-switch-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-switch-thumb" />
    </button>
  );
}

export default ToggleSwitch;
