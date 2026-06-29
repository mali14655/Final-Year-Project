import React, { useEffect, useState } from "react";
import { HOW_IT_WORKS_SECTIONS } from "./howItWorksContent";

function SectionBody({ blocks }) {
  return (
    <div className="guide-body">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="guide-paragraph">
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <div key={index} className="guide-block guide-block-list">
              {block.title && <h4 className="guide-block-title">{block.title}</h4>}
              <ul className="guide-list">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          );
        }

        if (block.type === "terms") {
          return (
            <div key={index} className="guide-block">
              {block.title && <h4 className="guide-block-title">{block.title}</h4>}
              <dl className="guide-terms-grid">
                {block.items.map((item) => (
                  <div key={item.term} className="guide-term-card">
                    <dt>{item.term}</dt>
                    <dd>{item.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function GuideTopNav({ activeSection, onSelect }) {
  return (
    <nav className="guide-top-nav" aria-label="Guide sections">
      {HOW_IT_WORKS_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`guide-top-nav-item${activeSection === section.id ? " is-active" : ""}`}
          onClick={() => onSelect(section.id)}
        >
          {section.step != null ? (
            <span className="guide-top-nav-step">{section.step}</span>
          ) : null}
          <span className="guide-top-nav-label">{section.title}</span>
        </button>
      ))}
    </nav>
  );
}

function HowItWorksPage({ initialSection = "overview", onBack }) {
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  const current = HOW_IT_WORKS_SECTIONS.find((section) => section.id === activeSection) || HOW_IT_WORKS_SECTIONS[0];

  return (
    <div className="guide-page">
      <div className="detail-header guide-hero">
        <div className="detail-header-main">
          <button type="button" onClick={onBack} className="btn btn-secondary btn-sm detail-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <p className="eyebrow">Guide</p>
          <h1 className="detail-title">How it works</h1>
          <p className="detail-description">
            Every step, term, and feature explained — from uploading interviews to exporting your finished PRD.
          </p>
        </div>
      </div>

      <GuideTopNav activeSection={activeSection} onSelect={setActiveSection} />

      <article className="surface-card guide-content guide-content-full">
        <header className="guide-content-header">
          {current.step != null ? (
            <span className="guide-step-badge">Step {current.step}</span>
          ) : (
            <span className="guide-step-badge is-neutral">Reference</span>
          )}
          <h2 className="guide-content-title">{current.title}</h2>
          <p className="guide-content-subtitle">{current.subtitle}</p>
        </header>
        <SectionBody blocks={current.content} />
      </article>
    </div>
  );
}

export default HowItWorksPage;
