import React from "react";

function LoadingSpinner() {
  return (
    <div
      style={{
        width: "2rem",
        height: "2rem",
        border: "3px solid #374151",
        borderTopColor: "#3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

export default LoadingSpinner;
