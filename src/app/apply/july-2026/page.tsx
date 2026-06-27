import type { Metadata } from "next";
import LandingLayout from "../../landing-layout";
import ApplicationForm from "../application-form";

export const metadata: Metadata = {
  title: "July 2026 Application | Live Song War",
  description: "Apply to compete in the July 2026 Live Song War event.",
};

export default function July2026ApplicationPage() {
  return (
    <LandingLayout>
      <section className="apply-page">
        <header className="apply-header">
          <p className="apply-kicker">Canada · July 2026</p>
          <h1>
            SONG <em>WARS</em> APPLICATION
          </h1>
          <p>
            Tell us about yourself and upload a track. If accepted, you will be
            added to our exlcusive Song Wars discord server.
          </p>
        </header>
        <ApplicationForm />
      </section>
    </LandingLayout>
  );
}
