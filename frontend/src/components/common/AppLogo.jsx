import React from "react";

const LOGO_SOURCES = {
  dark: "/assets/ParseAi_logo.svg",
  light: "/assets/ParseAi_logo-light.svg",
};

const LOGO_HEIGHT = {
  sm: 40,
  md: 48,
  lg: 56,
  xl: 68,
  hero: 84,
};

function AppLogo({ as: Tag = "span", variant = "dark", size = "md", className = "" }) {
  const classes = ["app-logo", `app-logo-${variant}`, `app-logo-${size}`, className]
    .filter(Boolean)
    .join(" ");

  const height = LOGO_HEIGHT[size] || LOGO_HEIGHT.md;
  const src = LOGO_SOURCES[variant] || LOGO_SOURCES.dark;

  return (
    <Tag className={classes} style={{ "--logo-h": `${height}px` }}>
      <img
        src={src}
        alt="ParseAi"
        className="app-logo-img"
        height={height}
        decoding="async"
        draggable={false}
      />
    </Tag>
  );
}

export default AppLogo;
