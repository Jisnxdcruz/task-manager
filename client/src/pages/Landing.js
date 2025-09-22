import React from "react";
import "./Landing.css";

export default function Landing() {
  return (
    <div className="lp-root">
      {/* global aurora layer */}
      <div className="lp-aurora" aria-hidden />

      {/* NAV */}
      <header className="lp-nav">
        <div className="container nav-inner">
          <div className="brand">TaskFlow</div>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#benefits">Benefits</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Manage your tasks, master your time.</h1>
            <p>Minimal, INTJ-coded dashboard that keeps teams aligned without the fluff.</p>
            <div className="cta-row">
              <a className="btn" href="/register">Get Started</a>
              <a className="btn ghost" href="#features">See Features</a>
            </div>
          </div>
          <div className="hero-visual" aria-hidden />
        </div>
      </section>

      {/* FEATURES (vertical) */}
      <section id="features" className="lp-section">
        <div className="container">
          <h2 className="h">Features</h2>
          <p className="sub">Everything you need, nothing you don’t.</p>

          <div className="features-list">
            <article className="feature">
              <div className="bullet" />
              <div className="body">
                <h3>Quick Tasking</h3>
                <p>Create, assign, and update tasks in seconds.</p>
              </div>
            </article>

            <article className="feature">
              <div className="bullet" />
              <div className="body">
                <h3>Statuses</h3>
                <p>Pending → In Progress → Completed, with filters.</p>
              </div>
            </article>

            <article className="feature">
              <div className="bullet" />
              <div className="body">
                <h3>Deadlines</h3>
                <p>Due dates, reminders, and a lightweight calendar view.</p>
              </div>
            </article>

            <article className="feature">
              <div className="bullet" />
              <div className="body">
                <h3>Team View</h3>
                <p>See who’s doing what without micromanaging.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="lp-section alt">
        <div className="container two-col">
          <div>
            <h2 className="h">Why it actually helps</h2>
            <ul className="ticks">
              <li>Never lose track of who owns what.</li>
              <li>Fewer status meetings, more progress.</li>
              <li>Simple UI = less mental load, more output.</li>
              <li>Works for solo flow or team ops.</li>
            </ul>
          </div>
          <div className="poster" aria-hidden />
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section">
        <div className="container center">
          <h2 className="h">Ready to focus?</h2>
          <a className="btn" href="/register">Create a free account</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="lp-foot">
        <div className="container foot-inner">
          <div>© {new Date().getFullYear()} TaskFlow</div>
          <div className="foot-links">
            <a href="mailto:hello@taskflow.app">hello@taskflow.app</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}