import React, { useState } from "react";
import AppLogo from "../common/AppLogo";
import AppHeader from "../common/AppHeader";

const STEPS = [
  {
    step: "01",
    title: "Upload interviews",
    description: "Add audio, video, or paste transcripts. Each conversation is stored with its own media and transcript.",
  },
  {
    step: "02",
    title: "Extract insights",
    description: "AI tags pains, needs, opportunities, quotes, and more — per interview, ready to refine.",
  },
  {
    step: "03",
    title: "Find patterns",
    description: "Surface themes that repeat across participants before you prioritize what to build.",
  },
  {
    step: "04",
    title: "Generate your PRD",
    description: "Turn research into a structured product requirements document you can edit and export.",
  },
];

function LandingPage({
  user,
  onHome,
  onWorkspace,
  onSignIn,
  onSignUp,
  onHowItWorks,
  onOpenProfile,
}) {
  const handleHome = () => {
    onHome?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="landing-page app-shell">
      <AppHeader
        user={user}
        onLogoClick={handleHome}
        onNavigateHome={handleHome}
        onNavigateWorkspace={onWorkspace}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onHowItWorks={onHowItWorks}
        onOpenProfile={onOpenProfile}
        showAnchorLinks
      />

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <AppLogo variant="dark" size="hero" className="landing-hero-logo" />
          <p className="eyebrow landing-hero-eyebrow">For product managers & UX researchers</p>
          <h1 className="landing-hero-title">
            Turn user interviews into clear product decisions
          </h1>
          <p className="landing-hero-desc">
            ParseAi helps you transcribe conversations, extract structured insights, identify cross-interview patterns, and generate PRDs — in one focused workspace.
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={onSignUp}>
              Get started free
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <p className="eyebrow">Why ParseAi</p>
          <h2 className="landing-section-title">Research to requirements, without the busywork</h2>
          <div className="landing-features-grid">
            <article className="landing-feature-card">
              <h3>AI transcript assistant</h3>
              <p>Clean up transcripts and improve clarity without manual copy-paste editing.</p>
            </article>
            <article className="landing-feature-card">
              <h3>Tagged insights</h3>
              <p>Pain, need, opportunity, feature, quote, and sentiment — organized per interview.</p>
            </article>
            <article className="landing-feature-card">
              <h3>Pattern analysis</h3>
              <p>See what repeats across users with frequency scores and theme summaries.</p>
            </article>
            <article className="landing-feature-card">
              <h3>Export-ready PRDs</h3>
              <p>Generate, edit, save, and export Markdown or PDF deliverables from real research.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-section landing-section-muted">
        <div className="landing-section-inner">
          <p className="eyebrow">Workflow</p>
          <h2 className="landing-section-title">Four steps from interview to PRD</h2>
          <div className="landing-steps">
            {STEPS.map((item) => (
              <article key={item.step} className="landing-step-card">
                <span className="landing-step-num">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-inner surface-card">
          <AppLogo variant="dark" size="lg" />
          <h2>Ready to parse your next interview?</h2>
          <p>Create a project, upload research, and let AI do the heavy lifting.</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={onSignUp}>
            Create your account
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-main">
            <AppLogo variant="dark" size="md" />
            <p className="landing-footer-tagline">
              ParseAi — interview research, patterns, and PRD generation
            </p>
          </div>
          <p className="landing-footer-copy">
            &copy; {new Date().getFullYear()} ParseAi. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
