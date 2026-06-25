import LandingLayout from "../landing-layout";

export default function Contact() {
  return (
    <LandingLayout>
      <section className="contact-card glass-card">
        <div className="card-glow contact-glow" aria-hidden="true" />
        <p className="eyebrow">
          <span className="eyebrow-line" />
          <span className="eyebrow-text">Get in touch</span>
          <span className="eyebrow-line" />
        </p>
        <h1 className="contact-title">
          CONTACT <em>US</em>
        </h1>
        <p className="contact-intro">
          Questions about the application process? Talk to the team.
        </p>

        <div className="contact-list">
          <a className="contact-item" href="mailto:info@livesongwar.com">
            <span className="contact-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 6h18v12H3zM3 7l9 7 9-7" />
              </svg>
            </span>
            <span>
              <small>General inquiries</small>
              <strong>SUBMISSIONS@LIVESONGWAR.COM</strong>
            </span>
            <span className="item-arrow">↗</span>
          </a>
        </div>

        <a
          className="instagram-button"
          href="https://instagram.com/livesongwar"
          target="_blank"
          rel="noreferrer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" className="fill" />
          </svg>
          <span>@LIVESONGWAR</span>
        </a>
      </section>
    </LandingLayout>
  );
}
