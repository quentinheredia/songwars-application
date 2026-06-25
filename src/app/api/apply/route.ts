import postgres from "postgres";

export const runtime = "nodejs";

const MAX_TRACK_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TRACK_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/aac",
]);

class SubmissionError extends Error {}

function text(form: FormData, key: string, required = false) {
  const value = form.get(key);
  const normalized = typeof value === "string" ? value.trim() : "";
  const label = key.replaceAll("_", " ");
  if (required && !normalized)
    throw new SubmissionError(`${label} is required.`);
  if (normalized.length > 500)
    throw new SubmissionError(`${label} is too long.`);
  return normalized || null;
}

function escapeHtml(value: string | null) {
  return (value || "N/A")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  let sql: ReturnType<typeof postgres> | undefined;

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_TRACK_SIZE + 1024 * 1024) {
      throw new SubmissionError(
        "The complete application upload is too large.",
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.SUBMISSION_FROM_EMAIL;
    if (!databaseUrl || !resendApiKey || !fromEmail) {
      console.error(
        "Missing DATABASE_URL, RESEND_API_KEY, or SUBMISSION_FROM_EMAIL.",
      );
      return Response.json(
        {
          message:
            "Applications are temporarily unavailable. Please try again later.",
        },
        { status: 503 },
      );
    }

    const form = await request.formData();
    if (text(form, "website"))
      return Response.json({ message: "Application received." });
    if (form.get("consent") !== "on")
      throw new SubmissionError("You must confirm the submission agreement.");

    const homeTown = text(form, "home_town", true);
    const stageName = text(form, "stage_name", true);
    const spotifyHandle = text(form, "spotify_handle", true);
    const soundcloudHandle = text(form, "soundcloud_handle", true);
    const otherMusicLinks = text(form, "other_music_links", true);
    const instagramHandle = text(form, "instagram_handle", true);
    const tiktokHandle = text(form, "tiktok_handle");
    const youtubeChannel = text(form, "youtube_channel");
    const livePerformancesValue = text(form, "live_performances");
    const livePerformances =
      livePerformancesValue === null ? null : Number(livePerformancesValue);
    if (
      livePerformances !== null &&
      (!Number.isInteger(livePerformances) ||
        livePerformances < 0 ||
        livePerformances > 32767)
    ) {
      throw new SubmissionError("Live performances must be a valid number.");
    }

    const genres = form
      .getAll("genres")
      .filter((value): value is string => typeof value === "string");
    const otherGenre = text(form, "other_genre");
    if (otherGenre) genres.push(otherGenre);
    if (genres.length === 0)
      throw new SubmissionError("Select at least one genre.");
    if (genres.length > 9 || genres.some((genre) => genre.length > 60))
      throw new SubmissionError("The genre selection is invalid.");

    const track = form.get("track");
    if (!(track instanceof File) || track.size === 0)
      throw new SubmissionError("An audio track is required.");
    if (track.size > MAX_TRACK_SIZE)
      throw new SubmissionError("The audio track must be 10 MB or smaller.");
    if (!ACCEPTED_TRACK_TYPES.has(track.type))
      throw new SubmissionError("Upload an MP3, WAV, M4A, or AAC audio file.");
    const trackContent = Buffer.from(await track.arrayBuffer()).toString(
      "base64",
    );

    sql = postgres(databaseUrl, {
      ssl: "require",
      max: 1,
      idle_timeout: 10,
      connect_timeout: 10,
    });
    const inserted = await sql<{ id: number }[]>`
      insert into public."Submissions" (
        created_at, home_town, live_performances, stage_name, spotify_handle,
        soundcloud_handle, other_music_links, instagram_handle, tiktok_handle,
        youtube_channel, genres
      ) values (
        now(), ${homeTown}, ${livePerformances}, ${stageName}, ${spotifyHandle},
        ${soundcloudHandle}, ${otherMusicLinks}, ${instagramHandle}, ${tiktokHandle},
        ${youtubeChannel}, ${sql.json(genres)}
      ) returning id
    `;

    const rows: [string, string | null][] = [
      ["Stage name", stageName],
      ["Home town", homeTown],
      ["Live performances", livePerformances?.toString() || "Not provided"],
      ["Spotify", spotifyHandle],
      ["SoundCloud", soundcloudHandle],
      ["Other music", otherMusicLinks],
      ["Instagram", instagramHandle],
      ["TikTok", tiktokHandle],
      ["YouTube", youtubeChannel],
      ["Genres", genres.join(", ")],
    ];
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ["info@livesongwars.com"],
        cc: ["qnheredia@gmail.com", "lilyen43@gmail.com"],
        subject: `New Live Song War application: ${stageName}`,
        html: `<h1>New artist application</h1><p>Submission ID: ${inserted[0].id}</p><table cellpadding="8">${rows.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join("")}</table>`,
        attachments: [
          {
            filename: track.name.replaceAll(/[^a-zA-Z0-9._-]/g, "_"),
            content: trackContent,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      console.error(
        "Email provider rejected submission:",
        await emailResponse.text(),
      );
      return Response.json(
        {
          message:
            "Application saved, but the notification email could not be delivered. The Live Song War team can still review it in the database.",
          id: inserted[0].id,
          emailSent: false,
        },
        { status: 201 },
      );
    }

    return Response.json(
      { message: "Application received. We will contact selected artists directly.", id: inserted[0].id, emailSent: true },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SubmissionError)
      return Response.json({ message: error.message }, { status: 400 });
    console.error("Application submission failed:", error);
    return Response.json(
      { message: "We could not submit your application. Please try again." },
      { status: 500 },
    );
  } finally {
    await sql?.end({ timeout: 2 });
  }
}
