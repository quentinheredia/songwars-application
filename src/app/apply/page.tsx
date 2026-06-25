import type { Metadata } from "next";
import LandingLayout from "../landing-layout";
import ApplicationForm from "./application-form";

export const metadata: Metadata = {
  title: "Apply | Live Song War",
  description: "Apply to compete in Live Song War.",
};

export default function ApplyPage() {
  return (
    <LandingLayout>
      <section className="apply-page">
        <header className="apply-header">
          <p className="apply-kicker">Artist submissions</p>
          <h1>ENTER THE <em>WAR</em></h1>
          <p>Tell us about your sound and send your strongest track. Fields marked with an asterisk are required.</p>
        </header>
        <ApplicationForm />
      </section>
    </LandingLayout>
  );
}
