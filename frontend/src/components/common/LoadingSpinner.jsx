import React, { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import AppLogo from "./AppLogo";

function getLoaderRoot() {
  if (typeof document === "undefined") return null;
  return document.getElementById("loader-root") || document.body;
}

function LoadingSpinner({ variant = "section", className = "" }) {
  const isFullscreen = variant === "overlay" || variant === "fullPage";

  useLayoutEffect(() => {
    if (!isFullscreen) return undefined;

    document.body.classList.add("app-is-loading");
    return () => {
      document.body.classList.remove("app-is-loading");
    };
  }, [isFullscreen]);

  const loader = (
    <div
      className={[
        "app-loader",
        variant !== "section" ? `app-loader--${variant}` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="app-loader-visual">
        <span className="app-loader-ring app-loader-ring--outer" aria-hidden="true" />
        <span className="app-loader-ring app-loader-ring--inner" aria-hidden="true" />
        <div className="app-loader-logo-wrap">
          <AppLogo size="sm" />
        </div>
      </div>

      {variant !== "inline" && (
        <div className="app-loader-copy">
          <p className="app-loader-message">
            Loading
            <span className="app-loader-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
          <span className="app-loader-line" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  const loaderRoot = getLoaderRoot();

  if (variant === "overlay" && loaderRoot) {
    return createPortal(
      <div className="app-loader-overlay" role="presentation">
        {loader}
      </div>,
      loaderRoot
    );
  }

  if (variant === "fullPage" && loaderRoot) {
    return createPortal(
      <div className="app-loader-page" role="presentation">
        {loader}
      </div>,
      loaderRoot
    );
  }

  if (variant === "section") {
    return <div className="app-loader-section-wrap">{loader}</div>;
  }

  return loader;
}

export default LoadingSpinner;
