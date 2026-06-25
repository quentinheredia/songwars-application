import postgres from "postgres";
import {
  ACCEPTED_TRACK_TYPES,
  getSupabaseAdmin,
  MAX_TRACK_SIZE,
  TRACK_BUCKET,
} from "../../../lib/supabase-admin";

export const runtime = "nodejs";

class SubmissionError extends Error {}

type ApplicationInput = Record<string, unknown> & {
  genres?: unknown;
  track_path?: unknown;
};

function text(input: ApplicationInput, key: string, required = false) {
  const value = input[key];
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
  let uploadedTrackPath: string | null = null;
  let submissionSaved = false;

  try {
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

    const input = (await request.json()) as ApplicationInput;
    if (text(input, "website"))
      return Response.json({ message: "Application received." });
    const trackPath = text(input, "track_path", true);
    if (
      !trackPath?.match(
        /^submissions\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+-[^/]+$/i,
      )
    ) {
      throw new SubmissionError("The uploaded track path is invalid.");
    }
    uploadedTrackPath = trackPath;
    if (input.consent !== "on")
      throw new SubmissionError("You must confirm the submission agreement.");

    const homeTown = text(input, "home_town", true);
    const stageName = text(input, "stage_name", true);
    const spotifyHandle = text(input, "spotify_handle", true);
    const soundcloudHandle = text(input, "soundcloud_handle", true);
    const otherMusicLinks = text(input, "other_music_links", true);
    const instagramHandle = text(input, "instagram_handle", true);
    const tiktokHandle = text(input, "tiktok_handle");
    const youtubeChannel = text(input, "youtube_channel");
    const livePerformancesValue = text(input, "live_performances");
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

    const genres = Array.isArray(input.genres)
      ? input.genres.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    if (genres.length === 0)
      throw new SubmissionError("Select at least one genre.");
    if (genres.length > 9 || genres.some((genre) => genre.length > 60))
      throw new SubmissionError("The genre selection is invalid.");

    const supabase = getSupabaseAdmin();
    const { data: trackInfo, error: trackInfoError } = await supabase.storage
      .from(TRACK_BUCKET)
      .info(trackPath);
    if (trackInfoError || !trackInfo) {
      throw new SubmissionError("The uploaded track could not be verified.");
    }
    if (
      !trackInfo.size ||
      trackInfo.size > MAX_TRACK_SIZE ||
      !trackInfo.contentType ||
      !ACCEPTED_TRACK_TYPES.includes(trackInfo.contentType as never)
    ) {
      await supabase.storage.from(TRACK_BUCKET).remove([trackPath]);
      throw new SubmissionError("The uploaded track is not a valid audio file.");
    }

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
        youtube_channel, genres, track_path
      ) values (
        now(), ${homeTown}, ${livePerformances}, ${stageName}, ${spotifyHandle},
        ${soundcloudHandle}, ${otherMusicLinks}, ${instagramHandle}, ${tiktokHandle},
        ${youtubeChannel}, ${sql.json(genres)}, ${trackPath}
      ) returning id
    `;
    submissionSaved = true;

    const { data: signedTrack, error: signedTrackError } =
      await supabase.storage
        .from(TRACK_BUCKET)
        .createSignedUrl(trackPath, 60 * 60 * 24 * 7);
    if (signedTrackError) throw signedTrackError;

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
      ["Track", signedTrack.signedUrl],
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
        html: `<h1>New artist application</h1><p>Submission ID: ${inserted[0].id}</p><table cellpadding="8">${rows.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${label === "Track" && value ? `<a href="${escapeHtml(value)}">Listen to submitted track</a> <small>(link expires in 7 days)</small>` : escapeHtml(value)}</td></tr>`).join("")}</table>`,
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
    if (uploadedTrackPath && !submissionSaved) {
      try {
        await getSupabaseAdmin().storage
          .from(TRACK_BUCKET)
          .remove([uploadedTrackPath]);
      } catch (cleanupError) {
        console.error("Could not remove orphaned track:", cleanupError);
      }
    }
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
