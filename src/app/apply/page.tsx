import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LandingLayout from "../landing-layout";

export const metadata: Metadata = {
  title: "Apply | Live Song War",
  description: "Choose an upcoming Live Song War event.",
};

export default function ApplyPage() {
  return (
    <LandingLayout>
      <section className="events-page">
        <header className="events-header">
          <p className="apply-kicker">Upcoming events</p>
          <h1>CHOOSE YOUR <em>WAR</em></h1>
          <p>Select an upcoming event to begin your artist application.</p>
        </header>

        <article className="event-card">
          <div className="event-image">
            <Image
              src="/images/image_04_guys.jpeg"
              alt="Attendees at a Live Song War event"
              fill
              sizes="(max-width: 540px) 86vw, 520px"
              priority
            />
            <span>Applications open</span>
          </div>

          <div className="event-content">
            <div className="event-heading">
              <p>Canada · Summer 2026</p>
              <h2>LIVE SONG WAR</h2>
            </div>

            <dl className="event-details">
              <div>
                <dt>Country</dt>
                <dd>Canada</dd>
              </div>
              <div>
                <dt>Province</dt>
                <dd>TBD</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>TBD</dd>
              </div>
              <div>
                <dt>Date range</dt>
                <dd>July 10th – August 10th</dd>
              </div>
              <div>
                <dt>Competitors</dt>
                <dd>8</dd>
              </div>
            </dl>

            <Link className="event-apply-button" href="/apply/july-2026">
              Apply for this event
            </Link>
          </div>
        </article>
      </section>
    </LandingLayout>
  );
}
