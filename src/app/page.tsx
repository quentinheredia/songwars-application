import LandingLayout from "./landing-layout";

export default function Home() {
  return (
    <LandingLayout>
      <section className="hero-card glass-card">
        <div className="card-glow card-glow-red" aria-hidden="true" />
        <div className="card-glow card-glow-blue" aria-hidden="true" />
        <p className="eyebrow">
          <span className="eyebrow-line" />
          <span className="eyebrow-text">
            Toronto&apos;s FIRST ever live song wars event
          </span>
          <span className="eyebrow-line" />
        </p>
        <h1 className="display-title">
          <span>LIVE SONG</span>
          <span className="war-word">WARS</span>
        </h1>
        <p className="tournament-type">Tournament</p>
        <div className="divider" aria-hidden="true">
          <span>★</span>
        </div>
        <p className="hero-copy">
          Apply below to compete in the first ever live song wars.
        </p>
        <a className="primary-cta" href="/apply">
          <span>APPLY</span>
        </a>
        <p className="limited-copy">Limited spots available!</p>
      </section>
    </LandingLayout>
  );
}
