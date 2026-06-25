"use client";

import { FormEvent, InputHTMLAttributes, useRef, useState } from "react";

const GENRES = ["Hip-Hop", "Trap", "RNB", "EDM", "Rock", "Melodic", "Rap", "Rage"];

type Status = { type: "idle" | "submitting" | "success" | "error"; message?: string };

export default function ApplicationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [fileName, setFileName] = useState("");

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "submitting" });

    try {
      const response = await fetch("/api/apply", { method: "POST", body: new FormData(event.currentTarget) });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "We could not submit your application.");

      formRef.current?.reset();
      setFileName("");
      setStatus({ type: "success", message: payload.message || "Application received." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "We could not submit your application.",
      });
    }
  }

  return (
    <form ref={formRef} className="application-form" onSubmit={submitApplication} encType="multipart/form-data">
      <input className="form-honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" />

      {status.type === "success" && <div className="form-notice success" role="status">{status.message}</div>}
      {status.type === "error" && <div className="form-notice error" role="alert">{status.message}</div>}

      <fieldset className="form-section">
        <legend><span>01</span> Performance profile</legend>
        <div className="form-grid two-columns">
          <FormField label="What city are you from?" name="home_town" required autoComplete="address-level2" />
          <FormField label="How many times have you performed live?" name="live_performances" type="number" min="0" max="32767" inputMode="numeric" />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend><span>02</span> Artist details</legend>
        <div className="form-grid">
          <FormField label="Stage name" name="stage_name" required autoComplete="organization" />
          <div className="form-grid two-columns">
            <FormField label="Spotify" name="spotify_handle" required placeholder="Link, handle, or N/A" />
            <FormField label="SoundCloud" name="soundcloud_handle" required placeholder="Link, handle, or N/A" />
          </div>
          <FormField label="Other music platform" name="other_music_links" required placeholder="Link or N/A" />
          <div className="form-grid two-columns">
            <FormField label="Instagram handle" name="instagram_handle" required placeholder="@yourname" />
            <FormField label="TikTok username" name="tiktok_handle" placeholder="@yourname" />
          </div>
          <FormField label="YouTube channel link" name="youtube_channel" type="url" placeholder="https://youtube.com/..." />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend><span>03</span> Your music</legend>
        <div className="genre-field">
          <span className="field-label">What genres best describe your music? <b>*</b></span>
          <div className="genre-grid">
            {GENRES.map((genre) => (
              <label className="genre-option" key={genre}>
                <input type="checkbox" name="genres" value={genre} />
                <span>{genre}</span>
              </label>
            ))}
          </div>
          <label className="other-genre">
            <span>Other genre</span>
            <input name="other_genre" maxLength={60} placeholder="Tell us your sound" />
          </label>
        </div>

        <label className="upload-field">
          <span className="field-label">Upload your best track <b>*</b></span>
          <span className="upload-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4" /></svg>
            <strong>{fileName || "Choose an audio file"}</strong>
            <small>MP3, WAV, M4A or AAC, up to 10 MB</small>
          </span>
          <input
            type="file"
            name="track"
            accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,.mp3,.wav,.m4a,.aac"
            required
            onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
          />
        </label>
      </fieldset>

      <label className="form-consent">
        <input type="checkbox" name="consent" required />
        <span>I have the right to submit this music and agree to be contacted about Live Song War. <b>*</b></span>
      </label>

      <button className="submit-application" type="submit" disabled={status.type === "submitting"}>
        {status.type === "submitting" ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

function FormField({ label, required, ...inputProps }: FieldProps) {
  return (
    <label className="form-field">
      <span>{label} {required && <b>*</b>}</span>
      <input {...inputProps} required={required} maxLength={inputProps.type === "number" ? undefined : 500} />
    </label>
  );
}
